"""Chaos Agent - Stage 5: Performance Chaos Agent"""

import logging

logger = logging.getLogger(__name__)

class ChaosAgent:
    """Injects performance chaos (network throttling, slow loading, simulated errors)."""

    def __init__(self, playwright_tool):
        self.tool = playwright_tool

    async def inject_network_chaos(self, profile: str = "Slow 3G"):
        """Enable network chaos using CDP."""
        logger.info(f"ChaosAgent: Injecting {profile} network condition.")
        await self.tool.set_network_conditions(profile)

    async def inject_cpu_throttling(self, rate: int = 4):
        """Enable CPU throttling (e.g. 4x slower)."""
        logger.info(f"ChaosAgent: Injecting {rate}x CPU throttling.")
        await self.tool.set_cpu_throttling(rate)

    async def disable_chaos(self):
        """Disable all chaos conditions."""
        logger.info("ChaosAgent: Disabling all chaos conditions.")
        await self.tool.disable_chaos_conditions()
