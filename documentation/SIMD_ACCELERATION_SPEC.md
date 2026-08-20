# ⚡ SIMD Hardware-Accelerated Math & Visual Regression Spec
**System Architecture Specification: Ultra-Low Latency Vector Computing for BugZero Autonomous QA**

---

## Executive Summary & Mission

In an enterprise-grade autonomous QA platform, analyzing dozens of viewports, computing structural image similarity (SSIM) across high-resolution screenshots, and detecting 2D DOM bounding box collisions ($O(N^2)$ checks) can consume **80%+ of CPU cycle time**.

By introducing **SIMD (Single Instruction, Multiple Data)** hardware acceleration across the visual regression and geometric collision pipelines, BugZero eliminates sequential scalar loops, processing **8 to 32 data points simultaneously per CPU cycle** using native x86-64 AVX2/FMA3 vector registers and vectorized NumPy SIMD backends.

---

## 1. The "WHY": Performance Bottlenecks & Hardware Rationale

### 1.1 The Scalability Problem in Scalar Image & DOM Math

1. **Gaussian Blurred SSIM Pixel Diffing:**
   * A 1920x1080 viewport contains **2,073,600 pixels**, with 3 or 4 color channels (RGBA = **8,294,400 bytes**).
   * Traditional Pillow / pure Python loops calculate luminance $\mu_x, \mu_y$, variance $\sigma_x^2, \sigma_y^2$, and covariance $\sigma_{xy}$ pixel-by-pixel sequentially.
   * **Scalar Latency:** ~250ms - 600ms per viewport comparison.
   * **Impact on 10-page test suite:** 5-12 seconds wasted on pure CPU pixel loops.

2. **2D Axis-Aligned Bounding Box (AABB) Collision Detection:**
   * Modern web applications render between 300 to 1,200 interactive DOM elements.
   * Testing all pairwise element overlaps without vectorization requires:
     $$\text{Comparisons} = \frac{N(N-1)}{2} = \frac{800 \times 799}{2} = 319,600 \text{ pairwise checks}$$
   * In standard Python interpreted bytecode, evaluating 320k rectangle intersection conditions takes **120ms - 350ms per page**.

3. **DOM Selector Feature Similarity (Self-Healing Embeddings):**
   * Comparing broken element tags, class names, and attributes against candidate DOM trees using scalar Levenshtein loops introduces latency spikes during live self-healing test runs.

---

### 1.2 Technical Validation of the 4 SIMD Use Cases

#### Use Case 1: Visual Regression & SSIM (10x-50x Impact) -- HIGHLY VALID
Image diffing is fundamentally an array of memory blocks. Standard sequential loops stall the CPU waiting for memory. SIMD handles R, G, B, A arrays natively in blocks of 16 or 32 bytes, allowing structural similarity math (averages, variances, covariances) to execute directly in CPU caches.

#### Use Case 2: Layout Overlap Geometry ($O(N^2)$ checks) -- HIGHLY VALID
Packing four float variables (x, y, w, h) into a single 128-bit vector register, or eight into a 256-bit AVX2 register, turns boundary intersection logic (min/max comparisons) into single-cycle hardware operations. This eliminates the standard performance penalty of checking heavy layout trees.

#### Use Case 3: Self-Healing Selector Similarity -- VALID (Data-Dependent)
For Cosine or Euclidean distance vectors, SIMD speeds up the dot-product calculations immensely. However, the bottleneck here is **memory alignment**. If candidate DOM nodes are scattered across a complex JavaScript object graph, time is lost gathering data. Feature embeddings must be packed flat in contiguous memory blocks (Float32Array / numpy.float32 arrays).

#### Use Case 4: Wasm-SIMD for Frontend Blueprinting -- HIGHLY VALID
WebAssembly SIMD (wasm128) allows 128-bit vector operations directly inside Chrome/Firefox. Offloading blueprint edge detection or pixel-filtering logic from the main JavaScript thread to a background Wasm worker prevents the browser UI from stuttering during reporting. All major browsers (Chrome 91+, Firefox 89+, Safari 16.4+) now support Wasm-SIMD by default.

---

### 1.3 The SIMD Solution & Expected Speedups

