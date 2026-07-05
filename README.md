<div align="center">

<img src="https://img.shields.io/badge/AutonomousQA-BUGZERO-blueviolet?style=for-the-badge&logo=target&logoColor=white" alt="AutonomousQA" />

<h1>🚀 AutonomousQA</h1>

<p>
    <strong>Zero-Touch • Zero-Script • Zero-Compromise</strong>
  </p>

<p>
    <em>AI-powered, fully autonomous Quality Assurance engine that tests any web application — without a single line of test script.</em>
  </p>

<p>
    <a href="https://github.com/rohith2157/BUGZERO/stargazers"><img src="https://img.shields.io/github/stars/rohith2157/BUGZERO?style=flat-square&color=FFD700&logo=github" alt="Stars" /></a>
    <a href="https://github.com/rohith2157/BUGZERO/network/members"><img src="https://img.shields.io/github/forks/rohith2157/BUGZERO?style=flat-square&logo=github" alt="Forks" /></a>
    <a href="https://github.com/rohith2157/BUGZERO/issues"><img src="https://img.shields.io/github/issues/rohith2157/BUGZERO?style=flat-square&color=FF4C4C&logo=github" alt="Issues" /></a>
    <a href="https://github.com/rohith2157/BUGZERO/blob/main/LICENSE"><img src="https://img.shields.io/github/license/rohith2157/BUGZERO?style=flat-square&color=007AFF" alt="License" /></a>
    <a href="https://github.com/rohith2157/BUGZERO/pulls"><img src="https://img.shields.io/badge/PRs-welcome-34C759?style=flat-square&logo=git" alt="PRs Welcome" /></a>
  </p>

<h4>
    <a href="#-what-is-autonomousqa">About</a> •
    <a href="#-the-6-ai-agents">Features</a> •
    <a href="#%EF%B8%8F-architecture">Architecture</a> •
    <a href="#%E2%9A%99%EF%B8%8F-system-workflow">Workflow</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-contributing">Contributing</a>
  </h4>

</div>

---

## 🧠 What is AutonomousQA?

![The Zero-Touch Promise](assets/illustrations/01-zero-touch.png)

**AutonomousQA** is an AI-driven testing platform that autonomously crawls, analyzes, and tests any web application. Point it at a URL — it discovers every page, runs accessibility audits, performance checks, visual regression analysis, and functional tests — then reports defects with full evidence. **No scripts. No config. No babysitting.**

> 💡 **The Problem:** Writing and maintaining test scripts is slow, expensive, and fragile. Traditional QA can't keep pace with rapid development cycles, and critical bugs slip through because manual testing doesn't scale.

> ✨ **The Solution:** AutonomousQA deploys 6 specialized AI agents that behave like expert QA engineers — they explore your app intelligently, heal their own broken selectors, find issues humans miss, and deliver actionable reports in real time.

---

## 🤖 The 6 AI Agents

<div align="center">

|  #  | Agent                          | What It Does                                              | How It Works                                                                                                                                    |
| :--: | :----------------------------- | :-------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
|  ⚡  | **Self-Healing Tests**   | Tests that auto-repair when UI changes. Zero maintenance. | Semantic fingerprinting of DOM elements → LLM-powered selector healing with confidence scoring → Full healing audit trail                     |
| 🛡️ | **Auth Navigator**       | Logs into SSO, OAuth, MFA — automatically.               | Computer vision + DOM analysis + Gemini reasoning to navigate any login flow → Stores strategies as reusable playbooks                         |
| 👁️ | **Visual Regression AI** | Semantic visual diff, not pixel noise.                    | Captures screenshots per page → Stores baselines → Gemini Vision compares current vs baseline → Classifies changes as cosmetic vs functional |
|  📊  | **Risk Prioritization**  | AI decides what to test first based on risk.              | PageRank graph analysis + page type boosting + defect history recidivism scoring + change detection → 4-factor risk model                      |
|  ⚡  | **Performance Chaos**    | Core Web Vitals on every page, every run.                 | Measures LCP, CLS, FID, TTFB via Playwright → Network throttling & CPU throttling (chaos mode) → Performance budget enforcement               |
| ⚖️ | **Compliance Engine**    | WCAG + GDPR audit on every test run.                      | axe-core WCAG 2.1 AA full scan → GDPR risk detection → Audit-ready compliance reports with remediation guidance                               |

</div>

### Self-Healing Tests — How It Works

```
Page Load → fingerprint_page() saves all interactive elements (buttons, links, inputs, forms)
  ↓
Next Run → detect_and_heal() compares current DOM vs saved fingerprints
  ↓
Broken selector found → Gemini LLM analyzes DOM + fingerprint → proposes new selector
  ↓
Validates selector exists → Records HealingEvent in DB with confidence score
  ↓
WebSocket → LiveTest shows "✅ Healed button_3: #old-btn → .new-btn (95%)"
```

### Visual Regression AI — How It Works

```
Run 1: Screenshot → Gemini analyzes for visual bugs → Save as baseline in DB
  ↓
Run 2: Screenshot → Fetch baseline → Gemini compares BOTH images side-by-side
  ↓
Changes classified: "Cosmetic: font-size changed" vs "Functional: button missing"
  ↓
Report page shows Visual Regression section with severity + confidence per change
```

