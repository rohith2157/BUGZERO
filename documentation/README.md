# 📚 AutonomousQA (BUGZERO) Documentation Portal

Welcome to the central technical documentation hub for **AutonomousQA (BUGZERO)**. This repository houses comprehensive engineering blueprints, mathematical proofs, empirical benchmarks, and academic research papers governing our autonomous software quality engineering platform.

---

## 🧭 Navigation Matrix

```
documentation/
├── 01_PIPELINE_AND_JOURNEY_ENGINE.md         # 🧭 4-Stage Pipeline, JourneyAgent, Cart Math
├── 02_REAL_WORLD_BENCHMARKS_AND_AUDIT.md    # 🧪 5-Site Live Audit Dataset (Swiggy, HN, GitHub)
├── 03_TITAN_LIGHTHOUSE_BENCHMARK_MASTER.md  # 🏛️ 70k-Line Master TITAN Compendium & Lighthouse Deep-Dive
├── 100percent_algo.md                       # 🧮 Levenshtein & Pythagorean Self-Healing Fallback Math
├── BROWSERS_AND_CRAWL_DEPTHS.md             # 🌐 Chromium, Firefox, WebKit & BFS Crawl Depths
├── CRAWL_STRATEGIES.md                      # 🕸️ BFS vs DFS vs Concurrent Crawling Analysis
├── SIMD_ACCELERATION_SPEC.md                # ⚡ 256-Bit AVX2 SIMD Math, SSIM & AABB Collisions
├── SYSTEM_WORKFLOW.md                       # 🔄 End-to-End System, Data Flow & Telemetry Spec
└── github_engine_design.md                  # 🛡️ GitHub OAuth, Ephemeral Repo Clone & PR Bot Spec
```

---

## 📑 Document Catalog

### 1. 🏗️ Architecture & Core Engines

- **[01_PIPELINE_AND_JOURNEY_ENGINE.md](01_PIPELINE_AND_JOURNEY_ENGINE.md)**  
  *The Core Orchestration Specification.* Explains the single-navigation multi-audit lifecycle, `JourneyAgent` stateful workflows, e-commerce subtotal arithmetic verification ($\text{Total} = \sum P_i Q_i - D + T$), and runtime JS crash interceptors.

- **[SIMD_ACCELERATION_SPEC.md](SIMD_ACCELERATION_SPEC.md)**  
  *Hardware-Accelerated Vector Computing.* Details native x86-64 AVX2/FMA3 256-bit SIMD registers, vectorized NumPy/OpenBLAS image difference calculations, structural similarity (SSIM), and $O(N^2)$ Axis-Aligned Bounding Box (AABB) pairwise DOM collision geometry.

- **[github_engine_design.md](github_engine_design.md)**  
  *Repository-Mode Testing & PR Automation.* Architectural blueprint covering GitHub OAuth token exchange, shallow cloning, dynamic port allocation, dev server autodetection, and PR commit status reporting.

- **[100percent_algo.md](100percent_algo.md)**  
  *Deterministic Engineering Manifesto.* Technical rationale for eliminating hallucination-prone, high-latency LLMs in favor of 100% deterministic mathematical algorithms (Levenshtein distance, spatial Pythagorean decay, and Gaussian blurred image difference subtraction).

- **[SYSTEM_WORKFLOW.md](SYSTEM_WORKFLOW.md)**  
  *Complete System Operations Manual.* 1,000+ line guide breaking down every configuration setting, WebSocket event lifecycle, database schema relationship, and troubleshooting checklist.

---

### 2. 🌐 Crawling & Browser Automation

- **[BROWSERS_AND_CRAWL_DEPTHS.md](BROWSERS_AND_CRAWL_DEPTHS.md)**  
  *Browser Engine & Traversal Guide.* Visual guide comparing Chromium, Firefox, and WebKit rendering engines, alongside Shallow (Level 1), Standard (Level 2), and Deep (Level 3+) crawl depth thresholds.

- **[CRAWL_STRATEGIES.md](CRAWL_STRATEGIES.md)**  
  *Algorithm Comparison.* Rigorous comparison of Breadth-First Search (BFS), Depth-First Search (DFS), Priority Queues, and Concurrent Spiders, demonstrating why FIFO BFS maximizes defect discovery on modern web applications.

---

### 3. 🧪 Empirical Benchmarks & Audits

- **[02_REAL_WORLD_BENCHMARKS_AND_AUDIT.md](02_REAL_WORLD_BENCHMARKS_AND_AUDIT.md)**  
  *5-Site Live Audit Dataset.* Results of live in-process audits across BFL AI (97.0), GitHub (84.3), Phycraft Tech (64.3), Swiggy Instamart (42.0), and Hacker News (41.0), proving zero duplicate false positives and 100% site-specific findings.

- **[03_TITAN_LIGHTHOUSE_BENCHMARK_MASTER.md](03_TITAN_LIGHTHOUSE_BENCHMARK_MASTER.md)**  
  *AutonomousQA vs. Google Lighthouse.* Transparent, line-by-line breakdown of the 70,000-line TITAN telemetry commit, proving why static single-snapshot scanners miss dynamic state regressions and business logic bugs.

---

### 4. 🔬 Next-Gen Research & Academic Grounding

For research papers and next-generation autonomous testing engines, see the dedicated research directory:

- **[Next-Gen Research Implementation Compendium](../benchmarks/research/NEXT_GEN_RESEARCH_IMPLEMENTATION.md)**:
  - **USEagent (ICSE 2026)**: Automated Playwright `.spec.ts` test script synthesizer.
  - **RepoGraph (ICLR 2025)**: AST code graph fault localization mapping defects to `file:line`.
  - **KISS Sorcar (UC Berkeley 2026)**: Ephemeral Git worktree isolation with dynamic port allocation.
  - **RESTler (Microsoft Research / IEEE S&P)**: Autonomous API schema inference & mutation fuzzing.
  - **UI-TARS (ByteDance 2025) / WebGUM (Google Research)**: Goal-driven semantic UI exploration.
- **Academic Paper PDFs** in `benchmarks/research/`:
  - `ICSE26-USEagent.pdf`
  - `2604.23822v2.pdf`
