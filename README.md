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
    <a href="#-features">Features</a> •
    <a href="#%EF%B8%8F-architecture">Architecture</a> •
    <a href="#%E2%9A%99%EF%B8%8F-system-workflow">Workflow</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-contributing">Contributing</a>
  </h4>

</div>

---

## 🧠 What is AutonomousQA?

**AutonomousQA** is an AI-driven testing platform that autonomously crawls, analyzes, and tests any web application. Point it at a URL — it discovers every page, runs accessibility audits, performance checks, and functional tests — then reports defects with full evidence. **No scripts. No config. No babysitting.**

> 💡 **The Problem:** Writing and maintaining test scripts is slow, expensive, and fragile. Traditional QA can't keep pace with rapid development cycles, and critical bugs slip through because manual testing doesn't scale.

> ✨ **The Solution:** AutonomousQA deploys AI agents that behave like expert QA engineers — they explore your app intelligently, find issues humans miss, and deliver actionable reports in real time.

---

## ✨ Features

<div align="center">

| Feature | Description |
|:---|:---|
| 🕷️ **Autonomous Crawling** | AI-powered spider discovers all pages, forms, and user flows automatically |
| ♿ **Accessibility Audits** | WCAG 2.1 compliance checks via axe-core — catches a11y issues instantly |
| ⚡ **Performance Analysis** | Core Web Vitals, load times, and resource analysis for every page |
| 🛡️ **Security Scanning** | Detects common vulnerabilities (XSS vectors, open redirects, insecure headers) |
| 📊 **Real-Time Dashboard** | Live WebSocket updates — watch tests run and defects appear in real time |
| 📋 **Compliance Reports** | Export-ready reports with WCAG, OWASP, and performance compliance scoring |
| 🎯 **Smart Defect Classification** | AI categorizes bugs by severity, type, and affected component |
| 📸 **Visual Evidence** | Screenshots and DOM snapshots attached to every defect |
| 🔄 **Playbook System** | Save and replay test configurations across releases |

</div>

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

    style Frontend fill:#1E293B,stroke:#3B82F6,stroke-width:2px,color:#fff
    style API fill:#1E293B,stroke:#10B981,stroke-width:2px,color:#fff
    style AI fill:#1E293B,stroke:#8B5CF6,stroke-width:2px,color:#fff
    style DB fill:#0F172A,stroke:#64748B,color:#fff
    style Redis fill:#0F172A,stroke:#64748B,color:#fff
    style Neo fill:#0F172A,stroke:#64748B,color:#fff
    style PW fill:#0F172A,stroke:#64748B,color:#fff
    style Axe fill:#0F172A,stroke:#64748B,color:#fff
```

| Service | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 19, Vite 7, Framer Motion, Recharts | Interactive dashboard & real-time monitoring |
| **API Gateway** | Express.js, Prisma ORM, Socket.io, JWT | REST API, authentication, WebSocket relay |
| **AI Core** | Python FastAPI, Playwright, axe-core | Autonomous crawling, testing, and defect detection |
| **PostgreSQL** | v16 | Persistent storage (users, tests, defects) |
| **Redis** | v7 | Caching, session management, job queues |
| **Neo4j** | v5 | Graph-based page relationship mapping |

---

## ⚙️ System Workflow

Here’s exactly what happens under the hood when you click **"Launch Test"**.

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🖥️ Frontend (React)
    participant G as ⚙️ Gateway (Node.js)
    participant DB as 🐘 Database (Postgres)
    participant W as ⚡ WebSocket Server
    participant A as 🤖 AI Core (Python)

    U->>F: Clicks "Launch Test" (URL, Config)
    F->>G: POST /api/tests { url, config }
    G->>DB: Create test_run status="queued"
    G-->>F: Return UUID
    F->>W: Join room {testRun.id} (Live UI)
    G->>A: Trigger pipeline (POST /api/test/run) via proxy
    
    note over A: STAGE 1: CRAWL 🕷️
    A->>A: Playwright runs BFS Crawl
    A->>G: POST /api/tests/progress (crawl_complete)
    G->>W: emit 'crawl:complete' (Updates UI Pages Total)
    
    note over A: STAGE 2: TEST LOOP 🔬
    loop For each discovered page
        A->>A: Run A11y, SEO, Security checks
        A->>G: POST /api/tests/progress (page_complete)
        G->>DB: Save metrics & defects
        G->>W: emit 'page:complete' & 'defect:found'
    end
    
    note over A: STAGE 3: RESULT REPORT 📊
    A-->>G: Return Final TestReport Details JSON
    G->>DB: Mark status="completed", Save Score
    G->>W: emit 'test:finished'
    W-->>F: Display "Test Completed" & enable reports
```

### Full Data Flow