### Risk Prioritization — 4-Factor Model

```
Stage 2: Fetch defect history from last 10 completed runs
  ↓
Risk Score = PageRank (link graph) + Type Boost (auth=+0.15, form=+0.12)
           + Defect History (up to +0.20 for recidivist pages)
           + Change Detection (up to +0.15 for score regressions)
  ↓
Pages sorted by combined risk → highest-risk tested first
```

---

## 🏗️ Architecture

```mermaid
graph TD;
    Frontend["🖥️ Frontend\n(React + Vite)\nPort 5173"] --> API["⚙️ API Gateway\n(Express.js)\nPort 3000"];
    API --> AI["🤖 AI Core\n(Python FastAPI)\nPort 8000"];
  
    API --> DB[("🐘 PostgreSQL\n(Data Storage)")]
    API --> Redis[("🔴 Redis\n(Cache/Queues)")]
    API --> Neo[("🕸️ Neo4j\n(Graph Mappings)")]
  
    AI --> PW["🌐 Playwright\n(Browser Engine)"]
    AI --> Axe["♿ axe-core\n(A11y Tests)"]
    AI --> Gemini["🔮 Gemini Vision\n(Visual AI)"]

    style Frontend fill:#1E293B,stroke:#3B82F6,stroke-width:2px,color:#fff
    style API fill:#1E293B,stroke:#10B981,stroke-width:2px,color:#fff
    style AI fill:#1E293B,stroke:#8B5CF6,stroke-width:2px,color:#fff
    style DB fill:#0F172A,stroke:#64748B,color:#fff
    style Redis fill:#0F172A,stroke:#64748B,color:#fff
    style Neo fill:#0F172A,stroke:#64748B,color:#fff
    style PW fill:#0F172A,stroke:#64748B,color:#fff
    style Axe fill:#0F172A,stroke:#64748B,color:#fff
    style Gemini fill:#0F172A,stroke:#F59E0B,color:#fff
```

| Service               | Technology                                   | Purpose                                                               |
| :-------------------- | :------------------------------------------- | :-------------------------------------------------------------------- |
| **Frontend**    | React 19, Vite 7, Framer Motion, Recharts    | Interactive dashboard & real-time monitoring                          |
| **API Gateway** | Express.js, Prisma ORM, Socket.io, JWT       | REST API, authentication, WebSocket relay                             |
| **AI Core**     | Python FastAPI, Playwright, axe-core, Gemini | Autonomous crawling, testing, healing, and visual regression          |
| **PostgreSQL**  | v16                                          | Persistent storage (users, tests, defects, healing events, baselines) |
| **Redis**       | v7                                           | Caching, session management, job queues                               |
| **Neo4j**       | v5                                           | Graph-based page relationship mapping                                 |

---

## ⚙️ System Workflow

Here's exactly what happens under the hood when you click **"Launch Test"**.

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🖥️ Frontend (React)
    participant G as ⚙️ Gateway (Node.js)
    participant DB as 🐘 Database (Postgres)
    participant W as ⚡ WebSocket Server
    participant A as 🤖 AI Core (Python)
    participant Gem as 🔮 Gemini Vision

    U->>F: Clicks "Launch Test" (URL, Config)
    F->>G: POST /api/tests { url, config }
    G->>DB: Create test_run status="queued"
    G-->>F: Return UUID
    F->>W: Join room {testRun.id} (Live UI)
    G->>A: Trigger pipeline (POST /api/test/run) via proxy
  
    note over A: STAGE 0: AUTH & CHAOS (Optional)
    opt Auth enabled
        A->>A: AuthAgent navigates SSO/OAuth/MFA flow
    end
    opt Chaos mode
        A->>A: ChaosAgent injects Slow 3G + CPU throttling
    end
  
    note over A: STAGE 1: BFS CRAWL 🕷️
    A->>A: Playwright BFS — discover all pages + links
    A->>G: POST /api/tests/progress (crawl_complete)
    G->>W: emit 'crawl:complete' (Updates UI Pages Total)
  
    note over A: STAGE 2: RISK SCORING 📊
    A->>G: GET /api/tests/history/lookup (defect history)
    G-->>A: Return defect counts + previous scores
    A->>A: PageRank + type boost + defect history + change detection
    A->>A: Greedy sort — most critical pages first
    A->>G: POST /api/tests/progress (pagerank_complete)
    G->>W: emit 'pagerank:complete' (Shows priority order)
  
    note over A: STAGE 3: TEST LOOP 🔬
    loop For each page (risk priority order)
        A->>A: 3a: Self-Healing — detect broken selectors, heal via LLM
        A->>A: 3b: Basic tests (SEO, forms, perf, links)
        A->>A: 3c: Inject axe-core → full WCAG 2.1 audit
        A->>G: GET /api/baselines (fetch baseline screenshot)
        A->>Gem: Send current + baseline screenshot for regression diff
        Gem-->>A: Return visual bugs + regression changes
        A->>G: POST /api/baselines (save new baseline)
        A->>A: 3e: Fingerprint page for future self-healing
        A->>G: POST /api/tests/progress (page_complete)
        G->>DB: Save metrics, defects, compliance, healing events
        G->>W: emit 'page:complete' & 'defect:found' & 'heal:success'
    end
  
    note over A: STAGE 4: REPORT GENERATION 📋
    A->>A: Aggregate scores → calculate grade (A+ to F)
    A->>A: WCAG compliance % + top issues
    A-->>G: Return Final TestResult + SiteReport
    G->>DB: Save report, grade, WCAG compliance %
    G->>W: emit 'report:complete' & 'test:finished'
    W-->>F: Display "Test Completed" & enable reports
