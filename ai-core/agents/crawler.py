"""Crawler Agent — discovers all pages in a web application."""

from tools.playwright_tool import PlaywrightTool


class CrawlerAgent:
    """Crawls a target URL and discovers all reachable pages."""

    def __init__(self, playwright_tool: PlaywrightTool):
        self.tool = playwright_tool

    async def crawl(self, url: str, depth: str = "standard") -> list[dict]:
        max_pages = {"shallow": 10, "standard": 50, "deep": 200}.get(depth, 50)
        pages = await self.tool.crawl(url, max_pages=max_pages)
        return pages
