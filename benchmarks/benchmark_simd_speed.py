"""Benchmark: Scalar vs SIMD performance for BugZero visual regression and collision detection.

Measures execution latency (100 iterations) and prints speedup factors.
"""

import sys
import os
import time
import io
import numpy as np
from PIL import Image, ImageChops, ImageStat, ImageFilter

# Add ai-core to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai-core'))

from utils.simd_vision_engine import compute_simd_diff, compute_simd_ssim, compute_simd_full, SIMD_TIER
from utils.simd_collision_engine import detect_simd_collisions


def make_test_image(w=1920, h=1080, seed=42):
    """Generate a random 1080p test image."""
    rng = np.random.RandomState(seed)
    arr = rng.randint(0, 256, (h, w, 3), dtype=np.uint8)
    img = Image.fromarray(arr, 'RGB')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


def make_test_elements(n=500, seed=42):
    """Generate N random DOM bounding boxes for collision testing."""
    rng = np.random.RandomState(seed)
    elements = []
    for i in range(n):
        x1 = rng.randint(0, 1800)
        y1 = rng.randint(0, 1000)
        w = rng.randint(20, 200)
        h = rng.randint(10, 80)
        elements.append({
            'x1': x1, 'y1': y1, 'x2': x1 + w, 'y2': y1 + h,
            'tag': rng.choice(['span', 'div', 'button', 'a']),
            'text': f'Element_{i}',
            'position': 'static', 'zIndex': 0,
        })
    return elements


# ── Scalar baselines ──

def scalar_pixel_diff(img1_bytes, img2_bytes):
    img1 = Image.open(io.BytesIO(img1_bytes)).convert('RGB')
    img2 = Image.open(io.BytesIO(img2_bytes)).convert('RGB')
    if img1.size != img2.size:
        img2 = img2.resize(img1.size)
    img1_b = img1.filter(ImageFilter.GaussianBlur(1))
    img2_b = img2.filter(ImageFilter.GaussianBlur(1))
    diff = ImageChops.difference(img1_b, img2_b)
    stat = ImageStat.Stat(diff)
    total_diff = sum(stat.sum)
    max_diff = img1.size[0] * img1.size[1] * 255 * 3
    return (total_diff / max_diff) * 100.0


def scalar_collision_check(elements):
    defects = []
    n = len(elements)
    for i in range(n):
        for j in range(i + 1, n):
            e1, e2 = elements[i], elements[j]
            if not (e1['x2'] <= e2['x1'] or e1['x1'] >= e2['x2'] or
                    e1['y2'] <= e2['y1'] or e1['y1'] >= e2['y2']):
                if abs(e1['x1']-e2['x1']) < 5 and abs(e1['y1']-e2['y1']) < 5:
                    continue
                if e1['x1'] <= e2['x1'] and e1['y1'] <= e2['y1'] and \
                   e1['x2'] >= e2['x2'] and e1['y2'] >= e2['y2']:
                    continue
                if e2['x1'] <= e1['x1'] and e2['y1'] <= e1['y1'] and \
                   e2['x2'] >= e1['x2'] and e2['y2'] >= e1['y2']:
                    continue
                t1 = e1.get('text', '')[:30]
                t2 = e2.get('text', '')[:30]
                if not t1 and not t2:
                    continue
                defects.append({'i': i, 'j': j})
                if len(defects) >= 5:
                    return defects
    return defects


def bench(fn, *args, iterations=100, label=""):
    """Run fn N times and return average ms."""
    # Warmup
    fn(*args)
    start = time.perf_counter()
    for _ in range(iterations):
        fn(*args)
    elapsed = (time.perf_counter() - start) / iterations * 1000
    return elapsed


def main():
    print("=" * 70)
    print("  BugZero SIMD Benchmark: Scalar vs Vectorized Performance")
    print("=" * 70)
    print(f"  SIMD Tier: {SIMD_TIER}")
    print(f"  NumPy: {np.__version__}")
    print(f"  Platform: {sys.platform}")
    print()

    ITERS = 50  # iterations per benchmark

    # ── 1. Pixel Diffing ──
    print("  Generating 1080p test images...")
    img1 = make_test_image(1920, 1080, seed=1)
    img2 = make_test_image(1920, 1080, seed=2)
    print(f"  Image size: {len(img1):,} bytes (~{len(img1)/1024:.0f} KB)")
    print()

    print(f"  Pixel Diff Benchmark ({ITERS} iterations):")
    scalar_ms = bench(scalar_pixel_diff, img1, img2, iterations=ITERS)
    simd_ms = bench(compute_simd_diff, img1, img2, iterations=ITERS)
    speedup = scalar_ms / simd_ms if simd_ms > 0 else float('inf')
    print(f"  Scalar (Pillow):  {scalar_ms:8.2f} ms/iter")
    print(f"  SIMD (NumPy):     {simd_ms:8.2f} ms/iter")
    print(f"  Speedup:          {speedup:8.1f}x")
    print()

    # -- 2. Combined Diff+SSIM (single decode) --
    print(f"  Combined Diff+SSIM Benchmark ({ITERS} iterations):")
    full_ms = bench(compute_simd_full, img1, img2, iterations=ITERS)
    combined_speedup = (scalar_ms + scalar_ms) / full_ms if full_ms > 0 else float('inf')  # vs 2 separate scalar calls
    print(f"  SIMD Full:        {full_ms:8.2f} ms/iter  (diff + ssim in 1 call)")
    print(f"  vs 2x Scalar:     {combined_speedup:8.1f}x")
    result = compute_simd_full(img1, img2)
    print(f"  SSIM Value:       {result['ssim']}")
    print()

    # ── 3. Collision Detection ──
    N_ELEMENTS = 1000
    print(f"  Generating {N_ELEMENTS} DOM bounding boxes...")
    elements = make_test_elements(N_ELEMENTS)
    print()

    print(f"  AABB Collision Benchmark ({ITERS} iterations, N={N_ELEMENTS}):")
    scalar_col_ms = bench(scalar_collision_check, elements, iterations=ITERS)
    simd_col_ms = bench(detect_simd_collisions, elements, iterations=ITERS)
    col_speedup = scalar_col_ms / simd_col_ms if simd_col_ms > 0 else float('inf')
    print(f"  Scalar (loop):    {scalar_col_ms:8.2f} ms/iter")
    print(f"  SIMD (matrix):    {simd_col_ms:8.2f} ms/iter")
    print(f"  Speedup:          {col_speedup:8.1f}x")
    print()

    # -- Summary --
    print("=" * 70)
    print("  RESULTS SUMMARY")
    print("=" * 70)
    print(f"  Pixel Diff:       {speedup:.1f}x faster")
    print(f"  Combined D+S:     {combined_speedup:.1f}x faster (vs 2 scalar calls)")
    print(f"  Collision N=1k:   {col_speedup:.1f}x faster")
    print(f"  SIMD Tier:        {SIMD_TIER}")
    print("=" * 70)


if __name__ == '__main__':
    main()