| Pipeline Stage | Scalar CPU Baseline | SIMD Hardware-Accelerated | Hardware Speedup |
| :--- | :--- | :--- | :--- |
| **Pixel Diffing & MSE Variance** | 180ms - 400ms | **4ms - 12ms** | **~25x - 40x Faster** |
| **Gaussian SSIM Calculation** | 350ms - 750ms | **15ms - 30ms** | **~20x Faster** |
| **AABB Collision Geometry Matrix** | 150ms - 350ms | **0.8ms - 2.5ms** | **~100x Faster** |
| **DOM Cosine Vector Distance** | 45ms - 90ms | **1.2ms - 3.0ms** | **~30x Faster** |

---

## 2. The 3 Golden Rules for BugZero + SIMD Integration

To ensure SIMD actually delivers the promised 10x-50x performance gains without crashing production, these three architectural guidelines are mandatory:

### Rule 1: Zero-Copy Memory Layout
Never pass structured Python dicts or JavaScript objects (like `[{x: 10, y: 20}]`) to the SIMD layer. Use standard typed arrays:
- **Python:** `numpy.float32` contiguous C-order arrays
- **Node.js:** `Float32Array` or `Int32Array`
- **Wasm:** Linear memory segments

These arrays store data flat in memory, letting SIMD engine read them instantly without parsing or serialization overhead. If you copy or convert data inefficiently, the translation cost eats up all SIMD performance gains.

### Rule 2: Batching via Workers
- **Python (ai-core):** Use `asyncio` coroutines or `concurrent.futures.ProcessPoolExecutor` to offload heavy SIMD math from the main orchestrator event loop.
- **Node.js (gateway):** Move SIMD pixel diffing and layout geometry calculations into separate Worker Threads.
- **Frontend (React):** Use Web Workers to prevent the reporting UI from freezing during massive test runs.

### Rule 3: Feature Detection Fallbacks
Not every server or browser supports advanced SIMD instructions. Always implement a runtime check:
- If AVX2 or Wasm-SIMD is missing, gracefully route to a standard fallback loop.
- The application must never crash due to missing SIMD support.

---

## 3. The "WHAT": Mathematical Primitives & Vector Architecture

### 3.1 Vectorized SSIM (Structural Similarity Index)

For baseline image window $x$ and current image window $y$:

$$\text{SSIM}(x,y) = \frac{(2\mu_x\mu_y + C_1)(2\sigma_{xy} + C_2)}{(\mu_x^2 + \mu_y^2 + C_1)(\sigma_x^2 + \sigma_y^2 + C_2)}$$

Where:
* $C_1 = (K_1 L)^2, C_2 = (K_2 L)^2$ (stability constants for dynamic range $L = 255$)
* Vectorized mean ($\mu$), variance ($\sigma^2$), and covariance ($\sigma_{xy}$) are evaluated via SIMD 2D convolutions using vectorized kernel broadcasts across 8-wide float32 AVX2 registers.

### 3.2 SIMD Broadcast Matrix AABB Collision Geometry

Given $N$ element bounding boxes formatted as coordinate vectors:

$$\mathbf{B} = \begin{bmatrix} x_{\min} & y_{\min} & x_{\max} & y_{\max} \end{bmatrix}_{N \times 4}$$

**Flat Memory Array Design (De-interleaved Layout):**

Instead of storing elements as separate objects, pack their coordinates into flat float32 arrays split by property. This lets the CPU load entire lines of data directly into vector registers:

```
X1_coords: [ x_A, x_B, x_C, x_D, ... ] <-- Loaded as 1 Vector (128/256-bit)
Y1_coords: [ y_A, y_B, y_C, y_D, ... ]
X2_coords: [ maxA, maxB, maxC, maxD, ... ]
Y2_coords: [ maxA, maxB, maxC, maxD, ... ]
```

Using NumPy SIMD vector broadcasting:

1. **$X$-Axis Overlap Condition:**
   $$\mathbf{O}_x = (\mathbf{X}_{\max}[:, \text{None}] > \mathbf{X}_{\min}[\text{None}, :]) \land (\mathbf{X}_{\min}[:, \text{None}] < \mathbf{X}_{\max}[\text{None}, :])$$

