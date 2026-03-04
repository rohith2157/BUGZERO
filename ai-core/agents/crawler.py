"""Crawler Agent — discovers all pages in a web application."""

from tools.playwright_tool import PlaywrightTool


class CrawlerAgent:
    """Crawls a target URL and discovers all reachable pages."""

    def __init__(self, playwright_tool: PlaywrightTool):
        self.tool = playwright_tool

    async def crawl(self, url: str, depth: str = "standard") -> list[dict]:
        # max_pages = page count limit, max_depth = URL level cap
        # shallow: 5 pages, only root + its direct links (depth 0 and 1)
        # standard: 20 pages, up to 3 levels deep
        # deep: 100 pages, no depth cap — follows all links until max_pages
        config = {
            "shallow":  {"max_pages": 5,   "max_depth": 1},
            "standard": {"max_pages": 20,  "max_depth": 3},
            "deep":     {"max_pages": 100, "max_depth": 999},
        }.get(depth, {"max_pages": 20, "max_depth": 3})
        pages = await self.tool.crawl(url, **config)
        return pages
