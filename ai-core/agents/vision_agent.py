"""Vision Agent — SIMD-Accelerated Visual Regression.

Stage 4 of AutonomousQA pipeline:
  - Takes screenshots of each page (from Playwright)
  - Performs SIMD-vectorized visual regression (SSIM/MSE) against a baseline
  - Falls back to scalar Pillow if NumPy unavailable
  - No LLMs used. 100% deterministic and offline.
"""

import logging
import io
import math
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)

try:
    from PIL import Image, ImageChops, ImageStat, ImageFilter
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    logger.info("Pillow not installed — Vision analysis disabled")


from utils.hf_client import hf_vlm_client

# SIMD engine layer — Tier 1/2 acceleration with Tier 3 Pillow fallback
try:
    from utils.simd_vision_engine import compute_simd_full, SIMD_TIER
    from utils.simd_collision_engine import detect_simd_collisions
    HAS_SIMD = True
    logger.info(f"VisionAgent: SIMD engines loaded (tier: {SIMD_TIER})")
except ImportError:
    HAS_SIMD = False
    logger.info("VisionAgent: SIMD engines unavailable — using Pillow scalar fallback")


class VisionAgent:
    """Analyzes page screenshots using NVIDIA Eagle VLM with local PIL fallback."""

    def __init__(self):
        self._available = HAS_PIL
        if hf_vlm_client.is_configured():
            logger.info("VisionAgent: Initialized with Hugging Face VLM (nvidia/Eagle2-2B).")
        elif self._available:
            logger.info("VisionAgent: Initialized in Pure Algorithmic Mode (No LLM/VLM token).")
        else:
            logger.warning("VisionAgent: Pillow is required for algorithmic visual regression.")

    def is_available(self) -> bool:
        return self._available or hf_vlm_client.is_configured()

    async def analyze_screenshot(self, screenshot_bytes: bytes, url: str) -> dict:
        """Analyzes screenshot for visual defects via HF VLM or local PIL fallback."""
        
        # 1. Try Hugging Face VLM (nvidia/Eagle2-2B) if configured
        if hf_vlm_client.is_configured():
            logger.info(f"[VisionAgent] [VLM] Querying HF VLM ({settings.hf_model_id}) for {url}...")
            print(f"[VisionAgent] [VLM] Querying HF VLM ({settings.hf_model_id}) for {url}...", flush=True)
            vlm_prompt = (
                "Analyze this web page screenshot for visual defects, layout bugs, overlapping text, "
                "or broken styling. State if the page is healthy or list any visual defects."
            )
            vlm_response = await hf_vlm_client.query_vlm(screenshot_bytes, vlm_prompt)
            if vlm_response:
                logger.info(f"[VisionAgent] [VLM] Response received for {url}")
                print(f"[VisionAgent] [VLM] Response received for {url}", flush=True)
                defects = []
                score = 100.0
                if any(word in vlm_response.lower() for word in ["defect", "bug", "overlap", "broken", "error", "blank"]):
                    score = 70.0
                    defects.append({
                        "type": "Visual",
                        "severity": "major",
                        "message": f"NVIDIA Eagle2 VLM detected visual issue: {vlm_response[:200]}",
                        "location": "Global",
                        "fix": "Inspect CSS styling and responsive layout.",
                        "source": "hf_nvidia_vlm",
                        "confidence": 0.9
                    })
                return {
                    "defects": defects,
                    "page_quality_score": score,
                    "summary": f"HF VLM Analysis: {vlm_response[:150]}"
                }
            else:
                logger.warning(f"[VisionAgent] [OFFLINE] HF VLM query skipped/failed -> Falling back to local PIL image math")
                print(f"[VisionAgent] [OFFLINE] HF VLM query skipped/failed -> Falling back to local PIL image math for {url}", flush=True)
        else:
            logger.info(f"[VisionAgent] [OFFLINE] Mode -> Running local PIL image math for {url}")
            print(f"[VisionAgent] [OFFLINE] Mode -> Running local PIL image math for {url}", flush=True)


        # 2. Fall back to local PIL algorithmic analysis
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
        """Visual regression comparing two images. Uses SIMD engine when available."""
        if not self._available:
            return {"changes": [], "regression_score": 100.0, "summary": "Pillow not installed"}
            
        if baseline_bytes == current_bytes:
            return {
                "changes": [],
                "regression_score": 100.0,
                "summary": "100% Exact Byte Match"
            }

        # --- SIMD Tier 1/2 path (vectorized NumPy AVX2) ---
        if HAS_SIMD:
            try:
                result = compute_simd_full(baseline_bytes, current_bytes)
                drift = result['drift_percentage']
                regression_score = result['regression_score']
                ssim_score = result['ssim']

                changes = []
                if drift > 0.5:
                    changes.append({
                        "change_type": "functional",
                        "severity": "major" if drift > 5.0 else "minor",
                        "description": f"SIMD Visual Regression: {drift:.2f}% pixel variance (SSIM: {ssim_score:.4f})",
                        "location": "Global",
                        "confidence": 1.0
                    })

                return {
                    "changes": changes,
                    "regression_score": round(regression_score, 2),
                    "ssim": ssim_score,
                    "summary": f"SIMD Diff ({result['simd_tier']}): {drift:.2f}% difference, SSIM={ssim_score}"
                }
            except Exception as e:
                logger.warning(f"VisionAgent: SIMD diff failed, falling back to Pillow: {e}")

        # --- Tier 3 fallback: scalar Pillow ---
        try:
            img1 = Image.open(io.BytesIO(baseline_bytes)).convert('RGB')
            img2 = Image.open(io.BytesIO(current_bytes)).convert('RGB')
            
            if img1.size != img2.size:
                img2 = img2.resize(img1.size)

            blur_radius = 1
            img1_blurred = img1.filter(ImageFilter.GaussianBlur(blur_radius))
            img2_blurred = img2.filter(ImageFilter.GaussianBlur(blur_radius))
            
            diff = ImageChops.difference(img1_blurred, img2_blurred)
            stat = ImageStat.Stat(diff)
            
            total_diff = sum(stat.sum)
            max_diff = img1.size[0] * img1.size[1] * 255 * 3
            
            difference_percentage = (total_diff / max_diff) * 100.0
            regression_score = max(0.0, 100.0 - (difference_percentage * 5))
            
            changes = []
            if difference_percentage > 0.5:
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
                "summary": f"Pillow Scalar Diff: {difference_percentage:.2f}% difference"
            }

        except Exception as e:
            logger.error(f"VisionAgent: Regression diff failed for {url}: {e}")
            return {"changes": [], "regression_score": None, "summary": f"Error: {e}"}

    def check_bounding_box_overlaps(self, elements: list[dict]) -> list[dict]:
        """Checks for overlapping bounding boxes. Uses SIMD matrix broadcast when available."""
        # --- SIMD path: vectorized matrix broadcast ---
        if HAS_SIMD:
            try:
                return detect_simd_collisions(elements)
            except Exception as e:
                logger.warning(f"VisionAgent: SIMD collision failed, falling back to scalar: {e}")

        # --- Scalar fallback ---
        defects = []
        seen_messages = set()
        n = len(elements)
        for i in range(n):
            for j in range(i + 1, n):
                e1 = elements[i]
                e2 = elements[j]
                
                # Skip decorative/non-interactive intentional overlays (pointer-events: none or aria-hidden="true")
                if e1.get('pointerEvents') == 'none' or e2.get('pointerEvents') == 'none':
                    continue
                if e1.get('ariaHidden') or e2.get('ariaHidden'):
                    continue

                # ponytail: Skip intentional CSS stacking layers (different z-index with absolute/fixed positioning)
                p1 = e1.get('position', 'static')
                p2 = e2.get('position', 'static')
                z1 = e1.get('zIndex', 0)
                z2 = e2.get('zIndex', 0)
                if (p1 in ['absolute', 'fixed', 'sticky'] or p2 in ['absolute', 'fixed', 'sticky']) and z1 != z2:
                    continue

                # Check intersection (if they DO NOT intersect, the condition is true, so we invert)
                if not (e1['x2'] <= e2['x1'] or e1['x1'] >= e2['x2'] or e1['y2'] <= e2['y1'] or e1['y1'] >= e2['y2']):
                    
                    # If they are essentially the same element (parent/child sometimes have exact same box), skip
                    if abs(e1['x1'] - e2['x1']) < 5 and abs(e1['y1'] - e2['y1']) < 5 and abs(e1['x2'] - e2['x2']) < 5 and abs(e1['y2'] - e2['y2']) < 5:
                        continue
                        
                    # If one completely contains the other, usually it's a parent/child wrapper, skip
                    if e1['x1'] <= e2['x1'] and e1['y1'] <= e2['y1'] and e1['x2'] >= e2['x2'] and e1['y2'] >= e2['y2']:
                        continue
                    if e2['x1'] <= e1['x1'] and e2['y1'] <= e1['y1'] and e2['x2'] >= e1['x2'] and e2['y2'] >= e1['y2']:
                        continue
                        
                    t1 = e1.get('text', '').strip()[:30]
                    t2 = e2.get('text', '').strip()[:30]

                    # ponytail: Skip if both elements have no readable text (empty layout containers)
                    if not t1 and not t2:
                        continue
                    # Skip if one is an anchor/button wrapping a span child with identical text prefix
                    if (e1['tag'] in ['a', 'button'] and e2['tag'] == 'span') or (e2['tag'] in ['a', 'button'] and e1['tag'] == 'span'):
                        if t1 in t2 or t2 in t1:
                            continue

                    msg_key = f"{e1['tag']}:{t1}|{e2['tag']}:{t2}"
                    if msg_key in seen_messages:
                        continue
                    seen_messages.add(msg_key)

                    # If they intersect but don't contain each other, it's a layout collision!
                    defects.append({
                        "type": "Visual",
                        "severity": "major",
                        "message": f"Overlapping elements detected: <{e1['tag']}> ({t1 or 'element'}) overlaps with <{e2['tag']}> ({t2 or 'element'})",
                        "location": f"Coordinates: ({int(e1['x1'])},{int(e1['y1'])})",
                        "fix": "Adjust CSS margins, padding, or flex/grid layout to prevent collision. Ensure proper z-index if intentional.",
                        "source": "algorithmic_vision",
                        "confidence": 0.8,
                        "_el1": e1,  # kept for VLM crop-verify in orchestrator
                        "_el2": e2,
                    })
                    
                    # Limit to 5 defects to avoid spam
                    if len(defects) >= 5:
                        return defects
                        
        return defects

    async def verify_overlap_with_vlm(self, screenshot_bytes: bytes, e1: dict, e2: dict) -> bool:
        """Crops the collision zone and asks the HF VLM if it looks like a real bug.

        Returns True if the VLM confirms it is an actual bug, False to suppress it.
        Falls back to True (keep the defect) if VLM is offline or JSON parse fails.
        ponytail: crop-only call keeps token cost ~10x lower than full screenshot.
        """
        if not HAS_PIL or not hf_vlm_client.is_configured():
            return True  # VLM not available — keep defect

        try:
            img = Image.open(io.BytesIO(screenshot_bytes)).convert("RGB")
            pad = 20
            x1 = max(0, min(e1['x1'], e2['x1']) - pad)
            y1 = max(0, min(e1['y1'], e2['y1']) - pad)
            x2 = min(img.width,  max(e1['x2'], e2['x2']) + pad)
            y2 = min(img.height, max(e1['y2'], e2['y2']) + pad)
            cropped = img.crop((x1, y1, x2, y2))

            buf = io.BytesIO()
            cropped.save(buf, format="PNG")
            crop_bytes = buf.getvalue()

            t1 = e1.get('text', '').strip()[:40] or e1['tag']
            t2 = e2.get('text', '').strip()[:40] or e2['tag']
            prompt = (
                f"A bounding box scanner detected an overlap between:\n"
                f"  Element A: <{e1['tag']}> \"{t1}\"\n"
                f"  Element B: <{e2['tag']}> \"{t2}\"\n\n"
                "Look at this cropped UI image carefully.\n"
                "Is this a real visual bug (text on top of text, buttons blocking each other, "
                "content unreadable), or intentional design (timeline marker, decorative overlay, "
                "background icon, progress indicator)?\n\n"
                "Respond ONLY in this exact JSON: "
                "{\"is_actual_bug\": true/false, \"confidence_score\": 0.0-1.0, \"reasoning\": \"one sentence\"}"
            )

            response = await hf_vlm_client.query_vlm(crop_bytes, prompt)
            if not response:
                return True  # VLM offline — keep defect

            # Extract JSON from response (VLM may wrap it in prose)
            import re, json
            match = re.search(r'\{[^{}]+\}', response, re.DOTALL)
            if match:
                verdict = json.loads(match.group())
                is_bug = verdict.get("is_actual_bug", True)
                reasoning = verdict.get("reasoning", "")
                logger.info(f"[VisionAgent] [VLM-VERIFY] is_bug={is_bug} | {reasoning}")
                print(f"[VisionAgent] [VLM-VERIFY] is_bug={is_bug} | {reasoning}", flush=True)
                return bool(is_bug)

        except Exception as e:
            logger.debug(f"[VisionAgent] VLM overlap verify failed: {e}")

        return True  # Default: keep defect if anything fails
