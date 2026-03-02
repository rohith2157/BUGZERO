"""Page analyzer — inspects each page for broken links, images, accessibility, forms, and performance."""

import asyncio
import time
from typing import Optional
from urllib.parse import urljoin, urlparse

import aiohttp
from pydantic import BaseModel
from rich.console import Console

from .utils import sanitize_url_for_filename

console = Console()


# ── Pydantic Models ──────────────────────────────────────────────────────────


class BrokenLink(BaseModel):
    url: str
    status_code: int
    link_text: str


class BrokenImage(BaseModel):
    src: str
    alt: str
    status_code: int


class MissingAlt(BaseModel):
    src: str


class FormIssue(BaseModel):
    action: str
    method: str
    has_labels: bool
    input_count: int


class PageAnalysis(BaseModel):
    broken_links: list[BrokenLink] = []
    broken_images: list[BrokenImage] = []
    missing_alts: list[MissingAlt] = []
    form_issues: list[FormIssue] = []
    console_errors: list[str] = []
    load_time_ms: float = 0
    dom_element_count: int = 0
    screenshot_path: Optional[str] = None


# ── Analyzer ─────────────────────────────────────────────────────────────────


class PageAnalyzer:
    """Analyzes a single page for broken links, broken images, missing alt text, form issues, and performance."""

    def __init__(self, screenshots_dir: str = "screenshots"):
        self._screenshots_dir = screenshots_dir

    async def analyze(self, page, url: str) -> PageAnalysis:
        """Run all checks on a loaded Playwright page and return a PageAnalysis."""
        analysis = PageAnalysis()

        # Performance: load time
        try:
            timing = await page.evaluate("""() => {
                const t = performance.timing;
                return { start: t.navigationStart, end: t.loadEventEnd };
            }""")
            if timing["end"] > 0 and timing["start"] > 0:
                analysis.load_time_ms = round(timing["end"] - timing["start"], 1)
        except Exception:
            pass

        # DOM element count
        try:
            analysis.dom_element_count = await page.evaluate(
                "() => document.querySelectorAll('*').length"
            )
        except Exception:
            pass

        # Run link checks, image checks, form checks, and screenshot in parallel
        link_task = asyncio.create_task(self._check_links(page, url))
        image_task = asyncio.create_task(self._check_images(page, url))
        alt_task = asyncio.create_task(self._check_missing_alts(page))
        form_task = asyncio.create_task(self._check_forms(page))
        screenshot_task = asyncio.create_task(self._take_screenshot(page, url))

        broken_links = await link_task
        broken_images, _ = await image_task
        missing_alts = await alt_task
        form_issues = await form_task
        screenshot_path = await screenshot_task

        analysis.broken_links = broken_links
        analysis.broken_images = broken_images
        analysis.missing_alts = missing_alts
        analysis.form_issues = form_issues
        analysis.screenshot_path = screenshot_path

        # Log findings
        if broken_links:
            for bl in broken_links:
                console.print(f"  [red][ANALYZER] ❌ Broken link: {bl.url} ({bl.status_code})[/red]")
        if broken_images:
            for bi in broken_images:
                console.print(f"  [red][ANALYZER] 🖼️  Broken image: {bi.src} ({bi.status_code})[/red]")
        if missing_alts:
            console.print(f"  [yellow][ANALYZER] ♿ Missing alt text on {len(missing_alts)} image(s)[/yellow]")
        if form_issues:
            unlabeled = sum(1 for f in form_issues if not f.has_labels)
            if unlabeled:
                console.print(f"  [yellow][ANALYZER] 📝 {unlabeled} form(s) missing labels[/yellow]")
        console.print(f"  [dim][ANALYZER] ⏱️  Load time: {analysis.load_time_ms:.0f}ms | DOM: {analysis.dom_element_count} elements[/dim]")

        return analysis

    async def _check_links(self, page, base_url: str) -> list[BrokenLink]:
        """Find all <a> tags and HEAD-check each href for broken links."""
        broken: list[BrokenLink] = []
        try:
            links = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('a[href]')).map(a => ({
                    href: a.href,
                    text: (a.textContent || '').trim().substring(0, 80)
                })).filter(l => l.href.startsWith('http'));
            }""")

            console.print(f"  [dim][ANALYZER] 🔗 Checking {len(links)} links...[/dim]")

            # Check up to 30 links to avoid very long crawls
            links_to_check = links[:30]
            timeout = aiohttp.ClientTimeout(total=8)

            async with aiohttp.ClientSession(timeout=timeout) as session:
                tasks = [self._head_check(session, link) for link in links_to_check]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                for link_info, result in zip(links_to_check, results):
                    if isinstance(result, int) and result >= 400:
                        broken.append(BrokenLink(
                            url=link_info["href"],
                            status_code=result,
                            link_text=link_info["text"],
                        ))
                    elif isinstance(result, Exception):
                        broken.append(BrokenLink(
                            url=link_info["href"],
                            status_code=0,
                            link_text=link_info["text"],
                        ))
        except Exception as e:
            console.print(f"  [dim][ANALYZER] ⚠️  Link check error: {e}[/dim]")

        return broken

    async def _head_check(self, session: aiohttp.ClientSession, link: dict) -> int:
        """HEAD-request a single URL, return status code."""
        try:
            async with session.head(link["href"], allow_redirects=True, ssl=False) as resp:
                return resp.status
        except aiohttp.ClientError:
            # Try GET as fallback (some servers reject HEAD)
            try:
                async with session.get(link["href"], allow_redirects=True, ssl=False) as resp:
                    return resp.status
            except Exception:
                raise

    async def _check_images(self, page, base_url: str) -> tuple[list[BrokenImage], int]:
        """Find all <img> tags and check if src loads."""
        broken: list[BrokenImage] = []
        images = []
        try:
            images = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('img')).map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    naturalWidth: img.naturalWidth
                })).filter(i => i.src && i.src.startsWith('http'));
            }""")

            # Images with naturalWidth === 0 are broken
            for img in images:
                if img["naturalWidth"] == 0:
                    broken.append(BrokenImage(
                        src=img["src"],
                        alt=img["alt"],
                        status_code=404,
                    ))
        except Exception as e:
            console.print(f"  [dim][ANALYZER] ⚠️  Image check error: {e}[/dim]")

        return broken, len(images)

    async def _check_missing_alts(self, page) -> list[MissingAlt]:
        """Find all <img> tags with missing or empty alt attributes."""
        missing: list[MissingAlt] = []
        try:
            imgs = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('img')).filter(img => {
                    return !img.hasAttribute('alt') || img.alt.trim() === '';
                }).map(img => ({ src: img.src || '' }));
            }""")
            for img in imgs:
                missing.append(MissingAlt(src=img["src"]))
        except Exception:
            pass
        return missing

    async def _check_forms(self, page) -> list[FormIssue]:
        """Analyze all <form> tags for accessibility issues."""
        issues: list[FormIssue] = []
        try:
            forms = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('form')).map(form => {
                    const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), select, textarea');
                    let labeled = 0;
                    inputs.forEach(inp => {
                        const id = inp.id;
                        const hasLabel = id ? !!form.querySelector(`label[for="${id}"]`) : false;
                        const hasAria = inp.hasAttribute('aria-label') || inp.hasAttribute('aria-labelledby');
                        if (hasLabel || hasAria) labeled++;
                    });
                    return {
                        action: form.action || '',
                        method: (form.method || 'GET').toUpperCase(),
                        inputCount: inputs.length,
                        labeledCount: labeled
                    };
                });
            }""")
            for form in forms:
                issues.append(FormIssue(
                    action=form["action"],
                    method=form["method"],
                    has_labels=form["labeledCount"] >= form["inputCount"] and form["inputCount"] > 0,
                    input_count=form["inputCount"],
                ))
        except Exception:
            pass
        return issues

    async def _take_screenshot(self, page, url: str) -> Optional[str]:
        """Take a full-page screenshot."""
        try:
            filename = sanitize_url_for_filename(url) + ".png"
            path = f"{self._screenshots_dir}/{filename}"
            await page.screenshot(path=path, full_page=True)
            console.print(f"  [green][CRAWLER]  📸 Screenshot saved: {path}[/green]")
            return path
        except Exception as e:
            console.print(f"  [dim][ANALYZER] ⚠️  Screenshot failed: {e}[/dim]")
            return None
