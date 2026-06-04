"""Debug crawler with a real multi-page website."""
import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from tools.playwright_tool import PlaywrightTool, _run_sync

async def main():
    # Test with wikipedia - guaranteed to have many internal links
    url = "https://www.iplt20.com"
    
    pw = PlaywrightTool(headless=True, browser_type="chromium")
    await pw.start()

    # First check links manually
    print(f"=== Manual link check: {url} ===")
    
    def check_links():
        browser = pw._ensure_browser()
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "sec-ch-ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "Upgrade-Insecure-Requests": "1",
            }
        )
        context.set_default_timeout(15000)
        page = context.new_page()
        try:
            response = page.goto(url, wait_until="domcontentloaded", timeout=15000)
            print(f"  Status: {response.status}")
            print(f"  Title: {page.title()}")
            
            links = page.evaluate("""() => {
                const anchors = Array.from(document.querySelectorAll('a[href]'));
                const hrefs = anchors.map(a => {
                    try { return new URL(a.href, window.location.origin).href; }
                    catch(e) { return null; }
                }).filter(Boolean).filter(h => h.startsWith('http'));
                
                // Count same-domain
                const domain = window.location.hostname.replace('www.', '');
                const internal = hrefs.filter(h => {
                    try { 
                        const d = new URL(h).hostname.replace('www.', '');
                        return d === domain || d.endsWith('.' + domain);
                    } catch { return false; }
                });
                
                return {
                    total: hrefs.length,
                    internal: internal.length,
                    sampleInternal: internal.slice(0, 10),
                    sampleExternal: hrefs.filter(h => !internal.includes(h)).slice(0, 5),
                };
            }""")
            print(f"  Total links: {links['total']}")
            print(f"  Internal links: {links['internal']}")
            print(f"  Sample internal:")
            for l in links['sampleInternal']:
                print(f"    {l[:100]}")
            print(f"  Sample external:")
            for l in links['sampleExternal']:
                print(f"    {l[:100]}")
        except Exception as e:
            print(f"  ERROR: {e}")
        finally:
            context.close()

    await _run_sync(check_links)
    
    # Now run the actual crawler with max 5 pages
    print(f"\n=== Actual crawl (max 5 pages) ===")
    
    def on_page(pd):
        print(f"  [FOUND] depth={pd['depth']} {pd['url'][:80]} (type={pd['page_type']})")
    
    discovered = await pw.crawl(url, max_pages=5, max_depth=3, on_page=on_page)
    print(f"\n  TOTAL: {len(discovered)} pages discovered!")
    for i, p in enumerate(discovered):
        print(f"  {i+1}. depth={p['depth']} {p['url'][:80]}")
    
    await pw.stop()
    print("\n=== Done ===")

asyncio.run(main())
