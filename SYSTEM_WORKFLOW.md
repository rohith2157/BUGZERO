# AutonomousQA — Complete System Workflow

> Everything about how the system works: architecture, data flow, what each setting does,
> why you got the same result on all three depths, and what each component is responsible for.

---

## 1. ARCHITECTURE OVERVIEW

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         AUTONOMOUSQA SYSTEM                                │
  │                                                                             │
  │   USER BROWSER                                                              │
  │   localhost:5173                                                            │
  │   ┌──────────────┐                                                         │
  │   │  React App   │  ◀──── WebSocket (live updates) ────────────────────┐  │
  │   │  (Frontend)  │  ──── REST API calls ──────────────────────────┐    │  │
  │   └──────────────┘                                                │    │  │
  │                                                                   │    │  │
  │                              ┌────────────────────────────────────▼──┐ │  │
  │                              │        GATEWAY (Node.js)              │ │  │
  │                              │        localhost:3000                  │ │  │
  │                              │                                        │ │  │
  │                              │  • Express REST API                    │ │  │
  │                              │  • Socket.IO WebSocket server  ────────┘ │  │
  │                              │  • Prisma ORM → SQLite DB               │  │
  │                              │  • JWT Authentication                   │  │
  │                              │  • Test queue management                │  │
  │                              └───────────────┬────────────────────────┘  │
  │                                              │ POST /api/test/run         │
  │                                              │ (long-running HTTP call)   │
  │                                              ▼                            │
  │                              ┌────────────────────────────────────────┐   │
  │                              │        AI CORE (Python/FastAPI)        │   │
  │                              │        localhost:8000                  │   │
  │                              │                                        │   │
  │                              │  • FastAPI REST server                 │   │
  │                              │  • Orchestrator (pipeline controller)  │   │
  │                              │  • CrawlerAgent (link discovery)       │   │
  │                              │  • TesterAgent (defect detection)      │   │
  │                              │  • PlaywrightTool (real browser)       │   │
  │                              │                                        │   │
  │                              │  During test: POST /api/tests/progress │   │
  │                              │  ──────────────────────────────────────────┘
  │                              └────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. WHAT HAPPENS WHEN YOU CLICK "LAUNCH TEST"

```
  USER CLICKS LAUNCH
         │
         ▼
  [1] FRONTEND → POST /api/tests
      Sends: { url, config: { browser, crawl_depth, modules } }
         │
         ▼
  [2] GATEWAY creates DB record
      testRun { id, url, status: "queued", config }
      Returns: { testRun.id } immediately
         │
         ▼
  [3] FRONTEND navigates to /tests/:id  (Live Test View)
      Connects WebSocket → joins room for this testRun.id
         │
         ▼
  [4] GATEWAY triggers AI Core in background
      POST http://localhost:8000/api/test/run
      Body: { run_id, url, config }
         │
         ▼
  [5] AI CORE starts pipeline (see Stage diagram below)
      ┌─────────────────────────────────────────────┐
      │  Stage 1: CRAWL                             │
      │  PlaywrightTool opens a real Chrome browser │
      │  Visits the URL, finds all <a href> links   │
      │  Returns list of discovered pages           │
      │                                             │
      │  Stage 2: REPORT CRAWL                      │
      │  POST /api/tests/progress                   │
      │  { event: "crawl_complete", total_pages }   │
      │  → Gateway updates DB, emits WS event       │
      │  → Frontend shows "X Pages Found"           │
      │                                             │
      │  Stage 3: TEST EACH PAGE (loop)             │
      │  For each discovered page:                  │
      │    - Open page in browser                   │
      │    - Check accessibility, SEO, performance  │
      │    - POST /api/tests/progress               │
      │      { event: "page_complete", page data }  │
      │    → Gateway writes to DB, emits WS event   │
      │    → Frontend shows defect in Live Feed     │
      └─────────────────────────────────────────────┘
         │
         ▼
  [6] AI CORE returns final result JSON to Gateway
         │
         ▼
  [7] GATEWAY finalizes testRun
      status → "completed", overallScore, defectCount
      Emits WebSocket: test:finished
         │
         ▼
  [8] FRONTEND shows "Test Complete"
      "View Report" button becomes active
```

