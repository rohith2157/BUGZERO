"""Auth Agent - Stage 2: Autonomous Auth Flow Navigation."""

import json
import logging
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    from PIL import Image
    import io
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    logger.info("google-generativeai or Pillow not installed - Auth Agent LLM fallback disabled")

AUTH_PROMPT = """You are an expert autonomous web automation agent. 
Look at the screenshot and find the login form.
Identify the CSS selectors needed to perform a login.
Return your findings as a JSON object with this exact structure:
{
  "is_login_page": true or false,
  "username_selector": "CSS selector for the username/email input",
  "password_selector": "CSS selector for the password input",
  "submit_selector": "CSS selector for the login submit button"
}
If it is not a login page or you cannot find the login form, set "is_login_page" to false.
IMPORTANT: Return ONLY valid JSON, no markdown, no extra text.
"""

class AuthAgent:
    """Navigates login pages autonomously using heuristics and LLM vision."""

    def __init__(self, playwright_tool, api_key: str = ""):
        self.tool = playwright_tool
        self._api_key = api_key
        self._model = None
        self._available = False

        if api_key and HAS_GEMINI:
            try:
                genai.configure(api_key=api_key)
                self._model = genai.GenerativeModel("gemini-2.0-flash")
                self._available = True
                logger.info("AuthAgent: Gemini Vision initialized for Auth")
            except Exception as e:
                logger.error(f"AuthAgent: Failed to initialize Gemini - {e}")

    async def _get_selectors_via_llm(self, url: str) -> Optional[dict]:
        if not self._available:
            return None
        
        try:
            screenshot_bytes = await self.tool._pw_get_screenshot(url)
            if not screenshot_bytes:
                return None
            
            image = Image.open(io.BytesIO(screenshot_bytes))
            prompt = f"URL being tested: {url}\n\n{AUTH_PROMPT}"
            response = self._model.generate_content([prompt, image])
            
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)
            return result if result.get("is_login_page") else None
        except Exception as e:
            logger.error(f"AuthAgent: LLM selector extraction failed: {e}")
            return None

    async def authenticate(self, url: str, username: str, password: str) -> bool:
        """Autonomously detect and execute login on the target URL."""
        logger.info(f"AuthAgent: Attempting autonomous login for {url}")
        
        heuristics = {
            "username_selector": "input[type='email'], input[name='username'], input[name='email'], input[id='email'], input[id='username']",
            "password_selector": "input[type='password'], input[name='password'], input[id='password']",
            "submit_selector": "button[type='submit'], input[type='submit'], button:has-text('Login'), button:has-text('Sign In')"
        }

        selectors = await self._get_selectors_via_llm(url)
        if not selectors:
            logger.info("AuthAgent: LLM unavailable or didn't find login, using heuristic selectors")
            selectors = heuristics

        success = await self.tool.execute_login(
            url=url,
            username_selector=selectors.get("username_selector", heuristics["username_selector"]),
            password_selector=selectors.get("password_selector", heuristics["password_selector"]),
            submit_selector=selectors.get("submit_selector", heuristics["submit_selector"]),
            username=username,
            password=password
        )

        if success:
            logger.info("AuthAgent: Successfully authenticated.")
        else:
            logger.warning("AuthAgent: Failed to authenticate.")
        return success
