"""Vision Agent — Pure Algorithmic Visual Regression.

Stage 4 of AutonomousQA pipeline:
  - Takes screenshots of each page (from Playwright)
  - Performs pure mathematical visual regression (SSIM/MSE style) against a baseline
  - No LLMs used. 100% deterministic and offline.
"""

import logging
import io
import math
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from PIL import Image, ImageChops, ImageStat, ImageFilter
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    logger.info("Pillow not installed — Vision analysis disabled")


class VisionAgent:
    """Analyzes page screenshots mathematically."""

    def __init__(self, api_key: str = ""):
        # We ignore api_key now, pure algorithm!
        self._available = HAS_PIL
        if self._available:
            logger.info("VisionAgent: Initialized in Pure Algorithmic Mode (No LLM).")
        else:
            logger.warning("VisionAgent: Pillow is required for algorithmic visual regression.")

    def is_available(self) -> bool:
        return self._available

    async def analyze_screenshot(self, screenshot_bytes: bytes, url: str) -> dict:
        """Single-shot analysis. Since we don't have an LLM to judge 'ugly UX', 
        we perform basic sanity checks (e.g., is the page blank?)."""
        
        if not self._available:
            return {"defects": [], "page_quality_score": None, "summary": "Pillow not installed"}

        try:
            image = Image.open(io.BytesIO(screenshot_bytes)).convert('RGB')
            stat = ImageStat.Stat(image)
            
            # Basic sanity check: Is the page almost entirely one color?
            # Standard deviation of colors near 0 means it's a solid block.
            std_dev = sum(stat.stddev) / len(stat.stddev)
            
            defects = []
            score = 100.0
            
            if std_dev < 5.0:
                score = 0.0
                defects.append({
                    "type": "Visual",
                    "severity": "critical",
                    "message": "Page appears to be completely blank or solid color. Potential fatal render error.",
                    "location": "Global",
                    "fix": "Check for unhandled exceptions or blank white screens of death.",
                    "source": "algorithmic_vision",
                    "confidence": 1.0
                })
                
            return {
                "defects": defects,
                "page_quality_score": score,
                "summary": "Algorithmic sanity check passed." if score == 100.0 else "Blank page detected!"
            }
            
        except Exception as e:
            logger.error(f"VisionAgent: Algorithmic analysis failed for {url}: {e}")
            return {"defects": [], "page_quality_score": None, "summary": f"Error: {e}"}

    async def compare_screenshots(self, baseline_bytes: bytes, current_bytes: bytes, url: str) -> dict:
        """Pure mathematical visual regression comparing two images."""
        if not self._available:
            return {"changes": [], "regression_score": 100.0, "summary": "Pillow not installed"}
            
        if baseline_bytes == current_bytes:
            return {
                "changes": [],
                "regression_score": 100.0,
                "summary": "100% Exact Byte Match"
            }

        try:
            img1 = Image.open(io.BytesIO(baseline_bytes)).convert('RGB')
            img2 = Image.open(io.BytesIO(current_bytes)).convert('RGB')
            
            # Ensure same size for diffing
            if img1.size != img2.size:
                # Resize img2 to match img1 for a best-effort diff
                img2 = img2.resize(img1.size)

            # Apply slight blur to ignore minor anti-aliasing text shifts
            blur_radius = 1
            img1_blurred = img1.filter(ImageFilter.GaussianBlur(blur_radius))
            img2_blurred = img2.filter(ImageFilter.GaussianBlur(blur_radius))
            
            # Calculate absolute difference
            diff = ImageChops.difference(img1_blurred, img2_blurred)
            stat = ImageStat.Stat(diff)
            
            # Sum of absolute pixel differences across RGB divided by total possible difference
            total_diff = sum(stat.sum)
            max_diff = img1.size[0] * img1.size[1] * 255 * 3
            
            difference_percentage = (total_diff / max_diff) * 100.0
            regression_score = max(0.0, 100.0 - (difference_percentage * 5)) # Multiply penalty by 5 for sensitivity
            
            changes = []
            if difference_percentage > 0.5: # 0.5% threshold for noise
                changes.append({
                    "change_type": "functional",
                    "severity": "major" if difference_percentage > 5.0 else "minor",
                    "description": f"Algorithmic Visual Regression: {difference_percentage:.2f}% pixel variance detected.",
                    "location": "Global",
                    "confidence": 1.0
                })
                
            return {
                "changes": changes,
                "regression_score": round(regression_score, 2),
                "summary": f"Algorithmic Diff: {difference_percentage:.2f}% difference"
            }

        except Exception as e:
            logger.error(f"VisionAgent: Regression diff failed for {url}: {e}")
            return {"changes": [], "regression_score": None, "summary": f"Error: {e}"}