2. **$Y$-Axis Overlap Condition:**
   $$\mathbf{O}_y = (\mathbf{Y}_{\max}[:, \text{None}] > \mathbf{Y}_{\min}[\text{None}, :]) \land (\mathbf{Y}_{\min}[:, \text{None}] < \mathbf{Y}_{\max}[\text{None}, :])$$

3. **Collision Tensor:**
   $$\mathbf{C} = \mathbf{O}_x \land \mathbf{O}_y \land \neg \mathbf{M}_{\text{containment}} \land \neg \mathbf{M}_{\text{identity}}$$

All $N^2$ boolean tests execute simultaneously using 256-bit vector operations.

---

### 3.3 Wasm-SIMD Layout Intersection (Rust/C intrinsics)

If compiling the layout collision engine into WebAssembly for Report.jsx or a Node.js native addon, here is how parallel overlap math works using 128-bit SIMD intrinsics. This processes **4 bounding boxes at the exact same time in a single clock cycle**:

```rust
use std::arch::wasm32::*;

// Checks if a Target Box intersects with 4 Candidate Boxes simultaneously
// Box format: x1, y1 (top-left) and x2, y2 (bottom-right)
#[inline(always)]
pub unsafe fn check_4_overlaps_simd(
    target_x1: v128, target_y1: v128, target_x2: v128, target_y2: v128,
    cand_x1: v128, cand_y1: v128, cand_x2: v128, cand_y2: v128,
) -> v128 {
    // Condition for NO OVERLAP:
    // (target_x1 > cand_x2) OR (target_x2 < cand_x1) OR
    // (target_y1 > cand_y2) OR (target_y2 < cand_y1)
    let cond1 = f32x4_gt(target_x1, cand_x2);
    let cond2 = f32x4_lt(target_x2, cand_x1);
    let cond3 = f32x4_gt(target_y1, cand_y2);
    let cond4 = f32x4_lt(target_y2, cand_y1);

    // Combine conditions with bitwise OR to find where there is NO collision
    let no_overlap = v128_or(v128_or(cond1, cond2), v128_or(cond3, cond4));

    // Invert the result to get actual overlaps (Bitwise NOT)
    v128_not(no_overlap)
    // Returns 128-bit vector: four 32-bit masks (0xFFFFFFFF = Collision, 0 = Safe)
}
```

---

## 4. The "WHERE": Exact Engine Layer Placement in BugZero

