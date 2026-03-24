"""Self-Healing Agent - Stage 3: Autonomous element recovery and adaptation."""

import json
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    logger.info("google-generativeai not installed - Self-Healing LLM fallback disabled")

HEALING_PROMPT = """You are an expert self-healing test automation agent.
The test script tried to interact with an element using the 'failed_selector', but it was not found or is no longer valid.
Here is the HTML snapshot of the surrounding DOM. 
Find the most likely new selector for the target element (it might have changed ID, class, or text).
Return strictly JSON:
{
  "healed_selector": "new CSS selector here",
  "confidence": 0-100,
  "reason": "brief explanation"
}
If the element truly cannot be found logically, set healed_selector to null.
"""

class SelfHealingAgent:
    """Uses LLMs to auto-heal broken locators when the DOM changes."""

    def __init__(self, api_key: str = ""):
        self._api_key = api_key
        self._model = None
        self._available = False

        if api_key and HAS_GEMINI:
            try:
                genai.configure(api_key=api_key)
                self._model = genai.GenerativeModel("gemini-2.0-flash")
                self._available = True
                logger.info("SelfHealingAgent: Gemini Vision initialized.")
            except Exception as e:
                logger.error(f"SelfHealingAgent: Failed to initialize Gemini - {e}")

    async def attempt_heal(self, failed_selector: str, dom_snapshot: str) -> Optional[Dict]:
        """Tries to find a replacement selector for a failed one using the DOM snapshot."""
        if not self._available:
            return None

        prompt = f"Failed Selector: {failed_selector}\n\nDOM Snapshot:\n```html\n{dom_snapshot}\n```\n\n{HEALING_PROMPT}"
        try:
            response = self._model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)
            if result.get("healed_selector"):
                logger.info(f"Self-healed selector '{failed_selector}' -> '{result['healed_selector']}' (Confidence: {result.get('confidence')})")
                return result
            return None
        except Exception as e:
            logger.error(f"SelfHealingAgent: Error during healing - {e}")
            return None
