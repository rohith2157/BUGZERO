"""Playwright browser automation tool for crawling and testing."""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

_executor = ThreadPoolExecutor(max_workers=1)


def _run_sync(fn, *args):
    """Run a sync function in a thread pool to avoid blocking the event loop."""
    loop = asyncio.get_running_loop()
    return loop.run_in_executor(_executor, fn, *args)


class PlaywrightTool:
    """Manages Playwright browser for crawling and page interaction."""

    def __init__(self, headless: bool = True, browser_type: str = "chromium"):
        self._headless = headless
        self._browser_type = browser_type

    async def start(self):
        pass

    async def stop(self):
        pass

    def _crawl_sync(self, url: str, max_pages: int) -> list[dict]:
        """Synchronous crawl — browser lifecycle contained in one thread."""
        pw = sync_playwright().start()
        browser = getattr(pw, self._browser_type).launch(headless=self._headless)
        try:
            context = browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent="AutonomousQA/1.0",
            )
            page = context.new_page()
            discovered = []
            visited = set()
            queue = [url]
            base_domain = urlparse(url).netloc

            while queue and len(visited) < max_pages:
                current_url = queue.pop(0)
                if current_url in visited:
                    continue

                try:
                    response = page.goto(current_url, wait_until="domcontentloaded", timeout=30000)
                    if not response:
                        continue

                    visited.add(current_url)
                    page_type = self._classify_page_sync(page)

                    discovered.append({
                        "url": current_url,
                        "page_type": page_type,
                        "status_code": response.status,
                        "title": page.title(),
                    })

                    links = page.evaluate("""() => {
                        return Array.from(document.querySelectorAll('a[href]'))
                            .map(a => a.href)
                            .filter(href => href.startsWith('http'));
                    }""")

                    for link in links:
                        parsed = urlparse(link)
                        if parsed.netloc == base_domain and link not in visited:
                            clean_link = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                            if clean_link not in visited:
                                queue.append(clean_link)

                except Exception as e:
                    print(f"Crawl error on {current_url}: {e}")
                    continue

            context.close()
            return discovered
        finally:
            browser.close()
            pw.stop()

    async def crawl(self, url: str, max_pages: int = 50) -> list[dict]:
        return await _run_sync(self._crawl_sync, url, max_pages)

    def _test_page_sync(self, url: str) -> dict:
        """Synchronous test — browser lifecycle contained in one thread."""
        pw = sync_playwright().start()
        browser = getattr(pw, self._browser_type).launch(headless=self._headless)
        try:
            context = browser.new_context(viewport={"width": 1280, "height": 720})
            page = context.new_page()

            results = {
                "url": url,
                "defects": [],
                "performance": {},
                "accessibility": [],
            }

            try:
                response = page.goto(url, wait_until="networkidle", timeout=30000)
                results["status_code"] = response.status if response else 0
                results["title"] = page.title()

                # Check images for alt text
                missing_alt = page.evaluate("""() => {
                    const imgs = document.querySelectorAll('img');
                    let missing = 0;
                    imgs.forEach(img => { if (!img.alt) missing++; });
                    return missing;
                }""")

                if missing_alt > 0:
                    results["defects"].append({
                        "type": "Accessibility",
                        "severity": "major",
                        "message": f"Missing alt text on {missing_alt} image(s)",
                        "fix": "Add descriptive alt attributes to all <img> elements",
                    })

                # Check heading hierarchy
                heading_issues = page.evaluate("""() => {
                    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    const levels = Array.from(headings).map(h => parseInt(h.tagName[1]));
                    let issues = 0;
                    const h1Count = levels.filter(l => l === 1).length;
                    if (h1Count === 0) issues++;
                    if (h1Count > 1) issues++;
                    for (let i = 1; i < levels.length; i++) {
                        if (levels[i] - levels[i-1] > 1) issues++;
                    }
                    return { issues, h1Count };
                }""")

                if heading_issues["h1Count"] == 0:
                    results["defects"].append({
                        "type": "SEO",
                        "severity": "major",
                        "message": "Page is missing an H1 heading tag",
                        "fix": "Add a single H1 tag as the main page heading",
                    })
                elif heading_issues["h1Count"] > 1:
                    results["defects"].append({
                        "type": "SEO",
                        "severity": "minor",
                        "message": f"Multiple H1 tags found ({heading_issues['h1Count']})",
                        "fix": "Use a single H1 for the main heading, use H2+ for others",
                    })

                # Check meta description
                meta = page.evaluate("""() => {
                    const desc = document.querySelector('meta[name="description"]');
                    return desc ? desc.content : null;
                }""")

                if not meta:
                    results["defects"].append({
                        "type": "SEO",
                        "severity": "minor",
                        "message": "Missing meta description tag",
                        "fix": "Add a <meta name='description'> tag with page summary",
                    })

                # Check form labels
                unlabeled_inputs = page.evaluate("""() => {
                    const inputs = document.querySelectorAll('input, select, textarea');
                    let unlabeled = 0;
                    inputs.forEach(input => {
                        if (input.type === 'hidden' || input.type === 'submit') return;
                        const id = input.id;
                        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
                        const ariaLabel = input.getAttribute('aria-label');
                        const ariaLabelledBy = input.getAttribute('aria-labelledby');
                        if (!label && !ariaLabel && !ariaLabelledBy) unlabeled++;
                    });
                    return unlabeled;
                }""")

                if unlabeled_inputs > 0:
                    results["defects"].append({
                        "type": "Accessibility",
                        "severity": "critical",
                        "message": f"Form inputs missing labels — {unlabeled_inputs} instance(s)",
                        "fix": "Add <label> elements with for attributes to each input field",
                    })

                # Check color contrast (basic)
                low_contrast = page.evaluate("""() => {
                    const elements = document.querySelectorAll('p, span, a, li, td, th, label, button');
                    let issues = 0;
                    elements.forEach(el => {
                        const style = getComputedStyle(el);
                        const color = style.color;
                        const bg = style.backgroundColor;
                        if (color === bg) issues++;
                    });
                    return issues;
                }""")

                if low_contrast > 0:
                    results["defects"].append({
                        "type": "WCAG",
                        "severity": "major",
                        "message": f"Potential color contrast issues on {low_contrast} element(s)",
                        "fix": "Ensure text has at least 4.5:1 contrast ratio against background",
                    })

                # Performance metrics
                perf = page.evaluate("""() => {
                    const t = performance.timing;
                    const nav = performance.getEntriesByType('navigation')[0];
                    return {
                        ttfb: nav ? nav.responseStart - nav.requestStart : 0,
                        dom_load: t.domContentLoadedEventEnd - t.navigationStart,
                        full_load: t.loadEventEnd - t.navigationStart,
                    };
                }""")

                if perf.get("ttfb", 0) > 0:
                    results["performance"]["TTFB"] = {
                        "value": round(perf["ttfb"], 1),
                        "rating": "good" if perf["ttfb"] < 800 else "needs-improvement" if perf["ttfb"] < 1800 else "poor",
                    }

                if perf.get("full_load", 0) > 0:
                    lcp_estimate = perf["full_load"] / 1000
                    results["performance"]["LCP"] = {
                        "value": round(lcp_estimate, 2),
                        "rating": "good" if lcp_estimate < 2.5 else "needs-improvement" if lcp_estimate < 4 else "poor",
                    }

                # GDPR cookie consent check
                has_cookie_banner = page.evaluate("""() => {
                    const text = document.body.innerText.toLowerCase();
                    return text.includes('cookie') && (text.includes('consent') || text.includes('accept') || text.includes('privacy'));
                }""")

                if not has_cookie_banner:
                    results["accessibility"].append({
                        "standard": "GDPR",
                        "criterion": "Cookie Consent",
                        "severity": "warning",
                        "description": "No cookie consent mechanism detected",
                        "remediation": "Implement a cookie consent banner for GDPR compliance",
                    })

                # Privacy policy link check
                has_privacy = page.evaluate("""() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.some(a => a.textContent.toLowerCase().includes('privacy'));
                }""")

                if not has_privacy:
                    results["accessibility"].append({
                        "standard": "GDPR",
                        "criterion": "Privacy Policy",
                        "severity": "minor",
                        "description": "No privacy policy link found on page",
                        "remediation": "Add a visible link to your privacy policy",
                    })

            except Exception as e:
                results["defects"].append({
                    "type": "Functional",
                    "severity": "critical",
                    "message": f"Page load failed: {str(e)}",
                    "fix": "Verify the URL is accessible and the server is running",
                })

            finally:
                context.close()

            return results
        finally:
            browser.close()
            pw.stop()

    async def test_page(self, url: str) -> dict:
        return await _run_sync(self._test_page_sync, url)

    def _classify_page_sync(self, page) -> str:
        """Classify a page type based on content analysis."""
        classification = page.evaluate("""() => {
            const forms = document.querySelectorAll('form');
            const tables = document.querySelectorAll('table');
            const inputs = document.querySelectorAll('input, select, textarea');
            const charts = document.querySelectorAll('canvas, svg');
            const url = window.location.pathname.toLowerCase();

            if (url.includes('login') || url.includes('signin') || url.includes('auth')) return 'Auth';
            if (url.includes('setting') || url.includes('config') || url.includes('preference')) return 'Settings';
            if (url.includes('dashboard') || url === '/') return 'Dashboard';
            if (forms.length > 0 && inputs.length > 3) return 'Form';
            if (tables.length > 0) return 'Data Table';
            if (charts.length > 2) return 'Dashboard';
            return 'Content';
        }""")
        return classification