### 4.1 BugZero Architecture with SIMD Engine Layer

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                    BugZero Full System Architecture                      │
 └──────────────────────────────────────────────────────────────────────────┘

                ┌──────────────────────────────────────────┐
                │         Frontend (React / Vite)          │
                │      autonomousqa-frontend/src/          │
                │                                          │
                │  Report.jsx  ──►  [Wasm-SIMD Worker]     │
                │  (Blueprint X-Ray,    (128-bit wasm128   │
                │   Canvas Filters)      vectors for        │
                │                        edge detection)    │
                │                                          │
                │  Fallback: CSS filter() + JS canvas      │
                └──────────────────┬───────────────────────┘
                                   │ HTTP / WebSocket
                                   ▼
                ┌──────────────────────────────────────────┐
                │          Gateway (Node.js)                │
                │              gateway/src/                 │
                │                                          │
                │  routes/tests.js ──► Screenshot Storage   │
                │  routes/baselines.js ──► Baseline Mgmt    │
                │                                          │
                │  [Optional: sharp/libvips for             │
                │   image preprocessing with AVX2/AVX-512]  │
                │                                          │
                │  Fallback: Standard Buffer operations     │
                └──────────────────┬───────────────────────┘
                                   │ HTTP Orchestration
                                   ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                    AI-Core (Python 3.13)                                │
 │                         ai-core/                                        │
 │                                                                         │
 │  ┌───────────────────────────────────────────────────────────────────┐  │
 │  │             *** SIMD ENGINE LAYER (NEW) ***                      │  │
 │  │                   ai-core/utils/                                  │  │
 │  │                                                                   │  │
 │  │  ┌─────────────────────┐  ┌──────────────────────┐               │  │
 │  │  │ simd_vision_engine  │  │ simd_collision_engine │               │  │
 │  │  │        .py          │  │         .py           │               │  │
 │  │  │                     │  │                       │               │  │
 │  │  │ • compute_simd_diff │  │ • detect_simd_        │               │  │
 │  │  │ • compute_simd_ssim │  │   collisions          │               │  │
 │  │  │ • batch_pixel_mse   │  │ • vectorized_aabb     │               │  │
 │  │  │                     │  │   _matrix              │               │  │
 │  │  │ Uses: NumPy 2.4.6   │  │ Uses: NumPy 2.4.6     │               │  │
 │  │  │ SIMD: X86_V3 / AVX2 │  │ SIMD: X86_V3 / AVX2   │               │  │
 │  │  │ BLAS: OpenBLAS 0.3   │  │ Broadcasting Matrix    │               │  │
 │  │  └──────────┬──────────┘  └───────────┬──────────┘               │  │
 │  │             │                         │                           │  │
 │  │  ┌──────────▼─────────────────────────▼──────────┐               │  │
 │  │  │        simd_feature_engine.py                  │               │  │
 │  │  │ • batch_cosine_similarity (vectorized dot)     │               │  │
 │  │  │ • Uses: NumPy contiguous float32 arrays        │               │  │
 │  │  └───────────────────────────────────────────────┘               │  │
 │  └───────────────────────────────────┬───────────────────────────────┘  │
 │                                      │                                  │
 │  ┌───────────────────────────────────▼───────────────────────────────┐  │
 │  │                    Agent Layer (Consumers)                        │  │
 │  │                                                                   │  │
 │  │  ┌──────────────────┐  ┌────────────────┐  ┌──────────────────┐  │  │
 │  │  │  vision_agent.py │  │ self_healing_  │  │ assertion_       │  │  │
 │  │  │                  │  │ agent.py       │  │ engine.py        │  │  │
 │  │  │ compare_         │  │                │  │                  │  │  │
 │  │  │ screenshots()    │  │ find_best_     │  │ validate_        │  │  │
 │  │  │ ──► calls        │  │ match()        │  │ visual()         │  │  │
 │  │  │ simd_vision_     │  │ ──► calls      │  │ ──► calls        │  │  │
 │  │  │ engine           │  │ simd_feature_  │  │ simd_vision_     │  │  │
 │  │  │                  │  │ engine         │  │ engine           │  │  │
 │  │  │ check_bounding_  │  │                │  │                  │  │  │
 │  │  │ box_overlaps()   │  │ Fallback:      │  │ Fallback:        │  │  │
 │  │  │ ──► calls        │  │ Levenshtein    │  │ Pillow ImageStat │  │  │
 │  │  │ simd_collision_  │  │ scalar loops   │  │                  │  │  │
 │  │  │ engine           │  │                │  │                  │  │  │
 │  │  └──────────────────┘  └────────────────┘  └──────────────────┘  │  │
 │  └───────────────────────────────────────────────────────────────────┘  │
 │                                                                         │
 │  ┌───────────────────────────────────────────────────────────────────┐  │
 │  │                    Orchestrator (orchestrator.py)                 │  │
 │  │    Coordinates pipeline: Crawl → Screenshot → SIMD Vision →      │  │
 │  │    SIMD Collision → Self-Heal → Report                           │  │
 │  └───────────────────────────────────────────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────────────────┘

 Tier 1: AVX2 / X86_V3 (NumPy/OpenBLAS native SIMD)     ──► 25x-100x
 Tier 2: Vectorized NumPy (standard C-level array ops)   ──► 10x-25x
 Tier 3: Pillow / Scalar Python fallback                 ──► 1x baseline
