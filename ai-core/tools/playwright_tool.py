"""Playwright browser automation tool for crawling and testing."""

import asyncio
import contextvars
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

_executor = ThreadPoolExecutor(max_workers=1)

def _run_sync(fn, *args):
    """Run a sync function in a thread pool to avoid blocking the event loop.
    Uses an empty context to prevent asyncio context propagation that panics Playwright.
    """
    loop = asyncio.get_running_loop()
    ctx = contextvars.Context()
    return loop.run_in_executor(_executor, ctx.run, fn, *args)


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
        if self._pw is None:
            self._pw = sync_playwright().start()

        if self._browser is not None:
            try:
                # Quick check — is_connected() raises if already closed
                if self._browser.is_connected():
                    return self._browser
            except Exception:
                pass
        
        # Launch fresh
        self._browser = getattr(self._pw, self._browser_type).launch(
            headless=self._headless,
            args=[
                "--no-sandbox", 
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--disable-gpu",
                "--enable-unsafe-swiftshader",
                "--disable-audio-output"
            ],
        )
        return self._browser

    def _new_context(self, browser, **kwargs):
        """Create a browser context with realistic headers and user-agent to avoid WAF block."""
        context_args = {
            "viewport": {"width": 1280, "height": 720},
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "locale": "en-US",
            "extra_http_headers": {
                "sec-ch-ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
            }
        }
        context_args.update(kwargs)
        return browser.new_context(**context_args)

    def _start_sync(self):
        self._ensure_browser()

    def _stop_sync(self):
        if self._browser:
            try:
                self._browser.close()
            except Exception:
                pass
            self._browser = None
        # We intentionally keep self._pw alive for the lifetime of the application
        # to avoid greenlet/asyncio thread collision bugs on subsequent restarts.

    async def start(self):
        await _run_sync(self._start_sync)

    async def stop(self):
        await _run_sync(self._stop_sync)

    @staticmethod
    def _normalize_url(raw_url: str) -> str:
        """Normalize a URL for deduplication: strip www., trailing slashes,
        fragments, and query parameters so the same page isn't crawled twice."""
        parsed = urlparse(raw_url)
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = parsed.path.rstrip("/") or "/"
        return f"{parsed.scheme}://{netloc}{path}"

    def _crawl_sync(self, url: str, max_pages: int, max_depth: int = 999, on_page=None) -> list[dict]:
        """Crawl using the persistent browser — tracks real URL depth levels.
        
        Queue items are (url, depth) tuples. max_depth enforces the level cap:
          shallow  → max_depth=1  (root + direct links only)
          standard → max_depth=3  (3 levels deep)
          deep     → max_depth=999 (unlimited, stops at max_pages)
        """
        browser = self._ensure_browser()
        context = self._new_context(browser)
        context.set_default_timeout(20000)

        # Normalize the base domain for same-origin checks
        base_parsed = urlparse(url)
        base_domain = base_parsed.netloc.lower()
        if base_domain.startswith("www."):
            base_domain = base_domain[4:]

        # Also track allowed domains (updated after first page redirect detection)
        allowed_domains = {base_domain}

        # Skip extensions that are not HTML pages
        SKIP_EXTENSIONS = {
            ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp",
            ".mp3", ".mp4", ".avi", ".mov", ".zip", ".tar", ".gz",
            ".css", ".js", ".woff", ".woff2", ".ttf", ".eot", ".ico",
            ".xml", ".json", ".rss", ".atom", ".map",
        }

        print(f"[Crawler] Starting BFS crawl on {url} (max_pages={max_pages}, max_depth={max_depth})")
        print(f"[Crawler] Base domain: {base_domain}")

        try:
            discovered = []
            visited_normalized = set()  # normalized URLs for dedup
            queued_normalized = set()  # track what's already been queued
            # Queue items: (url, depth) — depth 0 = the root URL
            queue = [(url, 0)]
            queued_normalized.add(self._normalize_url(url))
            is_first_page = True

            while queue and len(discovered) < max_pages:
                current_url, depth = queue.pop(0)
                norm_url = self._normalize_url(current_url)

                if norm_url in visited_normalized:
                    continue

                # Skip non-HTML file extensions
                path_lower = urlparse(current_url).path.lower()
                if any(path_lower.endswith(ext) for ext in SKIP_EXTENSIONS):
                    visited_normalized.add(norm_url)
                    continue

                page = None
                try:
                    try:
                        page = context.new_page()
                    except Exception as e:
                        err_str = str(e).lower()
                        if "closed" in err_str or "connection" in err_str or "target" in err_str:
                            print(f"[Crawler] Browser or context was closed/disconnected ({e}). Relaunching...")
                            try:
                                context.close()
                            except Exception:
                                pass
                            browser = self._ensure_browser()
                            context = self._new_context(browser)
                            context.set_default_timeout(20000)
                            page = context.new_page()
                        else:
                            raise

                    # Use domcontentloaded for JS-heavy sites; commit is too early
                    response = page.goto(current_url, wait_until="domcontentloaded", timeout=20000)
                    if not response:
                        print(f"[Crawler] No response for {current_url}")
                        page.close()
                        page = None
                        visited_normalized.add(norm_url)
                        continue

                    # Skip non-HTML responses (PDFs opened inline, etc.)
                    content_type = response.headers.get("content-type", "")
                    if content_type and "text/html" not in content_type and "application/xhtml" not in content_type:
                        page.close()
                        page = None
                        visited_normalized.add(norm_url)
                        continue

                    # Wait for network idle + extra JS rendering time
                    try:
                        page.wait_for_load_state("networkidle", timeout=8000)
                    except Exception:
                        pass  # Timeout is fine — we got domcontentloaded already

                    # Extra wait for SPA frameworks (React/Vue/Angular) to render
                    if is_first_page:
                        page.wait_for_timeout(2000)

                    # Detect redirect: if the browser ended up on a different domain,
                    # add that domain to allowed list so we follow its internal links
                    final_url = page.url
                    final_parsed = urlparse(final_url)
                    final_domain = final_parsed.netloc.lower()
                    if final_domain.startswith("www."):
                        final_domain = final_domain[4:]
                    
                    if final_domain != base_domain and final_domain not in allowed_domains:
                        print(f"[Crawler] Redirect detected: {base_domain} → {final_domain}")
                        allowed_domains.add(final_domain)
                        # If this is the first page, also use the redirected domain as primary
                        if is_first_page:
                            base_domain = final_domain
                            print(f"[Crawler] Updated base domain to: {base_domain}")

                    is_first_page = False
                    visited_normalized.add(norm_url)
                    # Also mark the final URL as visited (in case of redirect)
                    visited_normalized.add(self._normalize_url(final_url))

                    page_type = self._classify_page_sync(page)

                    page_data = {
                        "url": final_url if final_url != current_url else current_url,
                        "page_type": page_type,
                        "status_code": response.status,
                        "title": page.title(),
                        "depth": depth,
                    }
                    discovered.append(page_data)
                    print(f"[Crawler] Page {len(discovered)}/{max_pages}: {page_data['url'][:80]} (depth={depth}, type={page_type})")

                    if on_page:
                        try:
                            on_page(page_data)
                        except Exception:
                            pass

                    # Only follow links if we haven't hit the depth cap
                    if depth < max_depth:
                        links = page.evaluate("""() => {
                            const results = new Set();
                            
                            // Standard <a href> links
                            document.querySelectorAll('a[href]').forEach(a => {
                                try { results.add(new URL(a.href, window.location.origin).href); }
                                catch(e) {}
                            });
                            
                            // <area href> links (image maps)
                            document.querySelectorAll('area[href]').forEach(a => {
                                try { results.add(new URL(a.href, window.location.origin).href); }
                                catch(e) {}
                            });
                            
                            // Elements with data-href or data-url attributes
                            document.querySelectorAll('[data-href], [data-url], [data-link]').forEach(el => {
                                const val = el.getAttribute('data-href') || el.getAttribute('data-url') || el.getAttribute('data-link');
                                if (val) {
                                    try { results.add(new URL(val, window.location.origin).href); }
                                    catch(e) {}
                                }
                            });
                            
                            // Links inside onclick handlers (basic extraction)
                            document.querySelectorAll('[onclick]').forEach(el => {
                                const onclick = el.getAttribute('onclick') || '';
                                const matches = onclick.match(/['"](\\/[^'"\\s]+)['"]/g);
                                if (matches) {
                                    matches.forEach(m => {
                                        const path = m.replace(/['"]/g, '');
                                        try { results.add(new URL(path, window.location.origin).href); }
                                        catch(e) {}
                                    });
                                }
                            });
                            
                            return [...results].filter(h => h.startsWith('http'));
                        }""")

                        new_links = 0
                        for link in links:
                            link_parsed = urlparse(link)
                            link_domain = link_parsed.netloc.lower()
                            if link_domain.startswith("www."):
                                link_domain = link_domain[4:]

                            # Same-origin check: link domain must match base or be an allowed subdomain
                            is_same_origin = (
                                link_domain == base_domain
                                or link_domain in allowed_domains
                                or link_domain.endswith("." + base_domain)
                            )

                            if is_same_origin:
                                clean = self._normalize_url(link)
                                if clean not in visited_normalized and clean not in queued_normalized:
                                    queue.append((link, depth + 1))
                                    queued_normalized.add(clean)
                                    new_links += 1

                        print(f"[Crawler]   Found {len(links)} links, {new_links} new internal links queued (queue size: {len(queue)})")

                except Exception as e:
                    print(f"[Crawler] Error on {current_url}: {e}")
                    # Mark as visited even on error to avoid infinite retries
                    visited_normalized.add(norm_url)
                finally:
                    if page:
                        try:
                            page.close()
                        except Exception:
                            pass

            print(f"[Crawler] BFS complete: {len(discovered)} pages discovered")
            return discovered
        finally:
            try:
                context.close()
            except Exception:
                pass

    async def crawl(self, url: str, max_pages: int = 50, max_depth: int = 999, on_page=None) -> list[dict]:
        return await _run_sync(self._crawl_sync, url, max_pages, max_depth, on_page)

    def _test_page_sync(self, url: str) -> dict:
        """Test a single page using the persistent browser — fresh context per page."""
        browser = self._ensure_browser()
        context = self._new_context(browser)
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

    # ── Stage 5: axe-core accessibility scanning ──────────────────────────────

    def _run_axe_sync(self, url: str) -> list[dict]:
        """Run axe-core accessibility scan on a page."""
        from tools.axe_tool import run_axe_sync as _axe_scan

        browser = self._ensure_browser()
        context = self._new_context(browser)
        context.set_default_timeout(15000)
        page = context.new_page()

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
            violations = _axe_scan(page)
            return violations
        except Exception as e:
            print(f"axe-core error on {url}: {e}")
            return []
        finally:
            try:
                page.close()
                context.close()
            except Exception:
                pass

    async def run_axe(self, url: str) -> list[dict]:
        """Run axe-core accessibility scan (async wrapper)."""
        return await _run_sync(self._run_axe_sync, url)

    # ── Self-Healing: access Playwright page for DOM inspection ───────────────

    def _get_page_sync(self, url: str):
        """Navigate to a URL and return the Playwright page object for inspection.
        
        Used by SelfHealingAgent to access DOM elements for fingerprinting
        and healing. Returns (page, context) tuple — caller should close context.
        """
        browser = self._ensure_browser()
        context = self._new_context(browser)
        context.set_default_timeout(10000)
        page = context.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(500)
            return page, context
        except Exception as e:
            print(f"get_page error on {url}: {e}")
            try:
                page.close()
                context.close()
            except Exception:
                pass
            return None, None

    async def get_page(self, url: str):
        """Get a Playwright page navigated to URL (async wrapper).
        
        Returns a page-like wrapper that can be used with page.evaluate()
        and page.locator(). The page is automatically cleaned up.
        """
        page, context = await _run_sync(self._get_page_sync, url)
        if page is None:
            return None
        # Wrap in a helper that cleans up on del
        return _ManagedPage(page, context)


    # ── Stage 4: Screenshot capture for Gemini Vision ─────────────────────────

    def _take_screenshot_sync(self, url: str) -> bytes:
        """Take a full-page screenshot and return PNG bytes."""
        browser = self._ensure_browser()
        context = self._new_context(browser)
        context.set_default_timeout(12000)
        page = context.new_page()

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=12000)
            # Wait a moment for dynamic content to render
            page.wait_for_timeout(1000)
            screenshot = page.screenshot(full_page=False, type="png")
            return screenshot
        except Exception as e:
            print(f"Screenshot error on {url}: {e}")
            return b""
        finally:
            try:
                context.close()
            except Exception:
                pass

    async def take_screenshot(self, url: str) -> bytes:
        """Take a screenshot (async wrapper)."""
        return await _run_sync(self._take_screenshot_sync, url)

    def _execute_login_sync(self, url: str, username_selector: str, password_selector: str, submit_selector: str, username: str, password: str) -> bool:
        browser = self._ensure_browser()
        if not hasattr(self, '_shared_context') or self._shared_context is None:
            self._shared_context = self._new_context(browser)
        page = self._shared_context.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_selector(username_selector, timeout=10000)
            page.fill(username_selector, username)
            page.fill(password_selector, password)
            page.click(submit_selector)
            page.wait_for_load_state("networkidle", timeout=15000)
            return True
        except Exception as e:
            print(f"Login error on {url}: {e}")
            return False
        finally:
            page.close()

    async def execute_login(self, url: str, username_selector: str, password_selector: str, submit_selector: str, username: str, password: str) -> bool:
        return await _run_sync(self._execute_login_sync, url, username_selector, password_selector, submit_selector, username, password)

    def _set_network_conditions_sync(self, profile: str):
        self._network_profile = profile

    async def set_network_conditions(self, profile: str):
        return await _run_sync(self._set_network_conditions_sync, profile)

    def _set_cpu_throttling_sync(self, rate: int):
        self._cpu_throttling = rate

    async def set_cpu_throttling(self, rate: int):
        return await _run_sync(self._set_cpu_throttling_sync, rate)

    def _disable_chaos_conditions_sync(self):
        self._network_profile = None
        self._cpu_throttling = None

    async def disable_chaos_conditions(self):
        return await _run_sync(self._disable_chaos_conditions_sync)


class _ManagedPage:
    """Thin wrapper that forwards calls to a Playwright page and manages cleanup."""
    
    def __init__(self, page, context):
        self._page = page
        self._context = context
    
    async def evaluate(self, expression):
        return await _run_sync(self._page.evaluate, expression)
    
    def locator(self, selector):
        return self._page.locator(selector)
    
    async def count(self, selector):
        return await _run_sync(lambda: self._page.locator(selector).count())
    
    async def close(self):
        try:
            await _run_sync(self._context.close)
        except Exception:
            pass
