"""Orchestrator — coordinates the full autonomous test pipeline.

Pipeline stages:
  0. PRE-STAGE  — Chaos injection & Authentication (optional)
  1. CRAWL      — BFS discovers all pages (CrawlerAgent)
  2. PAGERANK   — Score pages by importance + defect history + change detection (Scheduler)
  3. TEST LOOP  — For each page (priority order):
       a. Self-healing  (Fingerprint + detect broken selectors)
       b. Basic tests   (TesterAgent — SEO, links, forms, perf)
       c. axe-core      (Accessibility WCAG audit)
       d. Gemini Vision (AI visual bug detection + regression diff)
  4. REPORT     — Aggregate everything into compliance report (ReportAgent)
"""

import asyncio
import base64
import logging
import httpx
from models.schemas import (
    TestRequest, TestResult, TestConfig, SiteReport, DefectResult,
    ComplianceViolation, HealingEventResult, VisualRegressionChange,
)
from agents.crawler import CrawlerAgent
from agents.tester import TesterAgent
from agents.scheduler import calculate_pagerank, greedy_sort
from agents.vision_agent import VisionAgent
from agents.report_agent import ReportAgent
from agents.auth_agent import AuthAgent
from agents.chaos_agent import ChaosAgent
from agents.self_healing_agent import SelfHealingAgent
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

    async def _fetch_defect_history(self, url: str) -> tuple[dict, dict]:
        """Fetch defect history and previous scores from gateway for risk prioritization.

        Returns (defect_history, previous_scores) dicts.
        """
        defect_history = {}
        previous_scores = {}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{settings.gateway_url}/api/tests/history/lookup",
                    params={"url": url},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    defect_history = data.get("defect_history", {})
                    previous_scores = data.get("previous_scores", {})
                    logger.info(f"Fetched defect history: {len(defect_history)} pages with history")
        except Exception as e:
            logger.warning(f"Could not fetch defect history (non-fatal): {e}")
        return defect_history, previous_scores

    async def _fetch_baseline(self, url: str, org_id: str) -> bytes | None:
        """Fetch baseline screenshot from gateway."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{settings.gateway_url}/api/baselines",
                    params={"url": url, "orgId": org_id},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    b64 = data.get("screenshotB64")
                    if b64:
                        return base64.b64decode(b64)
        except Exception as e:
            logger.debug(f"No baseline for {url}: {e}")
        return None

    async def _save_baseline(self, url: str, org_id: str, screenshot_bytes: bytes) -> None:
        """Save/update baseline screenshot in gateway."""
        try:
            b64 = base64.b64encode(screenshot_bytes).decode("utf-8")
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{settings.gateway_url}/api/baselines",
                    json={"url": url, "orgId": org_id, "screenshotB64": b64},
                )
        except Exception as e:
            logger.warning(f"Failed to save baseline for {url}: {e}")

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
        auth_agent = AuthAgent(playwright, api_key=settings.gemini_api_key)
        chaos_agent = ChaosAgent(playwright)
        healing_agent = SelfHealingAgent(
            playwright_tool=playwright,
            api_key=settings.gemini_api_key,
        )

        try:
            await playwright.start()

            
            # ────────────────────────────────────────────────
            #  PRE-STAGE: CHAOS & AUTH
            # ────────────────────────────────────────────────
            if getattr(config, "chaos_mode", False):
                logger.info(f"[{run_id}] Stage 0: Injecting Chaos (Slow 3G, 4x CPU Throttling)")
                await chaos_agent.inject_network_chaos('Slow 3G')
                await chaos_agent.inject_cpu_throttling(4)

            if getattr(config, "auth_enabled", False) and getattr(config, "auth_username", None) and getattr(config, "auth_password", None):
                logger.info(f"[{run_id}] Stage 0: Autonomous Authentication on {request.url}")
                success = await auth_agent.authenticate(request.url, config.auth_username, config.auth_password)
                if not success:
                    logger.warning(f"[{run_id}] Auth failed, but continuing crawl.")

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
            #  STAGE 2: PAGERANK + RISK SCORING
            # ────────────────────────────────────────────────
            logger.info(f"[{run_id}] Stage 2: PageRank + defect history + change detection scoring")

            scores = calculate_pagerank(discovered)

            # Fetch defect history from previous runs for risk-based prioritization
            defect_history, previous_scores = await self._fetch_defect_history(request.url)

            discovered = greedy_sort(
                discovered,
                scores,
                defect_history=defect_history,
                previous_scores=previous_scores,
            )

            # Report pagerank complete
            await self._report_progress("pagerank_complete", {
                "run_id": run_id,
                "scores": {url: round(score, 4) for url, score in scores.items()},
            })

            logger.info(f"[{run_id}] Stage 2 complete: pages sorted by risk priority")

            # ────────────────────────────────────────────────
            #  STAGE 3: TEST LOOP — Test each page
            #    a) Self-healing (fingerprint + detect broken selectors)
            #    b) Basic tests (TesterAgent)
            #    c) axe-core accessibility (WCAG audit)
            #    d) Gemini Vision (AI visual bug detection + regression)
            # ────────────────────────────────────────────────
            logger.info(f"[{run_id}] Stage 3: Testing pages (self-heal + basic + axe-core + vision)")

            pages = []
            total_defects = 0

            # Determine org_id for baseline lookups (default to run_id if not available)
            org_id = getattr(config, "org_id", None) or run_id

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
                    # ── 3a: Self-Healing — detect broken selectors ──
                    page_healing_events = []
                    if "functional" in config.modules and healing_agent.is_available():
                        try:
                            browser_page = await playwright.get_page(url)
                            if browser_page:
                                healing_results = await healing_agent.detect_and_heal(browser_page, url)
                                for h in healing_results:
                                    page_healing_events.append(HealingEventResult(
                                        original_selector=h["original_selector"],
                                        healed_selector=h["healed_selector"],
                                        element_id=h["element_id"],
                                        confidence=h["confidence"],
                                    ))
                                logger.info(f"  Self-healing: {len(healing_results)} selector(s) healed")
                        except Exception as e:
                            logger.warning(f"  Self-healing failed on {url}: {e}")

                    # ── 3b: Basic tests (SEO, links, forms, performance) ──
                    page_result = await tester.test_page(
                        url,
                        modules=config.modules,
                    )
                    page_result.page_type = page_info.get("page_type", "Content")
                    page_result.pagerank_score = page_info.get("pagerank_score", 0)
                    page_result.healing_events = page_healing_events

                    # ── 3c: axe-core accessibility scan ──
                    if "accessibility" in config.modules:
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

                    # ── 3d: Gemini Vision analysis + Regression ──
                    if "visual" in config.modules and vision.is_available():
                        try:
                            screenshot_bytes = await playwright.take_screenshot(url)
                            if screenshot_bytes:
                                # Single-run visual bug detection
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

                                # Visual Regression — compare against baseline
                                try:
                                    baseline_bytes = await self._fetch_baseline(url, org_id)
                                    if baseline_bytes:
                                        regression_result = await vision.compare_screenshots(
                                            baseline_bytes, screenshot_bytes, url
                                        )
                                        for change in regression_result.get("changes", []):
                                            page_result.visual_regression.append(VisualRegressionChange(
                                                change_type=change.get("change_type", "cosmetic"),
                                                severity=change.get("severity", "minor"),
                                                description=change.get("description", ""),
                                                location=change.get("location"),
                                                confidence=change.get("confidence", 0.8),
                                            ))
                                            # Save visual regression changes as visual defects so they are persisted
                                            page_result.defects.append(DefectResult(
                                                type="Visual",
                                                severity=change.get("severity", "minor"),
                                                message=f"Visual Regression: {change.get('description', '')}",
                                                fix="Verify if layout change is intentional. If so, update the baseline.",
                                                source="gemini_vision",
                                                location=change.get("location"),
                                                confidence=change.get("confidence", 0.8),
                                            ))
                                        if regression_result.get("changes"):
                                            logger.info(f"  Regression: {len(regression_result['changes'])} change(s) vs baseline")
                                    else:
                                        logger.info(f"  Regression: No baseline for {url} — first run, saving baseline")
                                except Exception as e:
                                    logger.warning(f"  Regression comparison failed on {url}: {e}")

                                # Save current screenshot as new baseline
                                try:
                                    await self._save_baseline(url, org_id, screenshot_bytes)
                                except Exception as e:
                                    logger.warning(f"  Failed to save baseline for {url}: {e}")

                        except Exception as e:
                            logger.warning(f"  Vision failed on {url}: {e}")

                    # ── 3e: Post-test fingerprinting for self-healing ──
                    if healing_agent.is_available():
                        try:
                            browser_page = await playwright.get_page(url)
                            if browser_page:
                                await healing_agent.fingerprint_page(browser_page, url)
                        except Exception as e:
                            logger.debug(f"  Post-test fingerprinting failed on {url}: {e}")

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