```

### 4.2 Answer: Where Does the SIMD Engine Layer Live?

The SIMD engine layer is a **new utility module layer** sitting inside `ai-core/utils/`, directly between the raw data sources (Playwright screenshots, DOM coordinate arrays) and the agent consumers (vision_agent, self_healing_agent, assertion_engine).

| Layer | Location | SIMD Mechanism | What It Accelerates |
| :--- | :--- | :--- | :--- |
| **Primary Engine** | `ai-core/utils/simd_vision_engine.py` | NumPy AVX2 via OpenBLAS | Pixel diff, SSIM, MSE variance |
| **Primary Engine** | `ai-core/utils/simd_collision_engine.py` | NumPy broadcast matrix ops | AABB layout collision geometry |
| **Primary Engine** | `ai-core/utils/simd_feature_engine.py` | NumPy vectorized dot products | DOM selector cosine similarity |
| **Consumer** | `ai-core/agents/vision_agent.py` | Calls SIMD engines | Visual regression + collision detection |
| **Consumer** | `ai-core/agents/self_healing_agent.py` | Calls feature engine | Selector similarity matching |
| **Optional Frontend** | `autonomousqa-frontend/` (future) | Wasm-SIMD 128-bit | Blueprint X-Ray canvas filtering |
| **Optional Gateway** | `gateway/` (future) | sharp/libvips AVX2 | Image preprocessing |

**The primary SIMD engine runs in Python (ai-core)** because that is where BugZero's test execution engine lives. The orchestrator (`orchestrator.py`) coordinates the pipeline: Crawl -> Screenshot -> **SIMD Vision Engine** -> **SIMD Collision Engine** -> Self-Heal -> Report.

---

## 5. BugZero Performance Stack

```
┌──────────────────────────────────────────────────────────┐
│                 BugZero Performance Stack                  │
└────────────────────────────┬─────────────────────────────┘
                             │
    ┌────────────────────────┴────────────────────────┐
    ▼                                                 ▼
[ AI-Core Backend (Python 3.13) ]        [ Frontend (React/Vite) ]
┌────────────────────────────────┐  ┌─────────────────────────────────┐
│ • NumPy 2.4.6 (AVX2 / X86_V3) │  │ • Wasm-SIMD (128-bit vectors)   │
│ • OpenBLAS 0.3.31 (Haswell)    │  │ • Offload to Web Workers        │
│ • Contiguous float32 arrays    │  │ • SIMD-compiled Rust/C++        │
│ • Pillow for image I/O         │  │ • Fallback: CSS filter()        │
└────────────────────────────────┘  └─────────────────────────────────┘

[ Gateway (Node.js) - Optional ]
┌────────────────────────────────┐
│ • sharp / libvips (AVX2/512)   │
│ • Native Addons (Node-API)     │
│ • Contiguous Float32Arrays     │
│ • simsimd for vector distance  │
└────────────────────────────────┘
```

---

## 6. High-Yield Tools to Integrate into BugZero

These libraries are battle-tested and directly address the 4 performance bottlenecks:

### 6.1 For Visual Regression (Pixel Diffing)

| Tool | Layer | SIMD Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **NumPy 2.4.6** | ai-core (Python) | Native AVX2 via OpenBLAS | **Already installed** |
| **Pillow** | ai-core (Python) | Image I/O + scalar fallback | **Already installed** |
| **sharp** | gateway (Node.js) | Native C++ libvips (AVX2/512) | Optional future |

**NumPy** is the primary SIMD engine for BugZero's Python backend. It provides:
- Vectorized array operations that map directly to AVX2 hardware instructions
- OpenBLAS backend with `DYNAMIC_ARCH` (auto-detects Haswell AVX2 at runtime)
- Contiguous memory layout for zero-copy SIMD register loading

**sharp** (Node.js) is 40x-50x faster than pure JavaScript libraries like jimp or pixelmatch. It wraps libvips, a C++ library that automatically detects the CPU's SIMD support at runtime:
```javascript
import sharp from 'sharp';
// 10x faster: Get raw pixel data (SIMD-ready buffer)
const { data, info } = await sharp('screenshot.png')
  .raw()
  .toBuffer({ resolveWithObject: true });
