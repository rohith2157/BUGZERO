"""Self Healing Agent for the AutonomousQA Platform.

Creates structural fingerprints of DOM elements and heals broken locators
automatically during test execution. 

Integrated into the orchestrator pipeline — fingerprints are created before
testing and healing is attempted when selectors fail.
"""

import os
import json
import logging
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False


class SelfHealingAgent:
    """Manages DOM fingerprints and fixes broken selectors on the fly."""

    def __init__(self, playwright_tool=None, api_key: str = "", storage_dir: str = "healing_maps"):
        self.storage_dir = storage_dir
        self._playwright = playwright_tool
        self._api_key = api_key
        self._model = None
        self.healing_events = []  # Track all healing events for this run

        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir, exist_ok=True)

        if api_key and HAS_GEMINI:
            try:
                genai.configure(api_key=api_key)
                self._model = genai.GenerativeModel("gemini-2.0-flash")
            except Exception as e:
                logger.warning(f"SelfHealingAgent: Could not init Gemini — {e}")

    def is_available(self) -> bool:
        return self._model is not None

    def _get_fingerprint_path(self, url: str) -> str:
        """Get the file path for a page's fingerprints."""
        clean = url.replace("://", "_").replace("/", "_").replace(":", "_").replace("?", "_")[:120]
        return os.path.join(self.storage_dir, f"{clean}.json")

    async def fingerprint_page(self, page, url: str) -> dict:
        """Auto-fingerprint key interactive elements on a page.
        
        Captures buttons, links, inputs, and forms — the elements most
        likely to break when UI changes.
        
        Returns dict mapping element_id -> fingerprint.
        """
        try:
            fingerprints = await page.evaluate("""() => {
                const results = {};
                const selectors = [
                    { sel: 'button', tag: 'button' },
                    { sel: 'a[href]', tag: 'link' },
                    { sel: 'input:not([type=hidden])', tag: 'input' },
                    { sel: 'form', tag: 'form' },
                    { sel: '[role=button]', tag: 'role-button' },
                    { sel: 'select', tag: 'select' },
                    { sel: 'textarea', tag: 'textarea' },
                ];
                let idx = 0;
                for (const {sel, tag} of selectors) {
                    const els = document.querySelectorAll(sel);
                    for (let i = 0; i < Math.min(els.length, 10); i++) {
                        const el = els[i];
                        const rect = el.getBoundingClientRect();
                        if (rect.width === 0 && rect.height === 0) continue;
                        const id = `${tag}_${idx++}`;
                        results[id] = {
                            tagName: el.tagName,
                            id: el.id || '',
                            className: el.className || '',
                            textContent: (el.textContent || '').trim().substring(0, 80),
                            type: el.type || '',
                            name: el.name || '',
                            href: el.href || '',
                            ariaLabel: el.getAttribute('aria-label') || '',
                            placeholder: el.placeholder || '',
                            attributes: Array.from(el.attributes).slice(0, 8).map(a => ({name: a.name, value: a.value.substring(0, 60)})),
                            metrics: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
                            selector: el.id ? '#' + el.id : (el.name ? `${el.tagName.toLowerCase()}[name="${el.name}"]` : ''),
                        };
                    }
                }
                return results;
            }""")

            # Save fingerprints to disk
            path = self._get_fingerprint_path(url)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(fingerprints, f, indent=2)

            logger.info(f"SelfHealingAgent: Fingerprinted {len(fingerprints)} elements on {url}")
            return fingerprints

        except Exception as e:
            logger.warning(f"SelfHealingAgent: Fingerprinting failed on {url}: {e}")
            return {}

    def get_previous_fingerprints(self, url: str) -> Optional[dict]:
        """Load previously saved fingerprints for a URL."""
        path = self._get_fingerprint_path(url)
        if not os.path.exists(path):
            return None
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None

    async def detect_and_heal(self, page, url: str) -> list[dict]:
        """Compare current page elements against saved fingerprints.
        
        Detects elements that have moved, changed selectors, or disappeared,
        and attempts to heal broken locators using Gemini LLM.
        
        Returns list of healing events.
        """
        if not self._model:
            return []

        previous = self.get_previous_fingerprints(url)
        if not previous:
            return []

        events = []

        try:
            # Get current DOM snapshot (trimmed for context limits)
            dom_snapshot = await page.evaluate("() => document.body.innerHTML")
            dom_snapshot = dom_snapshot[:12000]

            # Check which previously fingerprinted elements are missing
            for elem_id, fingerprint in previous.items():
                selector = fingerprint.get("selector", "")
                if not selector:
                    continue

                # Check if the original selector still works
                try:
                    count = await page.locator(selector).count()
                    if count > 0:
                        continue  # Element still found, no healing needed
                except Exception:
                    pass

                # Selector is broken — attempt healing via Gemini
                logger.info(f"SelfHealingAgent: Broken selector detected: {selector} for {elem_id}")

                prompt = f"""You are a Self-Healing Locator AI. A UI element is missing from the page.

Previous fingerprint:
- Tag: {fingerprint.get('tagName', '')}
- Text: "{fingerprint.get('textContent', '')}"
- ID: "{fingerprint.get('id', '')}"
- Class: "{fingerprint.get('className', '')}"
- ARIA Label: "{fingerprint.get('ariaLabel', '')}"
- Type: "{fingerprint.get('type', '')}"
- Position: x={fingerprint.get('metrics', {}).get('x', 0)}, y={fingerprint.get('metrics', {}).get('y', 0)}
- Original selector: {selector}

Current DOM (truncated):
```html
{dom_snapshot[:6000]}
```

Find the element that best matches the fingerprint. Return ONLY JSON:
{{"success": true, "new_selector": "css-selector-here", "confidence": 0.0-1.0}}
Or if not found: {{"success": false}}"""

                try:
                    response = await asyncio.to_thread(self._model.generate_content, prompt)
                    raw = response.text.replace('```json', '').replace('```', '').strip()
                    result = json.loads(raw)

                    if result.get("success") and result.get("new_selector"):
                        new_sel = result["new_selector"]
                        confidence = result.get("confidence", 0.8)

                        # Validate the proposed selector exists
                        try:
                            if await page.locator(new_sel).count() > 0:
                                event = {
                                    "original_selector": selector,
                                    "healed_selector": new_sel,
                                    "element_id": elem_id,
                                    "confidence": round(confidence, 2),
                                }
                                events.append(event)
                                self.healing_events.append(event)
                                logger.info(f"SelfHealingAgent: ✅ Healed {elem_id}: {selector} → {new_sel} (conf: {confidence:.0%})")
                            else:
                                logger.warning(f"SelfHealingAgent: Proposed selector '{new_sel}' not found on page")
                        except Exception:
                            pass
                except (json.JSONDecodeError, Exception) as e:
                    logger.warning(f"SelfHealingAgent: Healing attempt failed for {elem_id}: {e}")
                    continue

        except Exception as e:
            logger.error(f"SelfHealingAgent: detect_and_heal failed on {url}: {e}")

        if events:
            logger.info(f"SelfHealingAgent: Healed {len(events)} selector(s) on {url}")

        return events

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
            path = self._get_fingerprint_path(test_id + "_" + element_id)
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
        
        path = self._get_fingerprint_path(test_id + "_" + element_id)
        if not os.path.exists(path):
            logger.warning(f"SelfHealingAgent: No fingerprint found for {element_id}, cannot heal.")
            return None

        with open(path, 'r', encoding='utf-8') as f:
            fingerprint = json.load(f)

        try:
            # We fetch a chunk of the current DOM to send to the LLM
            dom_snapshot = await page.evaluate("() => document.body.innerHTML")
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
            Return ONLY a JSON formatted dictionary like this: {{"success": true, "new_selector": "...", "confidence": 0.0-1.0}}
            """

            response = await asyncio.to_thread(self._model.generate_content, prompt)
            
            try:
                # Safely parse JSON response
                raw_text = response.text.replace('```json', '').replace('```', '').strip()
                result = json.loads(raw_text)
                new_selector = result.get('new_selector')
                confidence = result.get('confidence', 0.8)
                
                if new_selector:
                    # Validate the proposed new selector!
                    if await page.locator(new_selector).count() > 0:
                        logger.info(f"SelfHealingAgent: Healed {element_id} -> {new_selector}")
                        # Track the healing event
                        event = {
                            "original_selector": broken_selector,
                            "healed_selector": new_selector,
                            "element_id": element_id,
                            "confidence": round(confidence, 2),
                        }
                        self.healing_events.append(event)
                        return new_selector
                    else:
                        logger.warning(f"SelfHealingAgent: Proposed healed selector {new_selector} not found on page.")
                        
            except json.JSONDecodeError:
                logger.error("SelfHealingAgent: LLM did not return valid JSON.")

            return None

        except Exception as e:
            logger.error(f"SelfHealingAgent: Exception during healing prediction - {e}")
            return None
