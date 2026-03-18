"""Orchestrator — coordinates the full autonomous test pipeline.

Pipeline stages:
  1. CRAWL      — BFS discovers all pages (CrawlerAgent)
  2. PAGERANK   — Score pages by importance (Scheduler)
  3. TEST LOOP  — For each page (priority order):
       a. Basic tests          (TesterAgent — SEO, links, forms, perf)
       b. axe-core             (Accessibility WCAG audit)
       c. Gemini Vision        (AI visual bug detection — optional)
  4. REPORT     — Aggregate everything into compliance report (ReportAgent)
"""

import asyncio
import logging
import httpx
from models.schemas import TestRequest, TestResult, TestConfig, SiteReport, DefectResult, ComplianceViolation
from agents.crawler import CrawlerAgent
from agents.tester import TesterAgent
from agents.scheduler import calculate_pagerank, greedy_sort
from agents.vision_agent import VisionAgent
from agents.report_agent import ReportAgent
from tools.playwright_tool import PlaywrightTool
from tools.axe_tool import run_axe_sync
from config import settings

logger = logging.getLogger(__name__)


class Orchestrator:
    """Manages the end-to-end autonomous test pipeline."""

    def __init__(self):
        self.active_runs: set[str] = set()

    def cancel(self, run_id: str) -> bool:
        """Request cancellation of a run."""
        if run_id in self.active_runs:
            self.active_runs.discard(run_id)
            return True
        return False

    async def _report_progress(self, event: str, payload: dict) -> None:
        """Fire-and-forget incremental progress update to gateway."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{settings.gateway_url}/api/tests/progress",
                    json={"event": event, **payload},
                )
        except Exception as e:
            logger.warning(f"[progress] {event} report failed (non-fatal): {e}")

    async def run_test(self, request: TestRequest) -> TestResult:
        """Execute a full autonomous test run through all pipeline stages."""
        config = request.config or TestConfig()
        run_id = request.run_id
        self.active_runs.add(run_id)

        # Create tools and agents
        playwright = PlaywrightTool(
            headless=settings.headless,
            browser_type=settings.browser,
        )
        crawler = CrawlerAgent(playwright)
        tester = TesterAgent(playwright)
        vision = VisionAgent(api_key=settings.gemini_api_key)
        report_agent = ReportAgent()

        try:
            await playwright.start()

            # ────────────────────────────────────────────────
            #  STAGE 1: CRAWL — Discover all pages via BFS
            # ────────────────────────────────────────────────
            logger.info(f"[{run_id}] Stage 1: BFS Crawl starting on {request.url}")

            loop = asyncio.get_running_loop()

            def on_page_discovered(page_data):
                # Send fire-and-forget sync/threadsafe async progress update to gateway
                asyncio.run_coroutine_threadsafe(
                    self._report_progress("page_discovered", {"run_id": run_id, "page": page_data}),
                    loop
                )

            # Determine max_pages logic (allow explicit override, otherwise base on depth)
            if config.max_pages is not None:
                max_pages = config.max_pages
            else:
                max_pages = 5 if config.crawl_depth == "shallow" else (100 if config.crawl_depth == "deep" else 20)

            discovered = await crawler.crawl(
                request.url,
                depth=config.crawl_depth,
                max_pages=max_pages,
                on_page=on_page_discovered
            )

            if not discovered:
                return TestResult(
                    run_id=run_id,
                    url=request.url,
                    status="failed",
                    pages=[],
                    overall_score=0,
                    total_defects=0,
                )

            # Report crawl complete
            await self._report_progress("crawl_complete", {
                "run_id": run_id,
                "total_pages": len(discovered),
            })

            logger.info(f"[{run_id}] Stage 1 complete: {len(discovered)} pages discovered")

            # ────────────────────────────────────────────────
            #  STAGE 2: PAGERANK — Score and sort pages
            # ────────────────────────────────────────────────
            logger.info(f"[{run_id}] Stage 2: PageRank scoring")

            scores = calculate_pagerank(discovered)
            discovered = greedy_sort(discovered, scores)

            # Report pagerank complete
            await self._report_progress("pagerank_complete", {
                "run_id": run_id,
                "scores": {url: round(score, 4) for url, score in scores.items()},
            })

            logger.info(f"[{run_id}] Stage 2 complete: pages sorted by importance")

            # ────────────────────────────────────────────────
            #  STAGE 3: TEST LOOP — Test each page
            #    a) Basic tests (TesterAgent)
            #    b) axe-core accessibility (Stage 5)
            #    c) Gemini Vision (Stage 4 — optional)
            # ────────────────────────────────────────────────
            logger.info(f"[{run_id}] Stage 3: Testing pages (basic + axe-core + vision)")

            pages = []
            total_defects = 0

            for i, page_info in enumerate(discovered):
                # Check for cancellation
                if run_id not in self.active_runs:
                    return TestResult(
                        run_id=run_id,
                        url=request.url,
                        status="cancelled",
                        pages=pages,
                        overall_score=0,
                        total_defects=total_defects,
                    )

                url = page_info["url"]
                logger.info(f"[{run_id}] Testing page {i+1}/{len(discovered)}: {url}")

                try:
                    # ── 3a: Basic tests (SEO, links, forms, performance) ──
                    page_result = await tester.test_page(
                        url,
                        modules=config.modules,
                    )
                    page_result.page_type = page_info.get("page_type", "Content")
                    page_result.pagerank_score = page_info.get("pagerank_score", 0)

                    # ── 3b: axe-core accessibility scan ──
                    try:
                        axe_violations = await playwright.run_axe(url)
                        for v in axe_violations:
                            page_result.compliance.append(ComplianceViolation(
                                standard=v.get("standard", "WCAG"),
                                criterion=v.get("criterion", "General"),
                                severity=v.get("severity", "minor"),
                                description=v.get("description", ""),
                                remediation=v.get("remediation", ""),
                                rule_id=v.get("rule_id", ""),
                                help_url=v.get("help_url", ""),
                                affected_elements=v.get("affected_elements", []),
                                instance_count=v.get("instance_count"),
                            ))
                        logger.info(f"  axe-core: {len(axe_violations)} violation(s)")
                    except Exception as e:
                        logger.warning(f"  axe-core failed on {url}: {e}")

                    # ── 3c: Gemini Vision analysis (optional) ──
                    if vision.is_available():
                        try:
                            screenshot_bytes = await playwright.take_screenshot(url)
                            if screenshot_bytes:
                                vision_result = await vision.analyze_screenshot(screenshot_bytes, url)
                                page_result.vision_quality_score = vision_result.get("page_quality_score")

                                for vd in vision_result.get("defects", []):
                                    page_result.defects.append(DefectResult(
                                        type=vd.get("type", "Visual"),
                                        severity=vd.get("severity", "minor"),
                                        message=vd.get("message", ""),
                                        fix=vd.get("fix"),
                                        source="gemini_vision",
                                        location=vd.get("location"),
                                        confidence=vd.get("confidence", 0.85),
                                    ))
                                logger.info(f"  Vision: {len(vision_result.get('defects', []))} issue(s), score: {vision_result.get('page_quality_score')}")
                        except Exception as e:
                            logger.warning(f"  Vision failed on {url}: {e}")

                    # Recalculate hygiene score with new defects
                    severity_weights = {"critical": 15, "major": 8, "minor": 3, "warning": 1}
                    penalty = sum(severity_weights.get(d.severity, 3) for d in page_result.defects)
                    penalty += sum(severity_weights.get(v.severity, 2) for v in page_result.compliance)
                    page_result.hygiene_score = max(0, min(100, 100 - penalty))

                    pages.append(page_result)
                    total_defects += len(page_result.defects)

                    # Incremental progress update to gateway
                    await self._report_progress("page_complete", {
                        "run_id": run_id,
                        "page": page_result.model_dump(),
                    })

                except Exception as e:
                    logger.error(f"Error testing page {url}: {e}")
                    continue

            logger.info(f"[{run_id}] Stage 3 complete: {len(pages)} pages tested, {total_defects} defects")

            # ────────────────────────────────────────────────
            #  STAGE 4: REPORT — Generate compliance report
            # ────────────────────────────────────────────────
            logger.info(f"[{run_id}] Stage 4: Generating compliance report")

            report_data = report_agent.generate_report(pages, request.url)
            report = SiteReport(**report_data)

            # Report completion
            await self._report_progress("report_complete", {
                "run_id": run_id,
                "report": report.model_dump(),
            })

            logger.info(
                f"[{run_id}] Pipeline complete: score={report.overall_score}, "
                f"grade={report.grade}, defects={report.total_defects}"
            )

            # Calculate overall score
            overall_score = report.overall_score

            return TestResult(
                run_id=run_id,
                url=request.url,
                status="completed",
                pages=pages,
                overall_score=round(overall_score, 1),
                total_defects=total_defects,
                report=report,
            )

        finally:
            self.active_runs.discard(run_id)
            await playwright.stop()