---

## 3. CRAWL DEPTH — HOW IT ACTUALLY WORKS

### How the crawler finds pages

The crawl uses a **BFS queue** (Breadth-First Search):

```python
queue = [start_url]          # Start with just the root URL
visited = set()

while queue and len(visited) < max_pages:
    url = queue.pop(0)       # Take next URL
    page = browser.goto(url) # Open in real browser
    
    # Find all links on this page
    links = page.evaluate("""
        document.querySelectorAll('a[href]')  # Only <a> tags
            .map(a => a.href)
            .filter(href => href.startsWith('http'))
    """)
    
    # Add same-domain links to queue
    for link in links:
        if same_domain(link) and link not in visited:
            queue.append(link)
```

The `max_pages` limit controls when the queue stops:

```
  DEPTH SETTING    →   max_pages   →   WHAT THE CRAWLER DOES
  ─────────────────────────────────────────────────────────────
  Shallow          →   5           →   Stops after finding 5 pages
  Standard         →   20          →   Stops after finding 20 pages
  Deep             →   100         →   Stops after finding 100 pages
```

**The depth setting is a PAGE COUNT LIMIT, not a folder-depth limit.**  
The crawler visits pages in BFS order (closest pages first), so shallower
pages are naturally visited before deeper ones.

---

## 4. WHY YOU GOT 1 PAGE FOR ALL THREE DEPTHS ← THE REAL ANSWER

You tested `https://mail.google.com`. Here is exactly what happened:

```
  CRAWL STARTS at https://mail.google.com/
         │
         ▼
  Browser loads the page
         │
         ▼
  Google redirects unauthenticated users to:
  https://accounts.google.com/signin/...
         │
         ▼
  Crawler checks: "Is this the same domain as mail.google.com?"
  accounts.google.com ≠ mail.google.com  → BLOCKED
         │
         ▼
  Crawler looks for <a href="..."> links on the login page
  Login page has almost no same-domain links
         │
         ▼
  Queue is EMPTY — nothing left to visit
  Result: 1 page found (just the root /)
```

### The Two Website Types

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  TYPE 1: TRADITIONAL MULTI-PAGE SITE (depth setting WORKS)      │
  │                                                                  │
  │  https://docs.python.org/                                       │
  │  ├── /tutorial/  ← links to this exist in <a href>             │
  │  ├── /library/   ← links to this exist in <a href>             │
  │  └── /reference/ ← links to this exist in <a href>             │
  │                                                                  │
  │  Shallow  → finds 5 pages  ✅                                   │
  │  Standard → finds 20 pages ✅                                   │
  │  Deep     → finds 100 pages ✅                                  │
  └──────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────┐
  │  TYPE 2: SPA / AUTH-GATED APP (depth setting has NO EFFECT)     │
  │                                                                  │
  │  https://mail.google.com/                                       │
  │  ├── All navigation is JavaScript (no <a href> links)           │
  │  ├── Auth wall — redirects to accounts.google.com               │
  │  └── Internal routes only visible after login                   │
  │                                                                  │
  │  Shallow  → finds 1 page ❌ (not a bug — nothing to find)      │
  │  Standard → finds 1 page ❌                                     │
  │  Deep     → finds 1 page ❌                                     │
  └──────────────────────────────────────────────────────────────────┘
```

### Sites where you WILL see different depth results

```
  ✅ WORKS WELL                   ❌ ALWAYS 1-2 PAGES
  ────────────────────────────    ──────────────────────────────
  Documentation sites             Gmail, Outlook (auth-gated)
  Company websites                React/Vue SPAs (JS navigation)
  E-commerce stores               Slack, Discord (requires login)
  Blogs / news sites              Twitter/X, Instagram (auth wall)
  Government/edu sites            Next.js apps with dynamic routes
  WordPress sites                 Apps behind VPN
  Portfolio websites              Single-page login portals
