"""Self Healing Agent for the AutonomousQA Platform.

Creates structural fingerprints of DOM elements and heals broken locators
automatically during test execution. 
"""

import os
import json
import logging
import asyncio
from typing import Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)

class SelfHealingAgent:
    """Manages DOM fingerprints and fixes broken selectors on the fly."""

    def __init__(self, storage_dir: str = "healing_maps"):
        self.storage_dir = storage_dir
        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir)

    def _get_fingerprint_path(self, test_id: str, element_id: str) -> str:
        """Get the file path for a specific element's fingerprint."""
        # Sanitizing might be needed for real prod
        clean_test = test_id.replace("/", "_").replace(":", "_")
        return os.path.join(self.storage_dir, f"{clean_test}_{element_id}.json")

    async def create_fingerprint(self, page, selector: str, test_id: str, element_id: str):
        """Creates a snapshot of an element's DOM neighborhood."""
        try:
            # Check if element exists
            element = page.locator(selector).first
            if not await element.count():
                logger.warning(f"SelfHealingAgent: Could not find target {selector} to fingerprint.")
                return False

            # Extract detailed properties
            eval_script = """
            (el) => {
                let rect = el.getBoundingClientRect();
                return {
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    textContent: el.textContent.trim().substring(0, 100),
                    attributes: Array.from(el.attributes).map(a => ({name: a.name, value: a.value})),
                    xpath: (function getPathTo(element) {
                        if (element === document.body) return element.tagName;
                        var ix= 0;
                        var siblings= element.parentNode.childNodes;
                        for (var i= 0; i<siblings.length; i++) {
                            var sibling= siblings[i];
                            if (sibling===element) return getPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
                            if (sibling.nodeType===1 && sibling.tagName===element.tagName) ix++;
                        }
                    })(el),
                    metrics: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                }
            }
            """
            fingerprint = await element.evaluate(eval_script)
            
            # Save fingerprint
            path = self._get_fingerprint_path(test_id, element_id)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(fingerprint, f, indent=2)
            
            logger.info(f"SelfHealingAgent: Fingerprint created for {element_id} at {selector}")
            return True

        except Exception as e:
            logger.error(f"SelfHealingAgent: Failed creating fingerprint for {element_id} - {e}")
            return False

    async def heal_locator(self, page, broken_selector: str, test_id: str, element_id: str) -> Optional[str]:
        """Tries to find the element using an LLM and the old fingerprint."""
        logger.info(f"SelfHealingAgent: Attempting to heal {element_id} (broken selector: {broken_selector})")
        
        path = self._get_fingerprint_path(test_id, element_id)
        if not os.path.exists(path):
            logger.warning(f"SelfHealingAgent: No fingerprint found for {element_id}, cannot heal.")
            return None

        with open(path, 'r', encoding='utf-8') as f:
            fingerprint = json.load(f)

        try:
            # We fetch a chunk of the current DOM to send to the LLM
            dom_snapshot = await page.evaluate("() => document.body.innerHTML")
            # Truncating heavily for context limits. A real implementation would parse the DOM 
            # smartly or use a simplified accessibility tree instead of raw innerHTML.
            dom_snapshot = dom_snapshot[:15000] 

            prompt = f"""
            You are a DOM parsing expert working as a Self-Healing Locator AI.
            A UI element previously found at '{broken_selector}' is now missing, likely due to a UI update.
            Here is the historical fingerprint of the element:
            {json.dumps(fingerprint, indent=2)}
            
            Here is the current DOM snapshot of the page:
            ```html
            {dom_snapshot}...
            ```
            
            Based on the textual content, tag name, and historic attributes, figure out what the NEW 
            Playwright locator string should be.
            Return ONLY a JSON formatted dictionary like this: {{"success": true, "new_selector": "..."}}
            """

            model = genai.GenerativeModel("gemini-2.0-flash")
            response = await asyncio.to_thread(model.generate_content, prompt)
            
            try:
                # Safely parse JSON response
                raw_text = response.text.replace('```json', '').replace('```', '').strip()
                result = json.loads(raw_text)
                new_selector = result.get('new_selector')
                
                if new_selector:
                    # Validate the proposed new selector!
                    if await page.locator(new_selector).count() > 0:
                        logger.info(f"SelfHealingAgent: Healed {element_id} -> {new_selector}")
                        return new_selector
                    else:
                        logger.warning(f"SelfHealingAgent: Proposed healed selector {new_selector} not found on page.")
                        
            except json.JSONDecodeError:
                logger.error("SelfHealingAgent: LLM did not return valid JSON.")

            return None

        except Exception as e:
            logger.error(f"SelfHealingAgent: Exception during healing prediction - {e}")
            return None