```

### Full Data Flow

```mermaid
flowchart LR
    Start(["User Request"]) --> Gateway["API Gateway"]
    Gateway --> Auth{"JWT Valid?"}
    Auth -- No --> Deny(["401 Unauthorized"])
    Auth -- Yes --> Route["tests route"]
  
    Route --> InitDB[("DB: test run created")]
    Route --> EventQueue(("Trigger Pipeline"))
  
    EventQueue --> AICore["AI Core Orchestrator"]
    AICore --> PW["Playwright Tool"]
  
    PW --> Crawler["Crawler Agent (BFS)"]
    Crawler --> Pages{"Discovered Pages + Links"}
  
    Pages --> History["Fetch Defect History"]
    History --> PR["Scheduler (PageRank + 4-Factor Risk)"]
    PR --> Sort["Greedy Sort (Priority)"]
    Sort --> WS1{{"WS: crawl:complete + pagerank:complete"}}
  
    Sort --> Loop["Test Loop (each page)"]
    Loop --> Heal["Self-Healing Agent"]
    Loop --> Basic["Tester Agent (SEO/Perf/Forms)"]
    Loop --> Axe["axe-core Tool (WCAG 2.1)"]
    Loop --> Vision["Vision Agent (Gemini + Regression)"]
  
    Heal --> Results["Page Results"]
    Basic --> Results
    Axe --> Results
    Vision --> Results
    Results --> WS2{{"WS: page:complete & defect:found & heal:success"}}
  
    WS2 --> Report["Report Agent"]
    Report --> Grade["Score + Grade (A+ to F)"]
    Grade --> FinDB[("Save report + baselines to Postgres")]
    FinDB --> WS3{{"WS: report:complete & test:finished"}}
```

---

## 🔍 Tech Stack Deep-Dive

AutonomousQA operates like a highly advanced human QA engineer. Here's how the core technologies work together:

### 1. Playwright (The "Eyes and Hands")

- **What it is:** A browser automation tool that launches real headless Chromium browsers.
- **Why we use it:** Unlike basic HTTP fetchers, Playwright executes JavaScript, renders React/Vue apps, paints CSS, and evaluates the actual Document Object Model (DOM) exactly as a human sees it.
- **How it works:** Python scripts inject evaluation code directly into the active browser page to measure Core Web Vitals (LCP, CLS, FID), check for accessibility violations, and perform visual heuristics.

### 2. Autonomous Crawling (The "Explorer")

- **What it is:** A Breadth-First Search (BFS) spider that maps the application.
- **How it works:** Starting from a seed URL, the crawler scans the DOM for valid `<a>` href links belonging to the same domain. It places these in a queue and visits them sequentially up to the configured `max_depth` and `max_pages`. This requires zero configuration from the user.

#### 🧭 Crawl Strategy Comparison

There are several approaches to crawl a website. Here's how they differ and why we chose BFS:

```
  EXAMPLE SITE MAP                        
                                           
            🏠 Homepage                    
           /     |     \                   
        📄About 📄Blog  📄Dash            
                 |        |    \           
              📄Post1  📄Settings 📄Analytics
                          |                
                       📄Profile
```

---

**① BFS — Breadth-First Search  ✅ WHAT WE USE**

```
  Visit order:  Level by level (wide first, then deep)

  Step 1 →  🏠 Homepage
  Step 2 →  📄 About        (Level 1)
  Step 3 →  📄 Blog         (Level 1)
  Step 4 →  📄 Dashboard    (Level 1)
  Step 5 →  📄 Post1        (Level 2)
  Step 6 →  📄 Settings     (Level 2)
  Step 7 →  📄 Analytics    (Level 2)
  Step 8 →  📄 Profile      (Level 3)

  ┌─────────────────────────────────────────────────┐
  │  Uses: FIFO Queue (First In, First Out)         │
  │                                                 │
  │  Queue: [Homepage]                              │
  │         → visit Homepage → enqueue children     │
  │  Queue: [About, Blog, Dashboard]                │
  │         → visit About → visit Blog → ...        │
  │  Queue: [Post1, Settings, Analytics]            │
  │         → visit all Level 2 ...                 │
  │                                                 │
  │  ✅ Finds important top-level pages FIRST       │
  │  ✅ Natural depth control (shallow/standard)    │
  │  ✅ Guaranteed shortest path to every page      │
  │  ⚠️ Sequential — one page at a time            │
  └─────────────────────────────────────────────────┘
