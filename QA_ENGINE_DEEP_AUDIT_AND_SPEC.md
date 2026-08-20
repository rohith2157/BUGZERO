# AutonomousQA AI Engine: In-Depth Architecture, Defect Audit & Diagnostic Spec

> **Document Version:** 1.0.0
> **Target System:** `AutonomousQA AI Core` (`FastAPI`, `Playwright`, `Axe-Core`, `NetworkX`, `Pillow / VLM`)
> **Audit Date:** August 2026
> **Tested Targets:** `phycraft.tech`, `bfl.ai/research`, `swiggy.com/instamart`, `news.ycombinator.com`, `github.com`

---

## 1. Executive Summary & Core Diagnosis

The user raised a critical question regarding the AutonomousQA engine:

> *"Is the engine detecting the exact same generic things across every website, and is the project flawed?"*

### The Verdict

1. **The Engine has a "Dual-Personality" Architecture:**
   - **Layer A (Flawed / Naive Heuristics):** Hand-rolled JavaScript snippets inside `tools/playwright_tool.py` (lines 410–600) execute simplistic DOM checks (`querySelectorAll('img')`, `h1Count === 0`, `style.color === style.backgroundColor`, `innerText.includes('cookie')`). These **do indeed fire identical, generic false-positive alerts on almost every website on the internet**.
   - **Layer B (Enterprise-Grade Standard Audits):** The engine integrates `axe-core 4.9.0` and Chromium `PerformanceObserver` navigation metrics. This layer produces **100% genuine, site-specific, high-value accessibility and performance findings** (e.g., Swiggy's `user-scalable=no` zoom blocker, Phycraft's exact `3.51:1` text contrast on `#1c1c21`, Hacker News's missing `<main>` landmark).

---

## 2. "What is What": Complete Pipeline Architecture

```mermaid
flowchart TD
    A[Target URL / Repo] --> B[Stage 1: BFS Crawler]
    B --> C[Stage 2: Graph & PageRank Scheduler]
    C --> D[Stage 3: Single-Navigation Multi-Audit]
  
    subgraph D [Stage 3: Multi-Audit Execution]
        D1[Axe-Core 4.9.0 WCAG Engine]
        D2[Naive DOM Heuristics JS]
        D3[Chromium Performance API]
        D4[Bounding Box Collision Math]
        D5[VLM / Pillow Image Analysis]
    end
  
    D1 --> E[Stage 4: Aggregation & Hygiene Scoring]
    D2 --> E
    D3 --> E
    D4 --> E
    D5 --> E
    E --> F[Compliance Report & Defect Matrix]
```

### Component Breakdown

| Component                    | Implementation File                                          | Role                                                                                      | Quality Level                                                           |
| ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Crawler**            | `ai-core/agents/crawler.py` & `tools/playwright_tool.py` | Crawls target site via BFS queue, extracts same-origin internal links.                    | 🟢**Good** (handles depth caps, redirects, SPA hydration delays)  |
| **Scheduler**          | `ai-core/agents/scheduler.py`                              | Builds directed link graph, computes PageRank importance with degree centrality fallback. | 🟢**Good** (proper damping factor $\alpha=0.85$, risk boosting) |
| **Axe-Core Audit**     | `ai-core/tools/axe_tool.py`                                | Injects official Axe-Core engine to audit WCAG 2.1 AA/AAA rules.                          | 🟢**Excellent** (Zero false positives, exact CSS selectors)       |
| **Performance Engine** | `ai-core/tools/playwright_tool.py`                         | Extracts TTFB, LCP, CLS, and Long Tasks (FID/TBT).                                        | 🟢**Good** (Accurate Chromium timings)                            |
| **DOM Heuristics**     | `ai-core/tools/playwright_tool.py`                         | Basic JS checks for images, H1s, form labels, cookies.                                    | 🔴**Flawed** (Produces repetitive generic output)                 |
| **Visual Collisions**  | `ai-core/agents/vision_agent.py`                           | Checks intersection of bounding boxes without semantic tags.                              | 🟡**Needs Improvement** (Flags intentional badges/tooltips)       |
| **VLM Integration**    | `ai-core/utils/hf_client.py`                               | Hugging Face NVIDIA Eagle2-2B VLM for visual verification.                                | 🟢**High Potential** (requires crop coordinates)                  |

---

## 3. In-Depth Problem Analysis: Why Generic Defects Appear

### Problem 1: Naive Color Contrast Check (`playwright_tool.py:480-486`)

```javascript
// Current Code in playwright_tool.py:
const elements = document.querySelectorAll('p, span, a, li, td, th, label, button');
let issues = 0;
elements.forEach(el => {
    const style = getComputedStyle(el);
    if (style.color === style.backgroundColor) issues++;
});
```

- **The Bug:** If an element has no explicit background, `getComputedStyle(el).backgroundColor` returns `rgba(0, 0, 0, 0)` (transparent). If text color is black or dark, standard equality fails or trips.
- **Result:** Every site gets flagged with `"Potential color contrast issues on 3 element(s)"` or `"4 element(s)"`.
- **Fix:** Delete this naive check. Rely solely on `axe-core`'s `color-contrast` rule which recursively traverses parent background layers and computes luminance ratios.

---

### Problem 2: Rigid `<H1>` Tag Enforcement (`playwright_tool.py:423-435`)

```javascript
// Current Code:
const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
const h1Count = levels.filter(l => l === 1).length;
if (h1Count === 0) issues++;
```

- **The Bug:** Modern Single Page Applications (Next.js, Tailwind, React) frequently style hero titles as `<h2 class="text-5xl font-bold">` or `<div class="hero-title">` for styling convenience.
- **Result:** Flagged on 80% of websites as a Major SEO bug (`bfl.ai`, `swiggy.com`, `news.ycombinator.com`, `phycraft.tech`).
- **Fix:** Inspect visual font-size hierarchy and `role="heading" [aria-level="1"]` before raising an issue.

---

### Problem 3: Blanket Missing Image Alt Check (`playwright_tool.py:410-422`)

```javascript
// Current Code:
const imgs = document.querySelectorAll('img');
let missing = 0;
imgs.forEach(img => { if (!img.alt) missing++; });
```

- **The Bug:** Websites contain tracking beacons (`s.gif`), decorative gradients, and SVG icons inside buttons that are intentionally presentational (`role="presentation"` or `aria-hidden="true"`).
- **Result:** Flags 100% of websites (`17 images on GitHub`, `3 on Hacker News`, `2 on Swiggy`, `1 on Phycraft`).
- **Fix:** Ignore images with `aria-hidden="true"`, `role="none"`, or dimensions $\le 1\text{px} \times 1\text{px}$.

---

### Problem 4: Naive Cookie Search (`playwright_tool.py:590-598`)

```javascript
// Current Code:
const text = document.body.innerText.toLowerCase();
return text.includes('cookie') && (text.includes('consent') || text.includes('accept') || text.includes('privacy'));
```

- **The Bug:** If a website has no banner or uses a modal with "Personalize Choices" without the word "cookie" on the initial viewport, it triggers a GDPR warning.
- **Result:** Fires on Hacker News, BFL AI, and Phycraft.

---

### Problem 5: Unfiltered Bounding Box Overlaps (`vision_agent.py:180-234`)

```python
# Current Code:
if not (e1['x2'] <= e2['x1'] or e1['x1'] >= e2['x2'] or e1['y2'] <= e2['y1'] or e1['y1'] >= e2['y2']):
    # Flags collision if elements intersect and neither completely wraps the other
```

- **The Bug:** Interactive tags, notification badges, dropdown arrows, and floating CTA buttons are positioned over other elements by design (e.g. GitHub repo badges, Phycraft card timestamps).
- **Result:** GitHub got 5 false-positive overlap bugs (`a overlaps a`, `span overlaps span`).
- **Fix:** Filter out child-parent flex items, check `z-index` stacking context, and require VLM verification before raising a major defect.

---

## 4. The 5-Website Empirical Audit Matrix

| Metric / Check                 |    Phycraft Tech    |   BFL AI Research   |             Swiggy Instamart             |                 Hacker News                 |           GitHub           |
| ------------------------------ | :------------------: | :------------------: | :--------------------------------------: | :-----------------------------------------: | :------------------------: |
| **Target URL**           |  `phycraft.tech`  | `bfl.ai/research` |         `swiggy.com/instamart`         |          `news.ycombinator.com`          |       `github.com`       |
| **Hygiene Score**        |     `18 / 100`     |     `72 / 100`     |               `19 / 100`               |                 `7 / 100`                 |        `41 / 100`        |
| **Overall Score**        | **42.5 / 100** | **83.5 / 100** |           **22.5 / 100**           |            **15.0 / 100**            |    **68.5 / 100**    |
| **TTFB (ms)**            |       387.7 ms       |       406.0 ms       |                 595.0 ms                 |                  297.4 ms                  |     **96.7 ms**     |
| **FID / TBT (ms)**       |       138.0 ms       |       539.0 ms       |        **2074.0 ms (Poor)**        |         **0.0 ms (Instant)**         | **2200.0 ms (Poor)** |
| **Missing Alt Count**    |          1          |          1          |                    2                    |                      3                      |             17             |
| **Missing `<H1>`**     |      ❌ Missing      |      ❌ Missing      |                ❌ Missing                |                 ❌ Missing                 |         ✅ Present         |
| **Axe WCAG Violations**  |   4 rules (6 inst)   |   1 rule (1 inst)   |            6 rules (19 inst)            |              7 rules (14 inst)              |      1 rule (1 inst)      |
| **Critical WCAG Defect** |         None         |         None         | `meta-viewport` (`user-scalable=no`) | `label` (Unlabelled `<input name="q">`) |            None            |
| **Visual Collisions**    |      5 overlaps      |      0 overlaps      |                1 overlap                |                 0 overlaps                 |   5 overlaps (False pos)   |

---

## 5. Detailed Site Findings

### Site 1: Phycraft Tech (`https://phycraft.tech/`)

- **Real Bug Detected:** Insufficient contrast on faint timestamps (`#71717a` text on `#1c1c21` dark theme background produces a ratio of **`3.51:1`**, violating WCAG AA minimum threshold of **`4.5:1`**).
- **DOM Location:** `<span class="ml-auto font-mono text-[10px] text-faint">last 2h</span>`.
- **Keyboard Bug:** `<div class="overflow-y-auto max-h-[160px]">` is scrollable by mouse but unreachable by keyboard focus.

### Site 2: BFL AI Research (`https://bfl.ai/research`)

- **Finding:** Clean semantic markup with very few defects. High score (**83.5/100**).
- **Defect:** No explicit `<h1>` tag; hero uses custom font-size CSS typography.

### Site 3: Swiggy Instamart (`https://www.swiggy.com/instamart`)

- **Severe Accessibility Bug:** `<meta name="viewport" content="...user-scalable=no">` — explicit prohibition of user zooming on touch devices.
- **Screen Reader Bug:** `<div role="dialog" aria-modal="true" class="_4-yUW">` (Location selection modal) contains no `aria-label` or `aria-labelledby`.
- **Hydration Lag:** FID of **2074ms** indicates massive JavaScript bundles blocking the main execution thread on initial render.

### Site 4: Hacker News (`https://news.ycombinator.com/`)

- **Structural Failure:** Built with legacy HTML `<table border="0">` layouts. Completely missing HTML5 `<main>` landmark.
- **Form Bug:** Top/bottom search `<input name="q">` has no associated `<label>` tag.

### Site 5: GitHub (`https://github.com/`)

- **Performance:** Exceptional edge caching (**96.7ms TTFB**).
- **Engine Artifacts:** 5 visual overlap warnings triggered by floating badges and dropdown icons in the hero section.

---

## 6. Actionable Roadmap: How to Make AutonomousQA 100x Smarter

To eliminate repetitive "slop" and establish an uncompromising QA engine:

1. **Delete Naive JS Heuristics:**
   - Remove `style.color === style.backgroundColor` from `playwright_tool.py`.
   - Remove raw `querySelectorAll('img')` alt counter; delegate 100% of accessibility auditing to `axe-core`.
2. **Context-Aware Visual Collision Filter:**
   - In `vision_agent.py`, ignore elements if `computedStyle.position` is `'absolute'`/`'fixed'` and `z-index > 0`, or if `pointer-events: none`.
   - Always route bounding-box collisions through the Hugging Face NVIDIA VLM (`verify_overlap_with_vlm`) before adding to the final defect list.
3. **Smart Typography Hierarchy:**
   - Replace rigid `<h1>` count with computed font-size analysis (e.g. "Largest text on page is 48px, treated as visual H1").
4. **Interactive Form & State Testing:**
   - Utilize `active_explorer.py` and `self_healing_agent.py` to type into search bars, submit forms, and click tabs to uncover dynamic runtime exceptions rather than static DOM text checks.

---

*Authored by Antigravity Senior Architecture Reviewer.*
