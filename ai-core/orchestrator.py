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

    async def run_test(self, request: TestRequest) -> TestResult:
        """Execute a full autonomous test run."""
        config = request.config or TestConfig()
        crawler = CrawlerAgent(self.playwright)
        tester = TesterAgent(self.playwright)

        try:
            await self.playwright.start()

            # Stage 1: Crawl and discover pages
            discovered = await crawler.crawl(
                request.url,
                depth=config.crawl_depth,
            )

            if not discovered:
                return TestResult(
                    run_id=request.run_id,
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
                page_result = await tester.test_page(
                    page_info["url"],
                    modules=config.modules,
                )
                page_result.page_type = page_info.get("page_type", "Content")
                pages.append(page_result)
                total_defects += len(page_result.defects)

            # Calculate overall score
            if pages:
                scores = [p.hygiene_score for p in pages if p.hygiene_score is not None]
                overall_score = sum(scores) / len(scores) if scores else 0
            else:
                overall_score = 0

            return TestResult(
                run_id=request.run_id,
                url=request.url,
                status="completed",
                pages=pages,
                overall_score=round(overall_score, 1),
                total_defects=total_defects,
            )

        finally:
            await self.playwright.stop()