```

---

**② DFS — Depth-First Search**

```
  Visit order:  Dive deep into one branch, then backtrack

  Step 1 →  🏠 Homepage
  Step 2 →  📄 About        ← dead end, backtrack
  Step 3 →  📄 Blog
  Step 4 →  📄 Post1        ← dead end, backtrack
  Step 5 →  📄 Dashboard
  Step 6 →  📄 Settings
  Step 7 →  📄 Profile      ← deep! finally backtrack
  Step 8 →  📄 Analytics

  ┌─────────────────────────────────────────────────┐
  │  Uses: LIFO Stack (Last In, First Out)          │
  │                                                 │
  │  Stack: [Homepage]                              │
  │         → visit Homepage → push children        │
  │  Stack: [About, Blog, Dashboard]                │
  │         → pop Dashboard → push its children     │
  │  Stack: [About, Blog, Settings, Analytics]      │
  │                                                 │
  │  ✅ Low memory usage                            │
  │  ✅ Good for finding deep-nested pages          │
  │  ❌ Can get lost in deep rabbit holes           │
  │  ❌ Misses breadth of site if max_pages hit     │
  └─────────────────────────────────────────────────┘
```

---

**③ Priority Queue — Best-First Search**

```
  Visit order:  Highest-priority (most "interesting") pages first

  Step 1 →  🏠 Homepage        (score: 100)
  Step 2 →  📄 Dashboard       (score: 90  — has forms!)
  Step 3 →  📄 Settings        (score: 85  — user inputs)
  Step 4 →  📄 Profile         (score: 80  — auth page)
  Step 5 →  📄 Blog            (score: 40  — static content)
  Step 6 →  📄 About           (score: 30  — low risk)
  Step 7 →  📄 Post1           (score: 20)
  Step 8 →  📄 Analytics       (score: 15)

  ┌─────────────────────────────────────────────────┐
  │  Uses: Priority Queue (highest score first)     │
  │                                                 │
  │  Each URL gets a score based on:                │
  │  • Has forms/inputs        → +40 points        │
  │  • Login/auth page         → +30 points        │
  │  • Dynamic route (/dashboard) → +20 points     │
  │  • Static content (/blog)  → +5 points         │
  │                                                 │
  │  ✅ Tests bug-prone pages first                 │
  │  ✅ Best use of limited max_pages budget        │
  │  ⚠️ Needs heuristic scoring logic              │
  │  ⚠️ More complex implementation                │
  └─────────────────────────────────────────────────┘
```

---

**④ Concurrent BFS — Parallel Breadth-First**

```
  Visit order:  Same as BFS, but multiple pages at once

  Step 1   →  🏠 Homepage
  Step 2-4 →  📄 About + 📄 Blog + 📄 Dashboard   ← parallel!
  Step 5-7 →  📄 Post1 + 📄 Settings + 📄 Analytics ← parallel!
  Step 8   →  📄 Profile

  ┌─────────────────────────────────────────────────┐
  │  Uses: FIFO Queue + Semaphore (N workers)       │
  │                                                 │
  │  Worker 1: About ──→ Post1 ──→ Profile          │
  │  Worker 2: Blog ───→ Settings                   │
  │  Worker 3: Dashboard → Analytics                │
  │                                                 │
  │  ✅ 3-5x faster than sequential BFS             │
  │  ✅ Same level-by-level coverage as BFS         │
  │  ✅ Semaphore prevents server overload          │
  │  ⚠️ Needs careful concurrency management       │
  │  ⚠️ Higher memory (multiple browser pages)     │
  └─────────────────────────────────────────────────┘
```

---

#### 📊 Strategy Comparison Matrix

```
                    BFS ✅        DFS          PRIORITY      CONCURRENT
                    (Current)                  QUEUE         BFS
  ─────────────────────────────────────────────────────────────────────
  Data Structure    FIFO Queue    LIFO Stack   Heap/PQ       Queue+Sema
  Visit Order       Level-by-     Branch-by-   Score-based   Level-by-
                    level         branch                     level
  Speed             ██░░░░        ██░░░░       ██░░░░        █████░
                    Moderate      Moderate     Moderate      Fast
  Coverage          █████░        ███░░░       ████░░        █████░
                    Excellent     Poor breadth Smart focus   Excellent
  Memory            ███░░░        █░░░░░       ███░░░        ████░░
                    Moderate      Very Low     Moderate      Higher
  Complexity        █░░░░░        █░░░░░       ████░░        ███░░░
                    Simple        Simple       Complex       Moderate
  Depth Control     ✅ Natural    ❌ Hard       ⚠️ Manual     ✅ Natural
  Best For          General       Deep-page    Limited       Large
                    crawling      hunting      page budgets  site audits
  ─────────────────────────────────────────────────────────────────────