```mermaid
flowchart LR
    Start([User Request]) --> Gateway[API Gateway]
    Gateway --> Auth{JWT Valid?}
    Auth -- No --> Deny([401 Unauthorized])
    Auth -- Yes --> Route[tests route]
    
    Route --> InitDB[(SQLite test run created)]
    Route --> EventQueue((Trigger Pipeline))
    
    EventQueue --> AICore[AI Core Orchestrator]
    AICore --> Spawn1[Playwright Tool]
    Spawn1 --> Spawn2[Crawler Agent]
    Spawn1 --> Spawn3[Tester Agent]
    
    Spawn2 --> CrawledPages{Discover Links}
    CrawledPages --> ReportCrawl--> PushWS1{{WS: crawl:complete}}
    
    CrawledPages --> Loop1[Test each Page]
    Loop1 --> Metric[SEO / A11y / Security metrics]
    Metric --> PushWS2{{WS: page:complete & defect:found}}
    
    PushWS2 --> EndSession[Final Aggregate JSON]
    EndSession --> FinDB[(Save scores to Postgres)]
    FinDB --> PushWS3{{WS: test:finished}}
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
  │  Queue: [Post1, Settings, Analytics]             │
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

### 4. WebSockets / Socket.io (The "Live Broadcaster")
- **Why we use it:** Full autonomous testing can take 5-20 minutes. Polling is inefficient. WebSockets keep a permanent two-way "phone line" open between the browser and the server.
- **How it works:**
  1. The React frontend subscribes to a specific `testRunId` room.
  2. The Python AI finishes testing a single page and POSTs the result to the Express Gateway.
  3. The Gateway saves the page to PostgreSQL and instantly broadcasts that data packet over the active WebSocket.
  4. The React UI instantly receives the data and animates it onto the screen without a page refresh.

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

| Service | URL |
|:---|:---|
| **Frontend** | [http://localhost:5173](http://localhost:5173) |
| **API Gateway** | [http://localhost:3000](http://localhost:3000) |
| **AI Core Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Neo4j Browser** | [http://localhost:7474](http://localhost:7474) |
| **Prisma Studio** | Run `cd gateway && npx prisma studio` |

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
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # API client & utilities
│   │   ├── store/                 # Zustand state management
│   │   └── data/                  # Mock data (development fallback)
│   ├── index.html
│   └── vite.config.js
│
├── gateway/                       # Express.js API Gateway
│   ├── src/
│   │   ├── routes/                # REST API route handlers
│   │   ├── middleware/            # Auth, validation, rate limiting
│   │   └── services/              # Business logic & WebSocket
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.js                # Seed data script
│   └── .env.example
│
├── ai-core/                       # Python FastAPI AI Engine
│   ├── agents/                    # Crawler, Tester, Classifier agents
│   ├── tools/                     # Playwright & axe-core wrappers
│   ├── models/                    # Pydantic request/response schemas
│   ├── orchestrator.py            # Multi-agent pipeline coordinator
│   ├── main.py                    # FastAPI entrypoint
│   └── requirements.txt
│
├── documentation/                 # 📚 All project documentation
│   ├── AUTONOMOUSQA_DOCUMENTATION.docx      # Full product documentation
│   ├── AUTONOMOUSQA_DOCUMENTATION.md.resolved
│   ├── AutonomousQA_Full_Roadmap.docx       # Complete feature roadmap
│   ├── AutonomousQA_Roadmap.docx            # Roadmap overview
│   ├── AutonomousQA_Premium_Roadmap.md      # Premium tier roadmap
│   ├── AutonomousQA_Modularity.md           # Modularity architecture doc
│   ├── BROWSERS_AND_CRAWL_DEPTHS.md         # Browser & crawl depth guide
│   ├── SYSTEM_WORKFLOW.md                   # System workflow deep-dive
│   ├── convert_md2docx.py                   # MD → DOCX converter script
│   └── extract_docx.py                      # DOCX text extractor script
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

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login — returns JWT |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/auth/refresh` | Refresh access token |

</details>

<details>
<summary><strong>🧪 Test Runs</strong></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/tests` | Start a new autonomous test run |
| `GET` | `/api/tests` | List all test runs |
| `GET` | `/api/tests/:id` | Get test run details |
| `DELETE` | `/api/tests/:id` | Cancel a running test |
| `GET` | `/api/tests/:id/pages` | Get page-level results |
| `GET` | `/api/tests/:id/compliance` | Compliance report |
| `GET` | `/api/tests/:id/performance` | Performance report |

</details>

<details>
<summary><strong>📋 Playbooks</strong></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/playbooks` | List saved playbooks |
| `POST` | `/api/playbooks` | Create a playbook |
| `PUT` | `/api/playbooks/:id` | Update a playbook |
| `DELETE` | `/api/playbooks/:id` | Delete a playbook |

</details>

<details>
<summary><strong>⚙️ Settings</strong></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/settings/team` | Get team members |
| `PUT` | `/api/settings/profile` | Update user profile |
| `GET` | `/api/settings/api-keys` | List API keys |
| `POST` | `/api/settings/api-keys` | Generate new API key |
| `DELETE` | `/api/settings/api-keys/:id` | Revoke an API key |

</details>

### WebSocket Events

| Event | Direction | Description |
|:---|:---|:---|
| `test:started` | Server → Client | Test run initiated |
| `page:discovered` | Server → Client | New page found during crawl |
| `page:complete` | Server → Client | Page testing finished |
| `defect:found` | Server → Client | Defect detected in real time |
| `test:complete` | Server → Client | Full test run finished |
| `test:cancel` | Client → Server | Request to cancel a test |

---

## 🗺️ Roadmap

- [x] Autonomous web crawler with Playwright
- [x] Accessibility auditing (axe-core)
- [x] Real-time dashboard with WebSocket
- [x] JWT authentication & team management
- [x] Playbook save/replay system
- [ ] AI-powered visual regression testing
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
- **[Prisma](https://www.prisma.io/)** — Next-generation ORM
- **[Framer Motion](https://www.framer.com/motion/)** — Animation library
- **[Recharts](https://recharts.org/)** — Charting library

---

<div align="center">
  <p><strong>Built with ❤️ by <a href="https://github.com/rohith2157">Rohith</a></strong></p>
  <p><sub>If AutonomousQA helped you, consider giving it a ⭐</sub></p>
</div>
