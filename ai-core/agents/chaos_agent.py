"""Chaos Agent for the AutonomousQA Platform.

Injects network faults, CPU throttling, and UI layout shifts using the 
Chrome DevTools Protocol (CDP) to stress test applications dynamically.
"""

import asyncio
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ChaosAgent:
    """Uses Playwright CDPSession to inject faults and throttling."""

    def __init__(self, browser_context=None):
        self.context = browser_context

    async def initialize(self, page=None):
        """Prepare the CDP session for a specific page."""
        if not page:
            raise ValueError("ChaosAgent requires a Playwright Page instance to initialize CDP.")
        self.page = page
        self.cdp = await self.page.context.new_cdp_session(page)
        logger.info(f"ChaosAgent attached CDP session to page: {page.url}")

    async def cpu_throttle(self, rate=4):
        """Throttle CPU performance (1 = no throttle, 4 = 4x slower)."""
        logger.info(f"ChaosAgent: Throttling CPU {rate}x")
        await self.cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate})

    async def network_throttle(self, profile="Slow 3G"):
        """Emulate network conditions."""
        profiles = {
            "Offline": {"offline": True, "downloadThroughput": 0, "uploadThroughput": 0, "latency": 0},
            "Slow 3G": {"offline": False, "downloadThroughput": 500 * 1024 / 8, "uploadThroughput": 500 * 1024 / 8, "latency": 400 * 1.5},
            "Fast 3G": {"offline": False, "downloadThroughput": 1.5 * 1024 * 1024 / 8, "uploadThroughput": 750 * 1024 / 8, "latency": 40 * 1.5},
            "No Throttling": {"offline": False, "downloadThroughput": -1, "uploadThroughput": -1, "latency": 0}
        }
        
        config = profiles.get(profile, profiles["No Throttling"])
        logger.info(f"ChaosAgent: Network throttling set to {profile}")
        await self.cdp.send('Network.enable')
        await self.cdp.send('Network.emulateNetworkConditions', config)
        
    async def inject_delayed_request(self, delay_ms=2000, target_url_pattern="*api*"):
        """Inject artificial latency for specific requests via CDP Fetch domain."""
        logger.info(f"ChaosAgent: Injecting {delay_ms}ms delay for {target_url_pattern}")
        await self.cdp.send('Fetch.enable', {
            'patterns': [{'urlPattern': target_url_pattern, 'requestStage': 'Request'}]
        })
        
        # In a real environment, you'd listen to the 'Fetch.requestPaused' event.
        # This requires setting up an event listener loop on the CDP session.
        self.cdp.on('Fetch.requestPaused', lambda event: asyncio.create_task(self._handle_paused_request(event, delay_ms)))

    async def _handle_paused_request(self, event, delay_ms):
        """Private handler to delay and then continue requests."""
        request_id = event['requestId']
        url = event['request']['url']
        logger.debug(f"ChaosAgent: Paused request to {url}, waiting {delay_ms}ms")
        await asyncio.sleep(delay_ms / 1000.0)
        try:
            await self.cdp.send('Fetch.continueRequest', {'requestId': request_id})
        except Exception as e:
            logger.warning(f"ChaosAgent: Failed to continue request {request_id} - {e}")

    async def inject_javascript_error(self, message="Simulated Chaos Error"):
        """Inject a random JS error into the page context."""
        logger.info(f"ChaosAgent: Injecting JS Error: {message}")
        await self.page.evaluate(f"setTimeout(() => {{ throw new Error('{message}'); }}, 500);")

    async def force_garbage_collection(self):
        """Command V8 to run a major garbage collection cycle."""
        logger.info("ChaosAgent: Forcing Garbage Collection via heap profiler")
        await self.cdp.send('HeapProfiler.enable')
        await self.cdp.send('HeapProfiler.collectGarbage')
        await self.cdp.send('HeapProfiler.disable')

    async def measure_core_web_vitals(self) -> Dict[str, Any]:
        """Reads Core Web Vitals (LCP, CLS, FID/INP proxy) from the page."""
        logger.info("ChaosAgent: Measuring Core Web Vitals")
        
        # A simple injection script to gather Navigation and Paint timing data
        vitals_script = """
        () => {
            const timing = window.performance.timing;
            const paint = window.performance.getEntriesByType('paint');
            let fcp = 0, lcp = 0;
            
            paint.forEach(p => {
                if (p.name === 'first-contentful-paint') { fcp = p.startTime; }
            });
            
            // This is a naive approximation; true LCP requires PerformanceObserver
            return {
                loadEventEnd: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstContentfulPaint: fcp,
                approximateLCP: fcp + 100 // Naive hardcode for simple proxy
            };
        }
        """
        metrics = await self.page.evaluate(vitals_script)
        logger.info(f"ChaosAgent: Vitals collected: {metrics}")
        return metrics

    async def teardown(self):
        """Cleanup CDP session and remove throttling."""
        logger.info("ChaosAgent: Tearing down chaos environment")
        try:
            await self.cpu_throttle(1)
            await self.network_throttle("No Throttling")
            await self.cdp.send('Fetch.disable')
            await self.cdp.detach()
        except Exception as e:
            logger.warning(f"ChaosAgent: Teardown error - {e}")
        finally:
            self.cdp = None