```

> 🟢 **Current Implementation:** BugZero uses **BFS (Breadth-First Search)** with an `asyncio.Queue`. This ensures top-level pages (homepage, navigation links, dashboards) are tested first, matching our Shallow → Standard → Deep crawl depth model perfectly.

### 3. The DOM (Document Object Model) Analysis

The DOM is the tree-like structure the browser builds from HTML. Our AI uses the DOM as its primary source of truth to detect defects:

- **Accessibility:** Scans the DOM tree for `<img>` tags missing `alt` attributes, or `<input>` fields detached from `<label>` elements.
- **SEO & Structure:** Evaluates the heading hierarchy (e.g., checking for exactly one `<h1>` node).
- **UI Integrity:** Uses `getComputedStyle(element)` to ask the browser engine the exact painted color of text vs background to calculate real mathematical contrast ratios.

### 4. Self-Healing Agent (The "Mechanic") 🆕

![Self-Healing Selectors](assets/illustrations/02-self-healing.png)

An AI-powered selector repair system that keeps tests running when UI changes.

```mermaid
flowchart TD
    subgraph "Stage 3a — Before Each Page Test"
        A["🌐 Navigate to page"] --> B["📋 Load saved fingerprints\nfrom previous run"]
        B --> C{"Any interactive\nelements changed?"}
        C -- No --> D["✅ All selectors healthy"]
        C -- Yes --> E["🔍 identify broken\nselectors in DOM"]
        E --> F["🤖 Send to Gemini LLM:\nold fingerprint + current DOM"]
        F --> G["💡 Gemini proposes\nnew CSS selector"]
        G --> H{"Validate selector\non live page?"}
        H -- Fails --> I["⚠️ Log as unhealed"]
        H -- Works --> J["✅ Accept healed selector\nconfidence: 0.95"]
        J --> K["💾 Save HealingEvent to DB\noriginal → healed + confidence"]
        K --> L["📡 WebSocket: heal:success"]
    end
  
    subgraph "Stage 3e — After Each Page Test"
        M["🔍 fingerprint_page()"] --> N["📸 Capture all buttons,\nlinks, inputs, forms"]
        N --> O["💾 Store fingerprints\nfor next run"]
    end

    style A fill:#1E293B,stroke:#3B82F6,color:#fff
    style F fill:#1E293B,stroke:#F59E0B,color:#fff
    style J fill:#0F172A,stroke:#10B981,color:#fff
    style K fill:#0F172A,stroke:#A78BFA,color:#fff
```

**How it works internally:**

```
  ┌─────────────────────────────────────────────────────────────────┐
  │  FINGERPRINT STRUCTURE (per interactive element)                │
  │─────────────────────────────────────────────────────────────────│
  │                                                                 │
  │  {                                                              │
  │    "element_id": "btn_submit_3",                                │
  │    "tagName": "button",                                         │
  │    "textContent": "Submit Order",                               │
  │    "ariaLabel": "Submit your order",                            │
  │    "className": "btn-primary cta-main",                         │
  │    "position": { "x": 450, "y": 720 },                         │
  │    "nearbyText": ["Order Summary", "$49.99", "Free Shipping"],  │
  │    "selector": "#checkout-form > button.btn-primary"            │
  │  }                                                              │
  │                                                                 │
  │  When UI changes:                                               │
  │  ─────────────────                                              │
  │  OLD: #checkout-form > button.btn-primary     ← BROKEN ❌      │
  │  NEW: .checkout-container > .cta-button        ← HEALED ✅      │
  │  CONFIDENCE: 0.92 (high — text + position matched)              │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

### 5. Visual Regression Engine (The "Designer's Eye") 🆕

![Visual Regression AI](assets/illustrations/03-visual-regression.png)

A Gemini Vision-powered visual comparison system that detects meaningful UI changes.

```mermaid
flowchart TD
    subgraph "Run 1 — Establish Baseline"
        A1["📸 Take screenshot"] --> A2["🤖 Gemini: single-image\nbug detection"]
        A2 --> A3["💾 Save screenshot as\nbaseline in DB"]
    end

    subgraph "Run 2+ — Compare Against Baseline"
        B1["📸 Take new screenshot"] --> B2["📦 Fetch baseline\nfrom DB"]
        B2 --> B3["🤖 Gemini: compare\nBOTH images"]
        B3 --> B4{"Classify each\nchange"}
        B4 -- "Font/color/spacing" --> B5["🟡 Cosmetic\n(informational)"]
        B4 -- "Layout/element missing" --> B6["🔴 Functional\n(actionable)"]
        B5 --> B7["📊 Report with\nconfidence scores"]
        B6 --> B7
        B3 --> B8["💾 Update baseline\nfor next run"]
    end

    style A2 fill:#1E293B,stroke:#F59E0B,color:#fff
    style B3 fill:#1E293B,stroke:#22D3EE,color:#fff
    style B5 fill:#0F172A,stroke:#FBBF24,color:#fff
    style B6 fill:#0F172A,stroke:#EF4444,color:#fff
```

**Visual diff classification examples:**

```
  ┌────────────────────────────────────────────────────────────────┐
  │  GEMINI VISION — REGRESSION CLASSIFICATION                    │
  │────────────────────────────────────────────────────────────────│
  │                                                                │
  │  🟡 COSMETIC (informational — no action needed)               │
  │  ──────────────────────────────────────────────                │
  │  • Font size changed from 14px to 15px in paragraph           │
  │  • Button border-radius increased from 4px to 8px             │
  │  • Background color shifted from #f8f9fa to #f1f3f5           │
  │  • Icon spacing adjusted in navigation bar                    │
  │                                                                │
  │  🔴 FUNCTIONAL (actionable — must fix)                        │
  │  ──────────────────────────────────────────────                │
  │  • Submit button missing from checkout form                   │
  │  • Navigation menu items overlapping on mobile                │
  │  • Login form fields not visible (zero height)                │
  │  • Price display shows "$NaN" instead of "$49.99"             │
  │                                                                │
  │  Confidence: 0.72 – 0.98 (Gemini's certainty score)           │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
```