// 'data' is a standard Buffer (Uint8Array) ready for SIMD math
```

### 6.2 For Self-Healing Selectors (Vector Similarity)

| Tool | Layer | SIMD Mechanism |
| :--- | :--- | :--- |
| **NumPy dot/cosine** | ai-core (Python) | Vectorized BLAS dot products |
| **simsimd** | gateway (Node.js) | Explicit AVX2/NEON assembly kernels |

**simsimd** provides explicitly optimized SIMD kernels for dot products and cosine similarity in JavaScript/Node.js:
```bash
npm install simsimd
```
```javascript
import { sqeuclidean, cosine } from 'simsimd';
// Calculates distance between two Float32Arrays using AVX2/NEON
const dist = cosine(vectorA, vectorB);
```

### 6.3 For Layout Collision (2D Geometry)

| Tool | Layer | SIMD Mechanism |
| :--- | :--- | :--- |
| **NumPy broadcast matrix** | ai-core (Python) | AVX2 vectorized boolean matrix |
| **rapier** (@dimforge/rapier2d-compat) | Frontend (Wasm) | Rust SIMD broad-phase |

**rapier** is a 2D physics engine written in Rust, compiled to WebAssembly, heavily optimized with SIMD for broad-phase collision detection. Useful if moving collision to frontend.

### 6.4 For Frontend Blueprint Rendering (Future)

| Tool | Purpose |
| :--- | :--- |
| **wasm-pack** | Compile Rust to Wasm with SIMD |
| **wasm-bindgen** | Bridge Rust Wasm to JavaScript |

Compilation with SIMD enabled:
```bash
RUSTFLAGS="-C target-feature=+simd128" wasm-pack build --target web
```

Or in `Cargo.toml`:
```toml
[package.metadata.wasm-pack.profile.release]
wasm-opt = ["-O4", "--enable-simd"]
```

---

## 7. Flat Memory Layout: How Data Flows Into SIMD Registers

### 7.1 Python (ai-core) -- Primary SIMD Path

The vision_agent currently passes Python dicts and Pillow Image objects. The SIMD engine converts these to contiguous NumPy arrays:

```python
import numpy as np
from PIL import Image
import io

def screenshot_to_simd_array(screenshot_bytes: bytes) -> np.ndarray:
    """Convert screenshot bytes to SIMD-ready contiguous float32 array."""
    img = Image.open(io.BytesIO(screenshot_bytes)).convert('RGB')
    # np.asarray creates a contiguous C-order array in memory
    # NumPy's internal loops use AVX2 SIMD on this layout automatically
    return np.asarray(img, dtype=np.float32)

def elements_to_simd_coords(elements: list[dict]) -> tuple:
    """Pack DOM element coordinates into flat SIMD-ready arrays."""
    n = len(elements)
    # De-interleaved layout: one array per coordinate dimension
    x1 = np.array([e['x1'] for e in elements], dtype=np.float32)
    y1 = np.array([e['y1'] for e in elements], dtype=np.float32)
    x2 = np.array([e['x2'] for e in elements], dtype=np.float32)
    y2 = np.array([e['y2'] for e in elements], dtype=np.float32)
    return x1, y1, x2, y2
```

### 7.2 Node.js (Gateway) -- Optional Path

If SIMD math ever moves to the gateway layer:

```javascript
// Pack DOM elements into flat Float32Arrays for SIMD consumption
function elementsToSIMDBuffers(elements) {
  const n = elements.length;
  const x1 = new Float32Array(n);
  const y1 = new Float32Array(n);
  const x2 = new Float32Array(n);
  const y2 = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    x1[i] = elements[i].x1;
    y1[i] = elements[i].y1;
    x2[i] = elements[i].x2;
    y2[i] = elements[i].y2;
  }
  return { x1, y1, x2, y2 };
  // These Float32Arrays can be passed directly to C++/Wasm SIMD
}
```

---

## 8. Hardware Fallback Hierarchy

### 8.1 Three-Tier Graceful Degradation

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: AVX2 / X86_V3 (NumPy + OpenBLAS native SIMD)  │
│  ► 256-bit vector registers with FMA3                    │
│  ► 25x - 100x speedup                                   │
│  ► Auto-detected at NumPy import time                    │
├─────────────────────────────────────────────────────────┤
│  Tier 2: Vectorized NumPy (standard C-level strided)     │
│  ► Vectorized but not SIMD-explicit                      │
│  ► 10x - 25x speedup vs pure Python                     │
│  ► Works on any CPU with NumPy installed                  │
├─────────────────────────────────────────────────────────┤
│  Tier 3: Pillow / Scalar Python fallback                 │
│  ► Guaranteed execution everywhere                       │
│  ► 1x baseline (current behavior)                        │
│  ► Used in restricted containers with no NumPy            │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Runtime Detection Code

```python
import numpy as np

def get_simd_tier() -> str:
    """Detect available SIMD hardware tier at runtime."""
    try:
        config = np.show_config(mode='dicts')
        simd_ext = config.get('SIMD Extensions', {})
        found = simd_ext.get('found', [])
        if 'X86_V3' in found or 'AVX2' in str(found):
            return 'tier1_avx2'
        return 'tier2_vectorized'
    except Exception:
        return 'tier2_vectorized'

