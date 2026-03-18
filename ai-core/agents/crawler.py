"""Crawler Agent — discovers all pages in a web application."""

from tools.playwright_tool import PlaywrightTool


class CrawlerAgent:
    """Crawls a target URL and discovers all reachable pages."""

    def __init__(self, playwright_tool: PlaywrightTool):
        self.tool = playwright_tool

    async def crawl(self, url: str, depth: str = "standard", max_pages: int = 50, on_page=None) -> list[dict]:
        """Execute BFS crawl using autonomous crawler logic.
        
        Depth maps:
          shallow  -> max depth 1
          standard -> max depth 3
          deep     -> max depth 999
        """
        # Assuming logger is imported elsewhere or will be handled by the user
        # from loguru import logger
        # logger.info(f"Crawler started on {url} (depth={depth}, max_pages={max_pages})")
        depth_map = {"shallow": 1, "standard": 3, "deep": 999}
        max_d = depth_map.get(depth, 3)
        return await self.tool.crawl(url, max_pages=max_pages, max_depth=max_d, on_page=on_page)
