"""Bugzero Crawler — crawls a website and analyzes every page for issues."""

import asyncio
import random
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

from playwright.async_api import async_playwright
from pydantic import BaseModel
from rich.console import Console

from .page_analyzer import PageAnalyzer, PageAnalysis
from .page_classifier import PageClassifier
from .utils import is_same_domain, is_valid_url, normalize_url

console = Console()


# ── Data Models ──────────────────────────────────────────────────────────────


class PageResult(BaseModel):
    url: str
    page_type: str
    title: str
    status_code: int
    analysis: PageAnalysis
    crawled_at: str


class CrawlResult(BaseModel):
    start_url: str
    total_pages: int
    pages: list[PageResult]
    total_broken_links: int
    total_broken_images: int
    total_missing_alts: int
    total_form_issues: int
    crawl_duration_seconds: float
    crawled_at: str


# ── Crawler ──────────────────────────────────────────────────────────────────


class BugzeroCrawler:
    """Crawls a website, discovers pages, and analyzes each one for issues."""

    def __init__(self, start_url: str, max_pages: int = 50, screenshots_dir: str = "screenshots"):
        self.start_url = start_url
        self.max_pages = max_pages
        self._visited: set[str] = set()      # URLs fully processed
        self._enqueued: set[str] = set()      # URLs added to queue (dedup)
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._analyzer = PageAnalyzer(screenshots_dir=screenshots_dir)
        self._classifier = PageClassifier()
        self._results: list[PageResult] = []

    async def crawl(self) -> CrawlResult:
        """Run the full crawl and return structured results."""
        start_time = time.time()

        console.print(f"\n[bold cyan]{'═' * 60}[/bold cyan]")
        console.print(f"[bold cyan]  BUGZERO CRAWLER — Real Browser Testing[/bold cyan]")
        console.print(f"[bold cyan]{'═' * 60}[/bold cyan]")
        console.print(f"  Target:     [bold]{self.start_url}[/bold]")
        console.print(f"  Max pages:  {self.max_pages}")
        console.print(f"  Browser:    Chromium (headless)")
        console.print(f"[bold cyan]{'═' * 60}[/bold cyan]\n")

        await self._queue.put(self.start_url)
        self._enqueued.add(self.start_url)

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent="Bugzero/1.0 (Autonomous QA Bot)",
            )

            # Capture console errors on every page via context
            page = await context.new_page()
            console_errors: list[str] = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

            while not self._queue.empty() and len(self._visited) < self.max_pages:
                url = await self._queue.get()

                if url in self._visited:
                    continue

                self._visited.add(url)          # mark as visited *now*
                page_num = len(self._visited)

                console.print(f"[bold blue][CRAWLER]  🔍 Visiting: {url}  (page {page_num}/{self.max_pages})[/bold blue]")

                try:
                    console_errors.clear()
                    result = await self._visit_page(page, url, console_errors)
                    self._results.append(result)

                    issue_count = (
                        len(result.analysis.broken_links)
                        + len(result.analysis.broken_images)
                        + len(result.analysis.missing_alts)
                    )
                    console.print(
                        f"[bold green][CRAWLER]  ✅ Done: {url} — "
                        f"{issue_count} issue(s) found | Type: {result.page_type}[/bold green]\n"
                    )
                except Exception as e:
                    console.print(f"[bold red][CRAWLER]  💥 Failed: {url} — {e}[/bold red]\n")

                # Polite delay between pages
                if not self._queue.empty():
                    delay = random.uniform(0.3, 1.0)
                    await asyncio.sleep(delay)

            await context.close()
            await browser.close()

        duration = round(time.time() - start_time, 2)

        crawl_result = CrawlResult(
            start_url=self.start_url,
            total_pages=len(self._results),
            pages=self._results,
            total_broken_links=sum(len(p.analysis.broken_links) for p in self._results),
            total_broken_images=sum(len(p.analysis.broken_images) for p in self._results),
            total_missing_alts=sum(len(p.analysis.missing_alts) for p in self._results),
            total_form_issues=sum(len(p.analysis.form_issues) for p in self._results),
            crawl_duration_seconds=duration,
            crawled_at=datetime.now(timezone.utc).isoformat(),
        )

        return crawl_result

    async def _visit_page(self, page, url: str, console_errors: list[str]) -> PageResult:
        """Navigate to a page, analyze it, discover links, and return a PageResult."""
        response = await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        status_code = response.status if response else 0

        title = await page.title()
        html = await page.content()

        # Classify page type
        page_type = self._classifier.classify(html, url)
        console.print(f"  [magenta][CLASSIFY] 📋 Page type: {page_type}[/magenta]")

        # Analyze page for issues
        analysis = await self._analyzer.analyze(page, url)
        analysis.console_errors = list(console_errors)

        if console_errors:
            console.print(f"  [yellow][ANALYZER] ⚠️  {len(console_errors)} console error(s) detected[/yellow]")

        # Discover links and add to queue
        new_links = await self._discover_links(page, url)
        if new_links:
            console.print(f"  [dim][CRAWLER]  🔗 Discovered {len(new_links)} new link(s) to crawl[/dim]")

        return PageResult(
            url=url,
            page_type=page_type,
            title=title,
            status_code=status_code,
            analysis=analysis,
            crawled_at=datetime.now(timezone.utc).isoformat(),
        )

    async def _discover_links(self, page, base_url: str) -> list[str]:
        """Extract all same-domain links from the page and add unseen ones to the queue."""
        new_links: list[str] = []
        try:
            raw_links = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.href)
                    .filter(href => href.startsWith('http'));
            }""")

            for href in raw_links:
                normalized = normalize_url(href, base_url)
                if (
                    is_same_domain(normalized, self.start_url)
                    and is_valid_url(normalized)
                    and normalized not in self._enqueued
                ):
                    self._enqueued.add(normalized)  # mark enqueued to avoid dupes
                    await self._queue.put(normalized)
                    new_links.append(normalized)

                    # Don't queue more than remaining capacity
                    if len(self._enqueued) >= self.max_pages:
                        break
        except Exception:
            pass

        return new_links
