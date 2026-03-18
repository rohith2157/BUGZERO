"""Vision Agent — AI-powered visual bug detection using Google Gemini.

Stage 4 of AutonomousQA pipeline:
  - Takes screenshots of each page (from Playwright)
  - Sends them to Gemini Vision for analysis
  - Returns structured defect reports (visual bugs, UX issues)

OPTIONAL: If GEMINI_API_KEY is not set, this stage is skipped entirely.
"""

import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    from PIL import Image
    import io
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    logger.info("google-generativeai or Pillow not installed — Vision analysis disabled")


# The prompt sent to Gemini along with each screenshot
VISION_PROMPT = """You are an expert QA engineer performing visual inspection on a web page screenshot.

Analyze this screenshot carefully and identify:

1. **Visual Bugs**: overlapping elements, cut-off text, broken layouts, misaligned items,
   images not loading, text overflowing containers, elements outside viewport
2. **UX Issues**: poor color contrast, unreadable text, inconsistent spacing, cluttered UI,
   buttons too small to click, confusing navigation, missing visual hierarchy
3. **Responsive Issues**: elements that appear broken at this viewport size

Return your findings as a JSON object with this exact structure:
{
  "defects": [
    {
      "type": "Visual" | "UX" | "Responsive",
      "severity": "critical" | "major" | "minor" | "warning",
      "message": "Clear description of the issue",
      "location": "Where on the page (e.g., 'top navigation', 'footer', 'main content area')",
      "fix": "Suggested fix"
    }
  ],
  "page_quality_score": 0-100,
  "summary": "One-line summary of visual quality"
}

If no issues are found, return: {"defects": [], "page_quality_score": 100, "summary": "No visual issues detected"}

IMPORTANT: Return ONLY valid JSON, no markdown, no extra text."""


class VisionAgent:
    """Analyzes page screenshots using Google Gemini Vision API."""

    def __init__(self, api_key: str = ""):
        self._api_key = api_key
        self._model = None
        self._available = False

        if not api_key:
            logger.info("VisionAgent: No GEMINI_API_KEY configured — vision analysis disabled")
            return

        if not HAS_GEMINI:
            logger.warning("VisionAgent: google-generativeai package not installed")
            return

        try:
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel("gemini-2.0-flash")
            self._available = True
            logger.info("VisionAgent: Gemini Vision initialized successfully")
        except Exception as e:
            logger.error(f"VisionAgent: Failed to initialize Gemini — {e}")

    def is_available(self) -> bool:
        """Check if Gemini Vision is configured and ready."""
        return self._available

    async def analyze_screenshot(self, screenshot_bytes: bytes, url: str) -> dict:
        """Send a screenshot to Gemini Vision and return structured defect report.

        Args:
            screenshot_bytes: PNG screenshot bytes from Playwright
            url: The URL of the page (for context)

        Returns:
            Dict with 'defects' list, 'page_quality_score', and 'summary'
        """
        if not self._available:
            return {"defects": [], "page_quality_score": None, "summary": "Vision analysis skipped"}

        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(screenshot_bytes))

            # Send to Gemini
            prompt = f"URL being tested: {url}\n\n{VISION_PROMPT}"
            response = self._model.generate_content([prompt, image])

            # Parse JSON response
            text = response.text.strip()
            # Handle markdown-wrapped JSON (```json ... ```)
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)

            # Validate structure
            defects = result.get("defects", [])
            for defect in defects:
                defect.setdefault("type", "Visual")
                defect.setdefault("severity", "minor")
                defect.setdefault("message", "Unknown visual issue")
                defect.setdefault("fix", None)
                # Mark as AI-detected
                defect["source"] = "gemini_vision"
                defect["confidence"] = 0.85

            logger.info(f"VisionAgent: Found {len(defects)} issue(s) on {url}")

            return {
                "defects": defects,
                "page_quality_score": result.get("page_quality_score"),
                "summary": result.get("summary", ""),
            }

        except json.JSONDecodeError as e:
            logger.error(f"VisionAgent: Failed to parse Gemini response for {url}: {e}")
            return {"defects": [], "page_quality_score": None, "summary": f"Parse error: {e}"}
        except Exception as e:
            logger.error(f"VisionAgent: Analysis failed for {url}: {e}")
            return {"defects": [], "page_quality_score": None, "summary": f"Error: {e}"}
