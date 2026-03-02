"""Orchestrator — coordinates the full autonomous test pipeline."""

import asyncio
from models.schemas import TestRequest, TestResult, TestConfig
from agents.crawler import CrawlerAgent
from agents.tester import TesterAgent
from tools.playwright_tool import PlaywrightTool
from config import settings


class Orchestrator:
    """Manages the end-to-end autonomous test pipeline."""

    def __init__(self):
        self.playwright = PlaywrightTool(
            headless=settings.headless,
            browser_type=settings.browser,
        )
        self.active_runs: set[str] = set()

    def cancel(self, run_id: str) -> bool:
        """Request cancellation of a run."""
        if run_id in self.active_runs:
            self.active_runs.discard(run_id)
            return True
        return False

    async def run_test(self, request: TestRequest) -> TestResult:
        """Execute a full autonomous test run."""
        config = request.config or TestConfig()
        crawler = CrawlerAgent(self.playwright)
        tester = TesterAgent(self.playwright)
        run_id = request.run_id
        self.active_runs.add(run_id)

        try:
            await self.playwright.start()

            # Stage 1: Crawl and discover pages
            discovered = await crawler.crawl(
                request.url,
                depth=config.crawl_depth,
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

            # Stage 2: Test each discovered page
            pages = []
            total_defects = 0

            for page_info in discovered:
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

                try:
                    page_result = await tester.test_page(
                        page_info["url"],
                        modules=config.modules,
                    )
                    page_result.page_type = page_info.get("page_type", "Content")
                    pages.append(page_result)
                    total_defects += len(page_result.defects)
                except Exception as e:
                    print(f"Error testing page {page_info['url']}: {e}")
                    continue

            # Calculate overall score
            if pages:
                scores = [p.hygiene_score for p in pages if p.hygiene_score is not None]
                overall_score = sum(scores) / len(scores) if scores else 0
            else:
                overall_score = 0

            return TestResult(
                run_id=run_id,
                url=request.url,
                status="completed",
                pages=pages,
                overall_score=round(overall_score, 1),
                total_defects=total_defects,
            )

        finally:
            self.active_runs.discard(run_id)
            await self.playwright.stop()