```

---

## 5. COMPLETE DATA FLOW DIAGRAM

```
  TEST REQUEST
       │
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  GATEWAY (tests.js route)                                   │
  │                                                             │
  │  POST /api/tests                                            │
  │  ├── Validates JWT token (auth middleware)                  │
  │  ├── Creates testRun in SQLite DB                           │
  │  │     { id: uuid, url, status: "queued",                  │
  │  │       config: { browser, crawl_depth, modules } }       │
  │  ├── Returns 201 { testRun }                                │
  │  └── Calls triggerAITest(testRun, io) [background]         │
  └───────────────────────┬─────────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  GATEWAY testService.js                                     │
  │                                                             │
  │  triggerAITest()                                            │
  │  ├── Updates DB: status → "running"                        │
  │  ├── Emits WS: "test:started"                              │
  │  └── httpFetch POST http://localhost:8000/api/test/run     │
  │       (uses Node.js http module, 30 min timeout)           │
  └───────────────────────┬─────────────────────────────────────┘
                          │  long-running HTTP call
                          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  AI CORE main.py → FastAPI                                  │
  │                                                             │
  │  POST /api/test/run                                         │
  │  └── Calls Orchestrator.run_test(request)                  │
  └───────────────────────┬─────────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  ORCHESTRATOR.run_test()                                    │
  │                                                             │
  │  1. Creates PlaywrightTool(browser, headless)              │
  │  2. Creates CrawlerAgent(playwright)                        │
  │  3. Creates TesterAgent(playwright)                         │
  │  4. await playwright.start()  ← launches Chrome            │
  │                                                             │
  │  STAGE 1: CRAWL                                            │
  │  5. discovered = await crawler.crawl(url, depth)           │
  │     depth → max_pages: shallow=5, standard=20, deep=100    │
  │                                                             │
  │  STAGE 2: REPORT CRAWL                                     │
  │  6. POST /api/tests/progress                               │
  │     { event:"crawl_complete", total_pages: N }             │
  │     → Gateway updates DB totalPages                        │
  │     → WS emits "crawl:complete" to frontend               │
  │                                                             │
  │  STAGE 3: TEST LOOP                                        │
  │  7. for each page in discovered:                           │
  │       page_result = await tester.test(page.url)           │
  │       POST /api/tests/progress                             │
  │       { event:"page_complete", page: { defects, score } } │
  │       → Gateway saves page, defects, compliance, perf     │
  │       → WS emits "page:complete" + "defect:found"         │
  │                                                             │
  │  STAGE 4: AGGREGATE                                        │
  │  8. Calculate overallScore = avg(page scores)              │
  │  9. Return TestResult JSON                                  │
  └───────────────────────┬─────────────────────────────────────┘
                          │  returns final JSON
                          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  GATEWAY testService.js (finalizes)                         │
  │                                                             │
  │  ├── Updates DB: status → "completed"                      │
  │  ├── Saves overallScore, defectCount                       │
  │  ├── Writes remaining pages (if incremental missed any)    │
  │  └── Emits WS: "test:finished"                            │
  └───────────────────────┬─────────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  FRONTEND (LiveTest.jsx)                                    │
  │                                                             │
  │  WebSocket events received:                                 │
  │  ├── "test:started"   → progress bar activates            │
  │  ├── "crawl:complete" → shows "X Pages Found"             │
  │  ├── "page:complete"  → adds page to Pages Discovered     │
  │  ├── "defect:found"   → adds to Live Defects Feed         │
  │  └── "test:finished"  → shows "Test Complete" + score     │
  └─────────────────────────────────────────────────────────────┘