### 6. Risk Prioritization (The "Strategist") 🆕

![Risk Prioritization](assets/illustrations/04-risk-priority.png)

A multi-factor scoring system that determines which pages to test first.

```mermaid
flowchart LR
    subgraph "Factor 1: PageRank"
        PR["🕸️ Link Graph\n(networkx)"] --> PRS["Score: 0.00 – 0.30"]
    end
    subgraph "Factor 2: Type Boost"
        TB["📋 Page Classification"] --> TBS["auth: +0.15\nform: +0.12\ndash: +0.08\nother: +0.03"]
    end
    subgraph "Factor 3: Defect History"
        DH["📜 Last 10 runs\ndefect counts"] --> DHS["0 defects: +0.00\n5 defects: +0.06\n10+ defects: +0.20"]
    end
    subgraph "Factor 4: Change Detection"
        CD["📉 Score dropped\nvs previous run"] --> CDS["No change: +0.00\nDropped <70: +0.09\nDropped <50: +0.15"]
    end

    PRS --> SUM["⚡ Combined\nRisk Score"]
    TBS --> SUM
    DHS --> SUM
    CDS --> SUM
    SUM --> SORT["📊 Greedy Sort\nHighest risk first"]

    style SUM fill:#1E293B,stroke:#F59E0B,stroke-width:3px,color:#fff
    style SORT fill:#0F172A,stroke:#10B981,color:#fff
```

**Example risk scoring output:**

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │  RISK PRIORITY ORDER (top 5 pages)                                  │
  │──────────────────────────────────────────────────────────────────────│
  │                                                                      │
  │  #  PAGE           SCORE   BREAKDOWN                                │
  │  ── ──────────────  ─────   ────────────────────────────────────     │
  │  1. /login          0.412   PR:0.062 + type:0.15 + hist:0.200 + chg:0.000  │
  │  2. /checkout       0.355   PR:0.085 + type:0.12 + hist:0.100 + chg:0.050  │
  │  3. /settings       0.285   PR:0.045 + type:0.12 + hist:0.060 + chg:0.060  │
  │  4. /dashboard      0.238   PR:0.100 + type:0.08 + hist:0.028 + chg:0.030  │
  │  5. /about          0.067   PR:0.034 + type:0.03 + hist:0.003 + chg:0.000  │
  │                                                                      │
  │  ✅ /login tested first (highest combined risk)                     │
  │  ✅ /about tested last (lowest risk — static content)               │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

### 7. WebSockets / Socket.io (The "Live Broadcaster")

- **Why we use it:** Full autonomous testing can take 5-20 minutes. Polling is inefficient. WebSockets keep a permanent two-way "phone line" open between the browser and the server.
- **How it works:**
  1. The React frontend subscribes to a specific `testRunId` room.
  2. The Python AI finishes testing a single page and POSTs the result to the Express Gateway.
  3. The Gateway saves the page to PostgreSQL and instantly broadcasts that data packet over the active WebSocket.
  4. The React UI instantly receives the data and animates it onto the screen without a page refresh.

---

## 🗄️ Database Schema

