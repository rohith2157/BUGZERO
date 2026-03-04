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
    """Manages Playwright browser for crawling and testing.
    
    One browser instance is started per test run and reused across all
    crawl and test-page operations to avoid the overhead of launching
    a new browser for every page.
    """

    def __init__(self, headless: bool = True, browser_type: str = "chromium"):
        self._headless = headless
        self._browser_type = browser_type
        self._pw = None
        self._browser = None

    def _ensure_browser(self):
        """Return a live browser, (re)launching if necessary."""
        if self._browser is not None:
            try:
                # Quick check — is_connected() raises if already closed
                if self._browser.is_connected():
                    return self._browser
            except Exception:
                pass
        # Launch fresh
        if self._pw:
            try:
                self._pw.stop()
            except Exception:
                pass
        self._pw = sync_playwright().start()
        self._browser = getattr(self._pw, self._browser_type).launch(
            headless=self._headless,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        return self._browser

    def _start_sync(self):
        self._ensure_browser()

    def _stop_sync(self):
        if self._browser:
            try:
                self._browser.close()
            except Exception:
                pass
            self._browser = None
        if self._pw:
            try:
                self._pw.stop()
            except Exception:
                pass
            self._pw = None

    async def start(self):
        await _run_sync(self._start_sync)

    async def stop(self):
        await _run_sync(self._stop_sync)

    def _crawl_sync(self, url: str, max_pages: int, max_depth: int = 999) -> list[dict]:
        """Crawl using the persistent browser — tracks real URL depth levels.
        
        Queue items are (url, depth) tuples. max_depth enforces the level cap:
          shallow  → max_depth=1  (root + direct links only)
          standard → max_depth=3  (3 levels deep)
          deep     → max_depth=999 (unlimited, stops at max_pages)
        """
        browser = self._ensure_browser()
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        )
        context.set_default_timeout(8000)
        try:
            discovered = []
            visited = set()
            # Queue items: (url, depth) — depth 0 = the root URL
            queue = [(url, 0)]
            base_domain = urlparse(url).netloc

            while queue and len(visited) < max_pages:
                current_url, depth = queue.pop(0)
                if current_url in visited:
                    continue

                page = None
                try:
                    page = context.new_page()
                    response = page.goto(current_url, wait_until="commit", timeout=8000)
                    if not response:
                        page.close()
                        continue

                    visited.add(current_url)
                    page_type = self._classify_page_sync(page)

                    discovered.append({
                        "url": current_url,
                        "page_type": page_type,
                        "status_code": response.status,
                        "title": page.title(),
                        "depth": depth,
                    })

                    # Only follow links if we haven't hit the depth cap
                    if depth < max_depth:
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
                                    queue.append((clean_link, depth + 1))

                except Exception as e:
                    print(f"Crawl error on {current_url}: {e}")
                finally:
                    if page:
                        try:
                            page.close()
                        except Exception:
                            pass

            return discovered
        finally:
            try:
                context.close()
            except Exception:
                pass

    async def crawl(self, url: str, max_pages: int = 50, max_depth: int = 999) -> list[dict]:
        return await _run_sync(self._crawl_sync, url, max_pages, max_depth)

    def _test_page_sync(self, url: str) -> dict:
        """Test a single page using the persistent browser — fresh context per page."""
        browser = self._ensure_browser()
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        )
        context.set_default_timeout(10000)
        page = context.new_page()

        results = {
            "url": url,
            "defects": [],
            "performance": {},
            "accessibility": [],
        }

        try:
            response = page.goto(url, wait_until="domcontentloaded", timeout=12000)
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

            # Performance metrics — collect all 4 Core Web Vitals
            # Step 1: Inject PerformanceObserver for LCP, CLS, and FID before anything
            # We use page.evaluate with a promise-based approach + setTimeout fallback
            perf = page.evaluate("""() => {
                const nav = performance.getEntriesByType('navigation')[0];
                const t = performance.timing;
                return {
                    ttfb: nav ? nav.responseStart - nav.requestStart : (t.responseStart - t.requestStart),
                    dom_load: t.domContentLoadedEventEnd - t.navigationStart,
                    full_load: t.loadEventEnd - t.navigationStart,
                };
            }""")

            if perf.get("ttfb", 0) > 0:
                results["performance"]["TTFB"] = {
                    "value": round(perf["ttfb"], 1),
                    "rating": "good" if perf["ttfb"] < 800 else "needs-improvement" if perf["ttfb"] < 1800 else "poor",
                }

            # LCP — use PerformanceObserver entries if available, otherwise estimate from full_load
            lcp_val = page.evaluate("""() => {
                try {
                    const entries = performance.getEntriesByType('largest-contentful-paint');
                    if (entries && entries.length > 0) {
                        return entries[entries.length - 1].startTime / 1000;
                    }
                } catch(e) {}
                return null;
            }""")
            if lcp_val is None and perf.get("full_load", 0) > 0:
                lcp_val = perf["full_load"] / 1000
            if lcp_val is not None and lcp_val > 0:
                lcp_val = round(lcp_val, 2)
                results["performance"]["LCP"] = {
                    "value": lcp_val,
                    "rating": "good" if lcp_val < 2.5 else "needs-improvement" if lcp_val < 4 else "poor",
                }

            # CLS — measure layout shift from PerformanceObserver entries
            cls_val = page.evaluate("""() => {
                try {
                    const entries = performance.getEntriesByType('layout-shift');
                    if (entries && entries.length > 0) {
                        let cls = 0;
                        for (const entry of entries) {
                            if (!entry.hadRecentInput) cls += entry.value;
                        }
                        return cls;
                    }
                } catch(e) {}
                return null;
            }""")
            # If PerformanceObserver entries aren't available, inject an observer and wait briefly
            if cls_val is None:
                cls_val = page.evaluate("""() => {
                    return new Promise((resolve) => {
                        let cls = 0;
                        try {
                            const observer = new PerformanceObserver((list) => {
                                for (const entry of list.getEntries()) {
                                    if (!entry.hadRecentInput) cls += entry.value;
                                }
                            });
                            observer.observe({type: 'layout-shift', buffered: true});
                            setTimeout(() => { observer.disconnect(); resolve(cls); }, 1500);
                        } catch(e) { resolve(0); }
                    });
                }""")
            if cls_val is not None:
                cls_val = round(cls_val, 4)
                results["performance"]["CLS"] = {
                    "value": cls_val,
                    "rating": "good" if cls_val <= 0.1 else "needs-improvement" if cls_val <= 0.25 else "poor",
                }

            # FID — cannot be measured without real user interaction, so we measure TBT as proxy
            # TBT (Total Blocking Time) correlates strongly with FID
            fid_val = page.evaluate("""() => {
                try {
                    const entries = performance.getEntriesByType('longtask');
                    if (entries && entries.length > 0) {
                        let tbt = 0;
                        for (const entry of entries) {
                            const blocking = entry.duration - 50;
                            if (blocking > 0) tbt += blocking;
                        }
                        return tbt;
                    }
                } catch(e) {}
                return null;
            }""")
            # If longtask entries not available, inject observer
            if fid_val is None:
                fid_val = page.evaluate("""() => {
                    return new Promise((resolve) => {
                        let tbt = 0;
                        try {
                            const observer = new PerformanceObserver((list) => {
                                for (const entry of list.getEntries()) {
                                    const blocking = entry.duration - 50;
                                    if (blocking > 0) tbt += blocking;
                                }
                            });
                            observer.observe({type: 'longtask', buffered: true});
                            setTimeout(() => { observer.disconnect(); resolve(tbt); }, 1500);
                        } catch(e) { resolve(0); }
                    });
                }""")
            if fid_val is not None:
                fid_val = round(fid_val, 1)
                results["performance"]["FID"] = {
                    "value": fid_val,
                    "rating": "good" if fid_val <= 100 else "needs-improvement" if fid_val <= 300 else "poor",
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
            try:
                context.close()
            except Exception:
                pass

        return results

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

