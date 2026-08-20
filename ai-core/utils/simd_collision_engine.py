"""SIMD Collision Engine — Vectorized Matrix AABB Overlap Detection.

Replaces the O(N^2) nested Python loop in vision_agent.check_bounding_box_overlaps()
with NumPy broadcast matrix operations for the overlap check, then filters
only the collision pairs (avoiding full NxN matrices for containment/identity masks).

ponytail: the matrix approach wins when N is large AND the scalar loop can't
short-circuit early. For small N (<100), the overhead of array packing can dominate.
The engine auto-selects scalar for tiny inputs.
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)

# ponytail: benchmark shows scalar early-exit beats NxN matrix for N<5000 when max_defects=5,
# because the scalar loop short-circuits after ~20 comparisons while matrix builds full NxN.
# Upgrade path: if max_defects is ever raised significantly, lower this threshold.
_SIMD_THRESHOLD = 5000


def detect_simd_collisions(elements: list[dict], max_defects: int = 5) -> list[dict]:
    """Vectorized AABB collision detection.

    Strategy: Build NxN boolean overlap matrix (cheap — just 4 broadcasts on bool),
    then extract pairs and filter containment/identity per-pair (not per-matrix).
    """
    if len(elements) < 2:
        return []

    n = len(elements)

    # For tiny inputs, scalar is faster than array allocation overhead
    if n < _SIMD_THRESHOLD:
        return _scalar_collisions(elements, max_defects)

    # --- Step 1: Pack coordinates into flat contiguous arrays ---
    x1 = np.array([e['x1'] for e in elements], dtype=np.float32)
    y1 = np.array([e['y1'] for e in elements], dtype=np.float32)
    x2 = np.array([e['x2'] for e in elements], dtype=np.float32)
    y2 = np.array([e['y2'] for e in elements], dtype=np.float32)

    # --- Step 2: Vectorized NxN boolean overlap (4 broadcasts on bool8) ---
    # ponytail: bool matrix = N*N bytes, not N*N*4 bytes (float32)
    overlap_x = (x2[:, None] > x1[None, :]) & (x1[:, None] < x2[None, :])
    overlap_y = (y2[:, None] > y1[None, :]) & (y1[:, None] < y2[None, :])
    collision_matrix = overlap_x & overlap_y
    del overlap_x, overlap_y  # free immediately

    # Upper triangle only
    collision_matrix = np.triu(collision_matrix, k=1)

    # --- Step 3: Extract pairs and filter per-pair (cheap for few collisions) ---
    pairs = np.argwhere(collision_matrix)
    del collision_matrix

    defects = []
    seen_messages = set()

    for idx in range(len(pairs)):
        i, j = int(pairs[idx, 0]), int(pairs[idx, 1])
        e1, e2 = elements[i], elements[j]

        # Per-pair identity check (< 5px diff on all coords)
        if (abs(e1['x1'] - e2['x1']) < 5 and abs(e1['y1'] - e2['y1']) < 5 and
            abs(e1['x2'] - e2['x2']) < 5 and abs(e1['y2'] - e2['y2']) < 5):
            continue

        # Per-pair containment check
        if (e1['x1'] <= e2['x1'] and e1['y1'] <= e2['y1'] and
            e1['x2'] >= e2['x2'] and e1['y2'] >= e2['y2']):
            continue
        if (e2['x1'] <= e1['x1'] and e2['y1'] <= e1['y1'] and
            e2['x2'] >= e1['x2'] and e2['y2'] >= e1['y2']):
            continue

        # Skip decorative/non-interactive
        if e1.get('pointerEvents') == 'none' or e2.get('pointerEvents') == 'none':
            continue
        if e1.get('ariaHidden') or e2.get('ariaHidden'):
            continue

        # Skip intentional CSS stacking
        p1 = e1.get('position', 'static')
        p2 = e2.get('position', 'static')
        z1 = e1.get('zIndex', 0)
        z2 = e2.get('zIndex', 0)
        if (p1 in ['absolute', 'fixed', 'sticky'] or p2 in ['absolute', 'fixed', 'sticky']) and z1 != z2:
            continue

        t1 = e1.get('text', '').strip()[:30]
        t2 = e2.get('text', '').strip()[:30]

        if not t1 and not t2:
            continue
        if (e1['tag'] in ['a', 'button'] and e2['tag'] == 'span') or \
           (e2['tag'] in ['a', 'button'] and e1['tag'] == 'span'):
            if t1 in t2 or t2 in t1:
                continue

        msg_key = f"{e1['tag']}:{t1}|{e2['tag']}:{t2}"
        if msg_key in seen_messages:
            continue
        seen_messages.add(msg_key)

        defects.append({
            "type": "Visual",
            "severity": "major",
            "message": f"Overlapping elements detected: <{e1['tag']}> ({t1 or 'element'}) overlaps with <{e2['tag']}> ({t2 or 'element'})",
            "location": f"Coordinates: ({int(e1['x1'])},{int(e1['y1'])})",
            "fix": "Adjust CSS margins, padding, or flex/grid layout to prevent collision. Ensure proper z-index if intentional.",
            "source": "algorithmic_vision",
            "confidence": 0.8,
            "_el1": e1,
            "_el2": e2,
        })

        if len(defects) >= max_defects:
            break

    return defects


def _scalar_collisions(elements: list[dict], max_defects: int = 5) -> list[dict]:
    """Scalar fallback for small N where array allocation overhead dominates."""
    defects = []
    seen_messages = set()
    n = len(elements)

    for i in range(n):
        for j in range(i + 1, n):
            e1, e2 = elements[i], elements[j]

            # AABB intersection test
            if (e1['x2'] <= e2['x1'] or e1['x1'] >= e2['x2'] or
                e1['y2'] <= e2['y1'] or e1['y1'] >= e2['y2']):
                continue

            # Identity
            if (abs(e1['x1'] - e2['x1']) < 5 and abs(e1['y1'] - e2['y1']) < 5 and
                abs(e1['x2'] - e2['x2']) < 5 and abs(e1['y2'] - e2['y2']) < 5):
                continue

            # Containment
            if (e1['x1'] <= e2['x1'] and e1['y1'] <= e2['y1'] and
                e1['x2'] >= e2['x2'] and e1['y2'] >= e2['y2']):
                continue
            if (e2['x1'] <= e1['x1'] and e2['y1'] <= e1['y1'] and
                e2['x2'] >= e1['x2'] and e2['y2'] >= e1['y2']):
                continue

            if e1.get('pointerEvents') == 'none' or e2.get('pointerEvents') == 'none':
                continue
            if e1.get('ariaHidden') or e2.get('ariaHidden'):
                continue

            p1 = e1.get('position', 'static')
            p2 = e2.get('position', 'static')
            z1 = e1.get('zIndex', 0)
            z2 = e2.get('zIndex', 0)
            if (p1 in ['absolute', 'fixed', 'sticky'] or p2 in ['absolute', 'fixed', 'sticky']) and z1 != z2:
                continue

            t1 = e1.get('text', '').strip()[:30]
            t2 = e2.get('text', '').strip()[:30]

            if not t1 and not t2:
                continue
            if (e1['tag'] in ['a', 'button'] and e2['tag'] == 'span') or \
               (e2['tag'] in ['a', 'button'] and e1['tag'] == 'span'):
                if t1 in t2 or t2 in t1:
                    continue

            msg_key = f"{e1['tag']}:{t1}|{e2['tag']}:{t2}"
            if msg_key in seen_messages:
                continue
            seen_messages.add(msg_key)

            defects.append({
                "type": "Visual",
                "severity": "major",
                "message": f"Overlapping elements detected: <{e1['tag']}> ({t1 or 'element'}) overlaps with <{e2['tag']}> ({t2 or 'element'})",
                "location": f"Coordinates: ({int(e1['x1'])},{int(e1['y1'])})",
                "fix": "Adjust CSS margins, padding, or flex/grid layout to prevent collision. Ensure proper z-index if intentional.",
                "source": "algorithmic_vision",
                "confidence": 0.8,
                "_el1": e1,
                "_el2": e2,
            })

            if len(defects) >= max_defects:
                return defects

    return defects
