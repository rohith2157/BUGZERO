"""Self Healing Agent for the AutonomousQA Platform.

Creates structural fingerprints of DOM elements and heals broken locators
automatically during test execution. 

Integrated into the orchestrator pipeline — fingerprints are created before
testing and healing is attempted when selectors fail.

[Pure Algorithmic Version - No LLM required]
"""

import os
import json
import logging
import asyncio
from typing import Optional
import math
import httpx

logger = logging.getLogger(__name__)

def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculates the Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def string_similarity(s1: str, s2: str) -> float:
    """Returns a similarity score between 0.0 and 1.0."""
    if not s1 and not s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    max_len = max(len(s1), len(s2))
    dist = levenshtein_distance(s1, s2)
    return 1.0 - (dist / max_len)


class SelfHealingAgent:
    """Manages DOM fingerprints and fixes broken selectors on the fly using fuzzy DOM matching."""

    def __init__(self, playwright_tool, gateway_url: str = "", org_id: str = None):
        self.tool = playwright_tool
        self.gateway_url = gateway_url
        self.org_id = org_id
        self.healing_events = []  # Track all healing events for this run

        # We ignore api_key as we are now 100% algorithmic!
        logger.info("SelfHealingAgent initialized in Pure Algorithmic Mode (No LLM).")

    def is_available(self) -> bool:
        # Always available since it relies on pure math, not an API key.
        return True

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

            # Save fingerprints to PostgreSQL via Node Gateway
            if self.gateway_url and self.org_id:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(
                        f"{self.gateway_url}/api/healing/map",
                        json={
                            "orgId": self.org_id,
                            "url": url,
                            "mapData": fingerprints
                        }
                    )
            
            logger.info(f"SelfHealingAgent: Fingerprinted {len(fingerprints)} elements on {url}")
            return fingerprints

        except Exception as e:
            logger.warning(f"SelfHealingAgent: Fingerprinting failed on {url}: {e}")
            return {}

    async def get_previous_fingerprints(self, url: str) -> Optional[dict]:
        """Load previously saved fingerprints for a URL from the PostgreSQL database."""
        if not self.gateway_url or not self.org_id:
            return None
            
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.gateway_url}/api/healing/map",
                    params={"orgId": self.org_id, "url": url}
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.warning(f"SelfHealingAgent: Failed to fetch previous fingerprints for {url}: {e}")
            return None

    def _score_element(self, candidate: dict, fingerprint: dict) -> float:
        """
        Pure algorithmic fuzzy scoring heuristic.
        Max score is ~100.
        """
        score = 0.0
        
        # 1. Tag Match (Strict)
        if candidate.get("tagName") == fingerprint.get("tagName"):
            score += 20.0
            
        # 2. Text Similarity (Levenshtein)
        cand_text = candidate.get("textContent", "").lower()
        fp_text = fingerprint.get("textContent", "").lower()
        if cand_text or fp_text:
            text_sim = string_similarity(cand_text, fp_text)
            score += (text_sim * 35.0)  # Max 35 points for text
            
        # 3. Attributes (ID, Class, Name)
        if fingerprint.get("id") and candidate.get("id") == fingerprint.get("id"):
            score += 15.0
            
        if fingerprint.get("name") and candidate.get("name") == fingerprint.get("name"):
            score += 10.0
            
        # Class similarity
        cand_class = candidate.get("className", "")
        fp_class = fingerprint.get("className", "")
        if cand_class and fp_class:
            c_set = set(cand_class.split())
            f_set = set(fp_class.split())
            if f_set:
                overlap = len(c_set.intersection(f_set)) / len(f_set)
                score += (overlap * 10.0)
                
        # 4. Spatial Proximity (Pythagorean)
        c_metrics = candidate.get("metrics", {})
        f_metrics = fingerprint.get("metrics", {})
        
        cx, cy = c_metrics.get("x", 0), c_metrics.get("y", 0)
        fx, fy = f_metrics.get("x", 0), f_metrics.get("y", 0)
        
        distance = math.sqrt((cx - fx)**2 + (cy - fy)**2)
        # Decay function: if distance is 0, score is 10. If distance > 500, score is ~0.
        spatial_score = 10.0 * math.exp(-0.005 * distance)
        score += spatial_score
        
        return score

    async def _get_all_elements_as_candidates(self, page) -> list[dict]:
        """Extracts a flattened list of all interactive elements on the page for scoring."""
        return await page.evaluate("""() => {
            const elements = document.querySelectorAll('button, a, input, form, select, textarea, [role="button"]');
            const results = [];
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) continue;
                
                // Build a robust selector for healing
                let generatedSelector = '';
                if (el.id) {
                    generatedSelector = '#' + CSS.escape(el.id);
                } else if (el.name) {
                    generatedSelector = `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
                } else if (el.className && typeof el.className === 'string') {
                    const classes = el.className.split(' ').filter(c => c).map(c => '.' + CSS.escape(c)).join('');
                    if (classes) {
                        generatedSelector = el.tagName.toLowerCase() + classes;
                    }
                }
                
                if (!generatedSelector) {
                    generatedSelector = el.tagName.toLowerCase();
                }

                results.push({
                    tagName: el.tagName,
                    id: el.id || '',
                    className: el.className || '',
                    textContent: (el.textContent || '').trim().substring(0, 80),
                    type: el.type || '',
                    name: el.name || '',
                    metrics: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
                    selector: generatedSelector
                });
            }
            return results;
        }""")

    async def detect_and_heal(self, page, url: str) -> list[dict]:
        """Compare current page elements against saved fingerprints using fuzzy algorithms."""
        previous = await self.get_previous_fingerprints(url)
        if not previous:
            return []

        events = []

        try:
            candidates = None  # Lazy load

            # Check which previously fingerprinted elements are missing
            for elem_id, fingerprint in previous.items():
                selector = fingerprint.get("selector", "")
                if not selector:
                    continue

                # Check if the original selector still works
                try:
                    count = await page.count(selector)
                    if count > 0:
                        continue  # Element still found, no healing needed
                except Exception:
                    pass

                # Selector is broken — attempt healing via Algorithm
                logger.info(f"SelfHealingAgent: Broken selector detected: {selector} for {elem_id}")
                
                if candidates is None:
                    candidates = await self._get_all_elements_as_candidates(page)

                best_score = 0.0
                best_candidate = None
                
                for cand in candidates:
                    score = self._score_element(cand, fingerprint)
                    if score > best_score:
                        best_score = score
                        best_candidate = cand

                # Threshold to prevent false positive clicks (magic number derived from heuristics)
                if best_candidate and best_score >= 55.0:
                    new_sel = best_candidate["selector"]
                    
                    # Ensure selector is relatively unique or grab first
                    try:
                        if await page.count(new_sel) > 0:
                            confidence = best_score / 100.0
                            event = {
                                "original_selector": selector,
                                "healed_selector": new_sel,
                                "element_id": elem_id,
                                "confidence": round(confidence, 2),
                            }
                            events.append(event)
                            self.healing_events.append(event)
                            logger.info(f"SelfHealingAgent: ✅ ALGO-Healed {elem_id}: {selector} → {new_sel} (Score: {best_score:.1f}/100)")
                        else:
                            logger.warning(f"SelfHealingAgent: Proposed selector '{new_sel}' not found.")
                    except Exception:
                        pass
                else:
                    logger.warning(f"SelfHealingAgent: Could not find algorithmic match for {elem_id} (Best score: {best_score:.1f})")

        except Exception as e:
            logger.error(f"SelfHealingAgent: detect_and_heal failed on {url}: {e}")

        if events:
            logger.info(f"SelfHealingAgent: Healed {len(events)} selector(s) algorithmically on {url}")

        return events

    async def heal_locator(self, page, broken_selector: str, test_id: str, element_id: str) -> Optional[str]:
        """Tries to find the element using fuzzy matching against the old fingerprint."""
        logger.info(f"SelfHealingAgent: Attempting to heal {element_id} (broken selector: {broken_selector})")
        
        path = self._get_fingerprint_path(test_id + "_" + element_id)
        if not os.path.exists(path):
            logger.warning(f"SelfHealingAgent: No fingerprint found for {element_id}, cannot heal.")
            return None

        with open(path, 'r', encoding='utf-8') as f:
            fingerprint = json.load(f)

        try:
            candidates = await self._get_all_elements_as_candidates(page)
            best_score = 0.0
            best_candidate = None
            
            for cand in candidates:
                score = self._score_element(cand, fingerprint)
                if score > best_score:
                    best_score = score
                    best_candidate = cand
                    
            if best_candidate and best_score >= 55.0:
                new_selector = best_candidate["selector"]
                if await page.count(new_selector) > 0:
                    logger.info(f"SelfHealingAgent: Healed {element_id} -> {new_selector} (Score: {best_score:.1f})")
                    event = {
                        "original_selector": broken_selector,
                        "healed_selector": new_selector,
                        "element_id": element_id,
                        "confidence": round(best_score/100.0, 2),
                    }
                    self.healing_events.append(event)
                    return new_selector

            logger.error(f"SelfHealingAgent: Algo failed to find match for {element_id}.")
            return None

        except Exception as e:
            logger.error(f"SelfHealingAgent: Exception during healing prediction - {e}")
            return None

    # create_fingerprint remains identical
    async def create_fingerprint(self, page, selector: str, test_id: str, element_id: str):
        """Creates a snapshot of an element's DOM neighborhood."""
        try:
            if not await page.count(selector):
                logger.warning(f"SelfHealingAgent: Could not find target {selector} to fingerprint.")
                return False
            element = page.locator(selector).first

            eval_script = """
            (el) => {
                let rect = el.getBoundingClientRect();
                return {
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    textContent: el.textContent.trim().substring(0, 100),
                    attributes: Array.from(el.attributes).map(a => ({name: a.name, value: a.value})),
                    metrics: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                }
            }
            """
            fingerprint = await element.evaluate(eval_script)
            
            path = self._get_fingerprint_path(test_id + "_" + element_id)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(fingerprint, f, indent=2)
            
            logger.info(f"SelfHealingAgent: Fingerprint created for {element_id} at {selector}")
            return True
        except Exception as e:
            logger.error(f"SelfHealingAgent: Failed creating fingerprint for {element_id} - {e}")
            return False