```mermaid
erDiagram
    User ||--o{ TestRun : "launches"
    User ||--o| NotificationPreference : "has"
    User ||--o{ ApiKey : "owns"
    User ||--o{ UserActivity : "generates"
    Organization ||--o{ User : "has members"
    Organization ||--o{ AuthPlaybook : "stores"
    TestRun ||--o{ Page : "discovers"
    TestRun ||--o{ Defect : "finds"
    TestRun ||--o{ HealingEvent : "heals"
    Page ||--o{ Defect : "contains"
    Page ||--o{ ComplianceResult : "audits"
    Page ||--o{ PerformanceMetric : "measures"
    Page ||--o{ HealingEvent : "healed on"

    User {
        string id PK
        string email UK
        string name
        string role
    }
    TestRun {
        string id PK
        string url
        string status
        float overallScore
        string grade
    }
    Page {
        string id PK
        string url
        float hygieneScore
        float visionQualityScore
        string pageType
    }
    Defect {
        string id PK
        string type
        string severity
        string message
        float confidence
        string source
    }
    HealingEvent {
        string id PK
        string elementId
        string originalSelector
        string healedSelector
        float confidence
    }
    ScreenshotBaseline {
        string id PK
        string url UK
        text screenshotB64
    }
    ComplianceResult {
        string id PK
        string standard
        string level
        int violations
    }
    PerformanceMetric {
        string id PK
        string name
        float value
        string rating
    }
```

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **Docker & Docker Compose** (Latest)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/rohith2157/BUGZERO.git
cd BUGZERO
```

### 2️⃣ Start infrastructure

```bash
docker-compose up -d
```

### 3️⃣ Setup API Gateway

```bash
cd gateway
npm install
cp .env.example .env          # configure your environment
npx prisma generate
npx prisma db push
node prisma/seed.js            # seed demo data
npm run dev
```

### 4️⃣ Setup AI Core

```bash
cd ai-core
python -m venv venv
# Linux/macOS: source venv/bin/activate
# Windows:     venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
python main.py
```

### 5️⃣ Setup Frontend

```bash
cd autonomousqa-frontend
npm install
npm run dev
```

### 6️⃣ Open the app

| Service                 | URL                                                   |
| :---------------------- | :---------------------------------------------------- |
| **Frontend**      | [http://localhost:5173](http://localhost:5173)           |
| **API Gateway**   | [http://localhost:3000](http://localhost:3000)           |
| **AI Core Docs**  | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Neo4j Browser** | [http://localhost:7474](http://localhost:7474)           |
| **Prisma Studio** | Run`cd gateway && npx prisma studio`                |

> 🔑 **Default Login:**
> Email: `rohith@autonomousqa.io` | Password: `password123`

---

## 📂 Project Structure

```text
BUGZERO/
├── autonomousqa-frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   └── ui/                # Design system primitives
│   │   ├── pages/                 # Route-level page components
│   │   │   ├── Landing.jsx        # Marketing landing page
│   │   │   ├── UseCases.jsx       # 6 AI Agents deep-dive
│   │   │   ├── Dashboard.jsx      # Test history & analytics
│   │   │   ├── NewTest.jsx        # Test configuration launcher
│   │   │   ├── LiveTest.jsx       # Real-time test monitoring + self-healing log
│   │   │   ├── Report.jsx         # Full test report + visual regression section
│   │   │   ├── Compliance.jsx     # WCAG compliance details
│   │   │   └── Performance.jsx    # Core Web Vitals dashboard
│   │   ├── hooks/                 # Custom React hooks (WebSocket, etc.)
│   │   ├── lib/                   # API client & utilities
│   │   ├── store/                 # Zustand state management
│   │   └── data/                  # Mock data (development fallback)
│   ├── index.html
│   └── vite.config.js
│
├── gateway/                       # Express.js API Gateway
│   ├── src/
│   │   ├── routes/
│   │   │   ├── tests.js           # Test CRUD + progress + healing events + history
│   │   │   ├── baselines.js       # 🆕 Visual regression baseline CRUD
│   │   │   ├── auth.js            # JWT authentication
│   │   │   ├── playbooks.js       # Test playbook management
│   │   │   └── settings.js        # User/team/API key settings
│   │   ├── middleware/            # Auth, validation, rate limiting
│   │   └── services/              # Business logic & WebSocket
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (13 models)
│   │   └── seed.js                # Seed data script
│   └── .env.example
│
├── ai-core/                       # Python FastAPI AI Engine
│   ├── agents/
│   │   ├── crawler.py             # BFS crawler agent
│   │   ├── tester.py              # Page testing agent
│   │   ├── self_healing_agent.py  # 🆕 Fingerprinting + LLM-powered healing
│   │   ├── vision_agent.py        # Gemini Vision + visual regression
│   │   ├── scheduler.py           # PageRank + 4-factor risk scoring
│   │   ├── auth_agent.py          # SSO/OAuth/MFA navigator
│   │   ├── chaos_agent.py         # Network/CPU throttling
│   │   └── report_agent.py        # Site report generator
│   ├── tools/
│   │   ├── playwright_tool.py     # Browser automation + screenshots + DOM access
│   │   └── axe_tool.py            # axe-core WCAG 2.1 scanner
│   ├── models/
│   │   └── schemas.py             # Pydantic models (HealingEvent, VisualRegression, etc.)
│   ├── orchestrator.py            # Multi-stage pipeline coordinator
│   ├── config.py                  # Settings (Gemini API key, etc.)
│   ├── main.py                    # FastAPI entrypoint
│   └── requirements.txt
│
├── documentation/                 # 📚 All project documentation
│   ├── AUTONOMOUSQA_DOCUMENTATION.docx
│   ├── AutonomousQA_Full_Roadmap.docx
│   ├── BROWSERS_AND_CRAWL_DEPTHS.md
│   └── SYSTEM_WORKFLOW.md
│
├── docker-compose.yml             # PostgreSQL + Redis + Neo4j
├── package.json                   # Root workspace scripts
├── CONTRIBUTING.md                # Contribution guidelines
├── CODE_OF_CONDUCT.md             # Community standards
├── SECURITY.md                    # Security policy
└── LICENSE                        # MIT License
```

---

## 📡 API Reference

<details>
<summary><strong>🔐 Authentication</strong></summary>

| Method   | Endpoint               | Description              |
| :------- | :--------------------- | :----------------------- |
| `POST` | `/api/auth/register` | Register a new user      |
| `POST` | `/api/auth/login`    | Login — returns JWT     |
| `GET`  | `/api/auth/me`       | Get current user profile |
| `POST` | `/api/auth/refresh`  | Refresh access token     |

</details>

<details>
<summary><strong>🧪 Test Runs</strong></summary>

| Method     | Endpoint                       | Description                               |
| :--------- | :----------------------------- | :---------------------------------------- |
| `POST`   | `/api/tests`                 | Start a new autonomous test run           |
| `GET`    | `/api/tests`                 | List all test runs                        |
| `GET`    | `/api/tests/:id`             | Get test run details                      |
| `DELETE` | `/api/tests/:id`             | Cancel a running test                     |
| `GET`    | `/api/tests/:id/pages`       | Get page-level results                    |
| `GET`    | `/api/tests/:id/compliance`  | Compliance report                         |
| `GET`    | `/api/tests/:id/performance` | Performance report                        |
| `GET`    | `/api/tests/:id/healing`     | 🆕 Self-healing events for a run          |
| `GET`    | `/api/tests/history/lookup`  | 🆕 Defect history for risk prioritization |

</details>

<details>
<summary><strong>📸 Visual Regression Baselines</strong></summary>

| Method   | Endpoint                       | Description                            |
| :------- | :----------------------------- | :------------------------------------- |
| `GET`  | `/api/baselines?url=&orgId=` | 🆕 Fetch baseline screenshot for a URL |
| `POST` | `/api/baselines`             | 🆕 Save/update baseline screenshot     |

</details>

<details>
<summary><strong>📋 Playbooks</strong></summary>

| Method     | Endpoint               | Description          |
| :--------- | :--------------------- | :------------------- |
| `GET`    | `/api/playbooks`     | List saved playbooks |
| `POST`   | `/api/playbooks`     | Create a playbook    |
| `PUT`    | `/api/playbooks/:id` | Update a playbook    |
| `DELETE` | `/api/playbooks/:id` | Delete a playbook    |

</details>

<details>
<summary><strong>⚙️ Settings</strong></summary>

| Method     | Endpoint                       | Description          |
| :--------- | :----------------------------- | :------------------- |
| `GET`    | `/api/settings/team`         | Get team members     |
| `PUT`    | `/api/settings/profile`      | Update user profile  |
| `GET`    | `/api/settings/api-keys`     | List API keys        |
| `POST`   | `/api/settings/api-keys`     | Generate new API key |
| `DELETE` | `/api/settings/api-keys/:id` | Revoke an API key    |

</details>

### WebSocket Events

| Event               | Direction        | Description                     |
| :------------------ | :--------------- | :------------------------------ |
| `test:started`    | Server → Client | Test run initiated              |
| `page:discovered` | Server → Client | New page found during crawl     |
| `page:complete`   | Server → Client | Page testing finished           |
| `defect:found`    | Server → Client | Defect detected in real time    |
| `heal:success`    | Server → Client | 🆕 Self-healing selector repair |
| `test:complete`   | Server → Client | Full test run finished          |
| `test:cancel`     | Client → Server | Request to cancel a test        |

---

## 🗄️ Database Schema

The platform uses **13 Prisma models** across PostgreSQL:

| Model                      | Purpose                                                                |
| :------------------------- | :--------------------------------------------------------------------- |
| `User`                   | Authentication & profile                                               |
| `Organization`           | Team management                                                        |
| `TestRun`                | Test execution records                                                 |
| `Page`                   | Discovered pages with scores                                           |
| `Defect`                 | Detected bugs with severity                                            |
| `ComplianceResult`       | WCAG/GDPR violations                                                   |
| `PerformanceMetric`      | Core Web Vitals per page                                               |
| `HealingEvent`           | 🆕 Self-healing audit trail (original → healed selector + confidence) |
| `ScreenshotBaseline`     | 🆕 Visual regression baseline screenshots per URL                      |
| `AuthPlaybook`           | Saved authentication strategies                                        |
| `ApiKey`                 | API key management                                                     |
| `NotificationPreference` | Notification settings                                                  |
| `UserActivity`           | Activity tracking                                                      |

---

## 🗺️ Roadmap

- [X] Autonomous web crawler with Playwright
- [X] Accessibility auditing (axe-core WCAG 2.1 AA)
- [X] Real-time dashboard with WebSocket
- [X] JWT authentication & team management
- [X] Playbook save/replay system
- [X] Core Web Vitals performance monitoring
- [X] Gemini Vision AI visual bug detection
- [X] 🆕 Self-healing tests with semantic fingerprinting
- [X] 🆕 Visual regression AI with baseline comparison
- [X] 🆕 Risk prioritization with defect history + change detection
- [X] 🆕 Self-healing audit trail (DB + frontend UI)
- [ ] Natural language test generation (LangChain + OpenAI)
- [ ] CI/CD pipeline integration (GitHub Actions, Jenkins)
- [ ] PDF/HTML report export
- [ ] Multi-browser support (Firefox, WebKit)
- [ ] Scheduled recurring test runs
- [ ] Slack / Teams notification integration

---

## 🤝 Contributing

We love contributions! Whether it's fixing a typo or building a new AI agent, every bit helps.

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feat/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feat/amazing-feature`)
5. **Open** a Pull Request

Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before getting started.

---

## 🛡️ Security

Found a vulnerability? Please report it responsibly. See our [Security Policy](./SECURITY.md) for details.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Playwright](https://playwright.dev/)** — Browser automation
- **[axe-core](https://github.com/dequelabs/axe-core)** — Accessibility testing engine
- **[Google Gemini](https://ai.google.dev/)** — Vision AI & LLM reasoning
- **[Prisma](https://www.prisma.io/)** — Next-generation ORM
- **[Framer Motion](https://www.framer.com/motion/)** — Animation library
- **[networkx](https://networkx.org/)** — PageRank graph analysis

---

<div align="center">
  <p><strong>Built with ❤️ by <a href="https://github.com/rohith2157">Rohith</a></strong></p>
  <p><sub>If AutonomousQA helped you, consider giving it a ⭐</sub></p>
</div>