```

---

## 6. BROWSER SELECTION — WHAT IT CHANGES

```
  ┌─────────────────────────────────────────────────────┐
  │  config.browser is passed from Frontend             │
  │  → Gateway stores in testRun.config                 │
  │  → AI Core reads from request.config.browser        │
  │  → PlaywrightTool(browser_type="chromium|firefox|webkit")
  │                                                     │
  │  Code path:                                         │
  │  NewTest.jsx:  browser.toLowerCase()               │
  │    "Chromium" → "chromium"                         │
  │    "Firefox"  → "firefox"                          │
  │    "WebKit"   → "webkit"                           │
  │                                                     │
  │  PlaywrightTool.__init__:                           │
  │    self._browser_type = browser_type               │
  │                                                     │
  │  PlaywrightTool._ensure_browser:                    │
  │    getattr(self._pw, "chromium").launch()  ← or    │
  │    getattr(self._pw, "firefox").launch()   ← or    │
  │    getattr(self._pw, "webkit").launch()            │
  └─────────────────────────────────────────────────────┘
```

The browser setting controls which rendering engine loads pages.
Different engines have different CSS support, JS behavior, and security policies.

---

## 7. WHAT EACH CHECK DETECTS

When TesterAgent tests a page, it runs these checks:

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  CHECK                   │ WHAT IT FINDS                        │
  ├──────────────────────────┼───────────────────────────────────────┤
  │  Alt Text                │ <img> tags missing alt=""            │
  │  Heading Structure       │ Missing H1, skipped heading levels   │
  │  Form Labels             │ <input> without <label> → critical   │
  │  Color Contrast          │ Text too light to read               │
  │  Meta Description        │ Missing <meta name="description">    │
  │  Canonical URL           │ Missing <link rel="canonical">       │
  │  Page Title              │ Missing or too short <title>         │
  │  HTTPS Check             │ Page loaded over HTTP (not HTTPS)    │
  │  Load Time               │ How fast the page responds           │
  │  DOM Size                │ Too many elements (slow render)      │
  │  Console Errors          │ JavaScript errors in browser console │
  │  GDPR Cookie Consent     │ Missing cookie notice                │
  │  Password Field Security │ Password field over HTTP             │
  └──────────────────────────┴───────────────────────────────────────┘
```

---

## 8. HYGIENE SCORE FORMULA

```
  Base Score = 100

  For each defect found:
  ├── critical  → -15 points
  ├── major     → -10 points
  └── minor     →  -3 points

  Final score = max(0, min(100, base - deductions))

  Example:
  1 Form inputs missing labels (Critical)  → -15
  1 Missing H1 (Major)                     → -10
  Score = 100 - 15 - 10 = 75
```

---

## 9. DATABASE SCHEMA (What gets stored)

```
  TestRun
  ├── id (UUID)
  ├── url
  ├── status (queued | running | completed | failed)
  ├── config (JSON: browser, crawl_depth, modules)
  ├── overallScore
  ├── defectCount
  ├── totalPages
  ├── testedPages
  ├── startedAt / completedAt
  │
  ├── pages[] ──▶ Page
  │               ├── url
  │               ├── pageType (auth | dashboard | form | ...)
  │               ├── hygieneScore
  │               ├── status
  │               │
  │               ├── defects[] ──▶ Defect
  │               │               ├── type (Accessibility | SEO | Security...)
  │               │               ├── severity (critical | major | minor)
  │               │               ├── message
  │               │               └── fix
  │               │
  │               ├── complianceResults[] ──▶ ComplianceResult
  │               │               ├── standard (WCAG2.1 | GDPR | ...)
  │               │               ├── criterion
  │               │               └── description
  │               │
  │               └── performanceMetrics[] ──▶ PerformanceMetric
  │                               ├── metricName (load_time | dom_size | ...)
  │                               ├── value
  │                               └── rating (good | needs-improvement | poor)
  │
  └── user (owner of this test run)
```

---

## 10. KNOWN LIMITATIONS (Why some sites always show 1 page)