# ponytail: simple tier check, upgrade path: add ARM NEON detection
SIMD_TIER = get_simd_tier()
```

### 8.3 Error Handling & Invariants

* Zero precision drift: SIMD calculations must match scalar mathematical definitions within $\epsilon < 10^{-5}$.
* Zero new dependencies: Only uses packages already in `requirements.txt` (`numpy`, `Pillow`).
* Zero crashes: If SIMD instructions are unavailable, falls back to Tier 2/3 silently.

---

## 9. BugZero's Runtime Environment (Confirmed)

| Component | Runtime | Language | SIMD Path |
| :--- | :--- | :--- | :--- |
| **Test Execution Engine** | Python 3.13 | Python | NumPy AVX2 (primary) |
| **Orchestrator** | Python 3.13 | Python | Coordinates SIMD agents |
| **Vision Agent** | Python 3.13 | Python | Calls SIMD engine layer |
| **Self-Healing Agent** | Python 3.13 | Python | Calls feature engine |
| **Gateway API** | Node.js | JavaScript | Optional sharp/simsimd |
| **Frontend Report** | Vite / React | JavaScript | Optional Wasm-SIMD |

**Confirmed SIMD Hardware Support (from NumPy diagnostic):**
- **CPU Architecture:** x86_64 (Windows)
- **NumPy Version:** 2.4.6
- **SIMD Baseline:** X86_V2
- **SIMD Found:** X86_V3 (AVX2 / FMA3)
- **BLAS Backend:** OpenBLAS 0.3.31 with `DYNAMIC_ARCH` (Haswell)
- **Max Threads:** 24

---

## 10. New Core Modules (File Map)

### 10.1 New Files to Create

| File | Purpose |
| :--- | :--- |
| `ai-core/utils/simd_vision_engine.py` | Vectorized pixel diff, MSE, SSIM |
| `ai-core/utils/simd_collision_engine.py` | Vectorized matrix AABB collision |
| `ai-core/utils/simd_feature_engine.py` | Vectorized cosine similarity for self-healing |
| `ai-core/tests/test_simd_engines.py` | Unit tests for numerical accuracy |
| `benchmarks/benchmark_simd_speed.py` | Performance benchmark: Scalar vs SIMD |

### 10.2 Files to Modify

| File | Change |
| :--- | :--- |
| `ai-core/agents/vision_agent.py` | Wire `compare_screenshots()` to SIMD vision engine; wire `check_bounding_box_overlaps()` to SIMD collision engine |
| `ai-core/agents/self_healing_agent.py` | Wire selector similarity to SIMD feature engine |

---

## 11. Verification & Benchmark Plan

### 11.1 Unit Test Suite (`ai-core/tests/test_simd_engines.py`)
* Validate numerical correctness against known visual baselines:
  - Identical image = 100.0% SSIM
  - Inverted image = 0.0% SSIM
  - Known diff = expected percentage within $\epsilon$
* Validate AABB collision matrix on controlled overlapping and non-overlapping box coordinate sets.
* Validate cosine similarity on known orthogonal and parallel vectors.

### 11.2 Performance Benchmark Script (`benchmarks/benchmark_simd_speed.py`)
* Measure execution latency (100 iterations): Scalar vs. SIMD.
* Targets:
  - Visual comparison: $\ge 15\times$ speedup
  - 500-element collision matrix: $\ge 50\times$ speedup
  - Cosine similarity batch: $\ge 20\times$ speedup
* Print hardware tier and NumPy SIMD configuration.

---

## References

* [Mitchell Hashimoto - Everyone Should Know SIMD (2026)](https://mitchellh.com/writing/everyone-should-know-simd)
* [ITU Online - What Is Single Instruction, Multiple Data (SIMD)?](https://www.ituonline.com/tech-definitions/what-is-single-instruction-multiple-data-simd/)
* [DEV Community - Using SIMD in WebAssembly](https://dev.to/yangholmes/using-simd-in-webassembly-part-1-52ec)
* [PkgPulse - Best JavaScript Image Processing Libraries 2026](https://www.pkgpulse.com/guides/best-javascript-image-processing-2026)
* [NumPy SIMD Documentation](https://numpy.org/doc/stable/reference/simd/index.html)
