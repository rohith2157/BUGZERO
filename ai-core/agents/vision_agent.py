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

    async def compare_screenshots(self, baseline_bytes: bytes, current_bytes: bytes, url: str) -> dict:
        """Compare a baseline screenshot against a current screenshot for visual regression.

        Sends both images to Gemini Vision to identify and classify visual changes.

        Args:
            baseline_bytes: PNG bytes of the baseline (previous run)
            current_bytes: PNG bytes of the current run
            url: The URL for context

        Returns:
            Dict with 'changes' list and 'regression_score'
        """
        if not self._available:
            return {"changes": [], "regression_score": 100, "summary": "Regression skipped"}

        try:
            baseline_img = Image.open(io.BytesIO(baseline_bytes))
            current_img = Image.open(io.BytesIO(current_bytes))

            prompt = f"""You are a Visual Regression Testing AI comparing two screenshots of the same web page.
URL: {url}

Image 1 = BASELINE (previous known-good state)
Image 2 = CURRENT (latest version to test)

Compare these two screenshots carefully and identify ALL visual changes:

1. **Cosmetic Changes**: font, color, spacing, border, shadow, gradient differences
2. **Functional Changes**: layout broken, element missing, text changed, new elements appeared, element repositioned significantly
3. **Regression Bugs**: elements that appear broken only in the CURRENT version

Return your findings as JSON:
{{
  "changes": [
    {{
      "change_type": "cosmetic" | "functional",
      "severity": "critical" | "major" | "minor" | "info",
      "description": "Clear description of the change",
      "location": "Where on the page",
      "confidence": 0.0-1.0
    }}
  ],
  "regression_score": 0-100,
  "summary": "One-line summary"
}}

If pages are identical: {{"changes": [], "regression_score": 100, "summary": "No visual changes detected"}}

IMPORTANT: Return ONLY valid JSON, no markdown."""

            response = self._model.generate_content([prompt, baseline_img, current_img])

            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)

            changes = result.get("changes", [])
            for change in changes:
                change.setdefault("change_type", "cosmetic")
                change.setdefault("severity", "minor")
                change.setdefault("description", "Unknown change")
                change.setdefault("confidence", 0.8)

            logger.info(f"VisionAgent: Regression found {len(changes)} change(s) on {url}")

            return {
                "changes": changes,
                "regression_score": result.get("regression_score", 100),
                "summary": result.get("summary", ""),
            }

        except json.JSONDecodeError as e:
            logger.error(f"VisionAgent: Failed to parse regression response for {url}: {e}")
            return {"changes": [], "regression_score": None, "summary": f"Parse error: {e}"}
        except Exception as e:
            logger.error(f"VisionAgent: Regression analysis failed for {url}: {e}")
            return {"changes": [], "regression_score": None, "summary": f"Error: {e}"}