```
  LIMITATION 1: Only finds <a href> links
  ─────────────────────────────────────────
  The crawler uses: document.querySelectorAll('a[href]')
  This MISSES:
  • onClick="window.location = '/page'" 
  • React Router / Vue Router / Next.js links (client-side only)
  • Links loaded by JavaScript after page load
  • URLs in forms (action="...")
  • JavaScript fetch() navigation
  
  LIMITATION 2: Cannot crawl auth-gated pages
  ────────────────────────────────────────────
  No login credentials are provided.
  If a site redirects to a login page, the crawler stays on the login page.
  
  LIMITATION 3: Cross-domain links are ignored
  ─────────────────────────────────────────────
  If mail.google.com redirects to accounts.google.com,
  accounts.google.com is a different domain → skipped.
  
  LIMITATION 4: No JavaScript waiting
  ─────────────────────────────────────
  wait_until="commit" — the crawler doesn't wait for JS-rendered content.
  Dynamic links added by React after mount won't be found.
```

---

## 11. USE CASES FOR EACH DEPTH — REAL SCENARIOS

### Shallow (5 pages, ~15-30 seconds)

```
  USE WHEN                          EXAMPLE
  ──────────────────────────────    ─────────────────────────────────
  Every GitHub push (CI/CD)         Push to main → auto-test homepage
  Quick sanity after deploy         "Did the deploy break the login page?"
  Landing page only                 Marketing site homepage audit
  Time-boxed checks                 Need results in < 1 minute
```

### Standard (20 pages, ~1-3 minutes)

```
  USE WHEN                          EXAMPLE
  ──────────────────────────────    ─────────────────────────────────
  Weekly dev review                 Test all top-level product pages
  Pre-sprint demo check             QA before showing stakeholders
  Feature branch validation         "Test my new checkout flow"
  Regular accessibility audits      WCAG check on main user journeys
```

### Deep (100 pages, ~5-20 minutes)

```
  USE WHEN                          EXAMPLE
  ──────────────────────────────    ─────────────────────────────────
  Pre-launch audit                  Full audit before going live
  Quarterly compliance scan         GDPR + WCAG on the entire site
  Security review                   Find all exposed pages/forms
  SEO health check                  Every page's meta tags and headings
  Major version release             v2.0 launch — test everything
```

---

## 12. STARTUP COMMANDS (Quick Reference)

```bash
# Terminal 1 — Gateway (Express + DB)
cd c:\testproject\gateway
npm run dev
# Starts on: http://localhost:3000

# Terminal 2 — AI Core (Python + Playwright)  
cd c:\testproject\ai-core
python main.py
# Starts on: http://localhost:8000

# Terminal 3 — Frontend (React + Vite)
cd c:\testproject\autonomousqa-frontend
npm run dev
# Starts on: http://localhost:5173
```

### Health checks

```bash
# Is AI Core alive?
curl http://localhost:8000/health
# Expected: {"status":"ok","browser_ready":true}

# Is Gateway alive?
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

---

## 13. SUMMARY TABLE

```
  COMPONENT         FILE                              RESPONSIBILITY
  ──────────────────────────────────────────────────────────────────────
  Frontend          autonomousqa-frontend/src/        UI, forms, live view
  NewTest.jsx       pages/NewTest.jsx                 Send test config
  LiveTest.jsx      pages/LiveTest.jsx                Real-time progress
  
  Gateway           gateway/src/index.js              Express server
  Auth              middleware/auth.js                JWT validation
  Tests Route       routes/tests.js                   Create/track tests
  Progress Route    routes/tests.js (POST /progress)  Incremental updates
  testService.js    services/testService.js           Call AI Core
  WebSocket         services/websocket.js             Real-time to frontend
  
  AI Core           ai-core/main.py                   FastAPI server
  Orchestrator      orchestrator.py                   Pipeline controller
  CrawlerAgent      agents/crawler.py                 depth → max_pages
  PlaywrightTool    tools/playwright_tool.py          Real browser (BFS crawl)
  TesterAgent       agents/tester.py                   Defect detection
```

---

*AutonomousQA System Workflow — generated March 2026*
