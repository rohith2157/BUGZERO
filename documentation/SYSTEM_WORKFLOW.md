# AutonomousQA — Complete System Workflow

> Everything about how the system works: architecture, data flow, what each setting does,
> why you got the same result on all three depths, and what each component is responsible for.

---

## 1. ARCHITECTURE OVERVIEW

```
  ┌───────────────────────────────────────────────────────────────────────────────────┐
  │                           AUTONOMOUSQA SYSTEM                                    │
  │                                                                                   │
  │   USER BROWSER                          ┌─────────────────────┐                  │
  │   localhost:5173                        │   GitHub API         │                  │
  │   ┌──────────────┐                     │   api.github.com     │                  │
  │   │  React App   │ ◀─── WebSocket ──┐  │   • OAuth handshake  │                  │
  │   │  (Frontend)  │ ──── REST API ─┐ │  │   • Repo listing     │                  │
  │   └──────────────┘               │ │  │   • Commit statuses  │                  │
  │                                  │ │  └──────────┬────────────┘                  │
  │                      ┌───────────▼─┴──────────────▼──────────┐                  │
  │                      │         GATEWAY (Node.js)              │                  │
  │                      │         localhost:3000                  │                  │
  │                      │                                        │                  │
  │                      │  • Express REST API                    │                  │
  │                      │  • Socket.IO WebSocket server  ────────┘                  │
  │                      │  • Prisma ORM → SQLite DB                                 │
  │                      │  • JWT Authentication                                     │
  │                      │  • GitHub OAuth routes (/auth/github/*)                   │
  │                      │  • Test queue management                                  │
  │                      └───────────────┬────────────────────────┘                  │
  │                                      │ POST /api/test/run                        │
  │                                      │ (long-running HTTP call)                  │
  │                                      ▼                                           │
  │                      ┌────────────────────────────────────────┐                  │
  │                      │        AI CORE (Python/FastAPI)        │                  │
  │                      │        localhost:8000                  │                  │
  │                      │                                        │                  │
  │                      │  • FastAPI REST server                 │                  │
  │                      │  • Orchestrator (pipeline controller)  │                  │
  │                      │  • CrawlerAgent (link discovery)       │                  │
  │                      │  • TesterAgent (defect detection)      │                  │
  │                      │  • PlaywrightTool (real browser)       │                  │
  │                      │  • RepoManager (clone + serve)         │ ← GitHub Engine  │
  │                      │                                        │                  │
  │                      │  During test: POST /api/tests/progress │                  │
  │                      └────────────────────────────────────────┘                  │
  └───────────────────────────────────────────────────────────────────────────────────┘

  TWO TEST MODES:
  ┌──────────────────────────────┐   ┌──────────────────────────────────────────────┐
  │  URL MODE                    │   │  GITHUB REPO MODE                            │
  │                              │   │                                              │
  │  User pastes a live URL.     │   │  User connects GitHub, picks a repo.         │
  │  Crawler hits it directly.   │   │  BugZero clones it, serves it locally,       │
  │  Results: score + defects.   │   │  tests it, then posts results back to GitHub │
  │                              │   │  as a commit status on the PR.               │
  └──────────────────────────────┘   └──────────────────────────────────────────────┘
```

---

## 2. WHAT HAPPENS WHEN YOU CLICK "LAUNCH TEST"

There are two paths depending on test mode. The URL path is the default. The repo path has
an extra pre-stage before the crawl.

```
  USER CLICKS LAUNCH
         │
         ▼
  [1] FRONTEND → POST /api/tests
      URL mode:  { url: "https://app.com", config: { type:"url", browser, crawl_depth, modules } }
      Repo mode: { url: "https://github.com/owner/repo", config: { type:"repo", github_token,
                   branch: "main", browser, crawl_depth, modules } }
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
  [5] AI CORE starts pipeline
      ┌─────────────────────────────────────────────────────────────┐
      │  PRE-STAGE (repo mode only): CLONE & SERVE                  │
      │  RepoManager clones the GitHub repo (shallow --depth 1)     │
      │  Captures: commit SHA, commit message, branch, author       │
      │  Detects project type (Node / Python / static HTML)         │
      │  Starts local dev server (npm run dev), detects port        │
      │  target_url becomes http://localhost:{detected_port}         │
      │  → Posts "pending" commit status to GitHub                  │
      │                                                             │
      │  Stage 1: CRAWL                                             │
      │  PlaywrightTool opens a real browser                        │
      │  Visits target_url, finds all <a href> links (BFS)          │
      │  Returns list of discovered pages                           │
      │                                                             │
      │  Stage 2: PAGERANK + RISK SCORING                           │
      │  Scores each page by: link importance + defect history      │
      │  + change detection. Sorts pages by risk (riskiest first)   │
      │  POST /api/tests/progress { event: "crawl_complete" }       │
      │  → Gateway updates DB, emits WS event                       │
      │  → Frontend shows "X Pages Found"                           │
      │                                                             │
      │  Stage 3: TEST EACH PAGE (loop)                             │
      │  For each page in priority order:                           │
      │    a) Self-Healing  — detect & fix broken CSS selectors      │
      │    b) Basic Tests   — SEO, links, forms, performance         │
      │    c) axe-core      — WCAG 2.1 AA accessibility audit        │
      │    d) Gemini Vision — AI visual bug detection + regression   │
      │    POST /api/tests/progress { event: "page_complete" }      │
      │    → Gateway writes to DB, emits WS event                   │
      │    → Frontend shows defect in Live Feed                     │
      │                                                             │
      │  Stage 4: REPORT                                            │
      │  ReportAgent aggregates: overall score, grade, top issues   │
      └─────────────────────────────────────────────────────────────┘
         │
         ▼
  [6] AI CORE returns final TestResult JSON to Gateway
      (Includes: repo_name, branch, commit_sha, commit_message, commit_author
       when type=="repo")
         │
         ▼
  [7] GATEWAY finalizes testRun
      status → "completed", overallScore, defectCount
      Emits WebSocket: test:finished
         │
         ▼
  [8] FRONTEND shows "Test Complete"
      "View Report" button becomes active
      For repo mode: shows GitHub chip (repo + branch + commit SHA)
         │
         ▼  (repo mode only)
  [9] AI CORE posts final commit status to GitHub
      POST https://api.github.com/repos/{owner}/{repo}/statuses/{sha}
      { state: "success"/"failure", description: "Score: 91/100 · 3 defects",
        target_url: "https://bugzero.app/tests/{id}/report",
        context: "BugZero / Autonomous QA" }
      → Appears as a check on the GitHub pull request ✅
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
  NewTest.jsx       pages/NewTest.jsx                 Send test config (URL + repo mode)
  LiveTest.jsx      pages/LiveTest.jsx                Real-time progress
  History.jsx       pages/History.jsx                 Test run history (shows GitHub chip)
  Dashboard.jsx     pages/Dashboard.jsx               KPIs + recent runs

  Gateway           gateway/src/index.js              Express server
  Auth              middleware/auth.js                JWT validation
  auth.js (route)   routes/auth.js                    Login, register, GitHub OAuth
  Tests Route       routes/tests.js                   Create/track tests
  Progress Route    routes/tests.js (POST /progress)  Incremental updates
  testService.js    services/testService.js           Call AI Core
  WebSocket         services/websocket.js             Real-time to frontend

  AI Core           ai-core/main.py                   FastAPI server
  Orchestrator      orchestrator.py                   Pipeline controller
  RepoManager       utils/repo_server.py              Clone, serve, capture commit info
  CrawlerAgent      agents/crawler.py                 BFS page discovery
  PlaywrightTool    tools/playwright_tool.py          Real browser (crawl + test)
  TesterAgent       agents/tester.py                  Defect detection
  VisionAgent       agents/vision_agent.py            Gemini visual bug detection
  SelfHealingAgent  agents/self_healing_agent.py      CSS selector repair
  ReportAgent       agents/report_agent.py            Score aggregation + compliance report
  axe-core          tools/axe_tool.py                 WCAG 2.1 AA accessibility audit

  External          github.com/login/oauth            GitHub OAuth provider
  External          api.github.com/user/repos         Repository listing
  External          api.github.com/repos/.../statuses Commit status checks (CI gate)
```

---

## 14. GITHUB OAUTH — HOW THE CONNECTION WORKS

The GitHub connection is a one-time setup per user. Once linked, the OAuth token is stored
in the database and reused for all future repo tests and repo listing.

```
  User in NewTest → clicks "GitHub Repository" tab → no repos shown yet
         │
         ▼
  User clicks "Connect GitHub"
         │
         ▼
  [1] Frontend redirects to:
      GET /api/auth/github?token={user JWT}
         │
         ▼
  [2] Gateway decodes JWT → finds userId
      Builds state = base64({ action:"link", userId, redirect:"/tests/new" })
      Redirects to GitHub:
      https://github.com/login/oauth/authorize
        ?client_id=GITHUB_CLIENT_ID
        &redirect_uri=http://localhost:3000/api/auth/github/callback
        &scope=repo,user:email
        &state={base64state}
         │
         ▼
  [3] User sees GitHub's "Authorize BugZero" page → clicks Authorize
         │
         ▼
  [4] GitHub calls:
      GET /api/auth/github/callback?code=TEMP_CODE&state=SAME_STATE
         │
         ▼
  [5] Gateway exchanges code for real token:
      POST https://github.com/login/oauth/access_token
        { client_id, client_secret, code, redirect_uri }
      GitHub returns: { access_token: "gho_..." }
         │
         ▼
  [6] Gateway saves the token:
      prisma.user.update({ where: { id: userId },
                           data: { githubAccessToken: "gho_..." } })
         │
         ▼
  [7] Gateway redirects user to:
      http://localhost:5173/tests/new?github=linked
         │
         ▼
  [8] Frontend detects ?github=linked
      useEffect re-fetches repos → GET /api/auth/github/repos
      Repo list appears in the dropdown ✅
```

### OAuth scope: what "repo,user:email" means

```
  repo        → Read/write access to public AND private repositories
                Also grants: clone private repos via the token URL
                Also grants: post commit status checks
  user:email  → Read the user's email address (used for account creation)
```

### Required environment variables

```
  # gateway/.env
  GITHUB_CLIENT_ID=your_oauth_app_client_id
  GITHUB_CLIENT_SECRET=your_oauth_app_client_secret
  GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

  ⚠️  GITHUB_CALLBACK_URL must exactly match what is registered in:
      github.com → Settings → Developer Settings → OAuth Apps → your app
      → Authorization callback URL

  A single character difference causes GitHub to reject the callback
  with "redirect_uri mismatch" — the #1 cause of OAuth failures.
```

### Gateway routes for GitHub

```
  GET  /api/auth/github              Initiates OAuth → redirects to GitHub
  GET  /api/auth/github/callback     Receives code → exchanges for token → saves to DB
  GET  /api/auth/github/repos        Returns user's repo list (sorted by updated)
  GET  /api/auth/github/profile      Returns GitHub username, avatar, public repo count
  DELETE /api/auth/github            Disconnects (sets githubAccessToken = null in DB)
```

---

## 15. GITHUB REPO ENGINE — CLONE, DETECT, SERVE

This is the stage that runs before the normal crawl pipeline when `config.type === "repo"`.
All logic lives in `ai-core/utils/repo_server.py` (RepoManager class).

### Step 1 — Inject token into clone URL

```
  Original URL:   https://github.com/acme/my-app
  Auth URL:       https://x-access-token:{token}@github.com/acme/my-app

  For public repos with no token → original URL used as-is (no auth needed)
```

### Step 2 — Shallow clone

```bash
  git clone --depth 1 {auth_url} .
  # --depth 1 = only the latest commit, not full git history
  # Much faster for large repos (5-10x)

  # If a branch was specified:
  git clone --depth 1 --branch feature/login-redesign {auth_url} .
```

### Step 3 — Capture commit metadata (needs to be built)

```bash
  git log -1 --format="%H|%s|%aN"
  # Returns: abc123def456|fix: resolve login redirect loop|Jane Dev

  git rev-parse --abbrev-ref HEAD
  # Returns: feature/login-redesign
```

This data is stored on the TestResult and shown in the UI.

### Step 4 — Detect project type

```
  File found              Action
  ──────────────────────  ─────────────────────────────────────────────
  package.json            Node project → npm ci (or npm install) then npm run dev
  package.json (no dev)   Node project → npm start
  index.html only         Static site → python -m http.server {port}
  requirements.txt        Python project → pip install -r requirements.txt (future)
  go.mod                  Go project → go run . (future)
```

### Step 5 — Start the dev server

```
  env PORT={free_port} BROWSER=none npm run dev

  Server startup logs are read line by line looking for:
    http://localhost:5173
    http://127.0.0.1:3001
    http://0.0.0.0:8080

  When the URL is found → wait 2 more seconds for full warm-up → move on
  If no URL found in 15 seconds → assume PORT env var was respected → continue
```

### Step 6 — Hand off to the normal pipeline

```
  target_url = "http://localhost:{detected_port}"

  The orchestrator continues with Stage 1 (BFS Crawl) using this local URL.
  From this point, repo mode and URL mode are identical.
```

### Step 7 — Cleanup (always runs in finally)

```
  server_process.terminate()             → kills npm run dev
  shutil.rmtree(temp_dir, ignore_errors=True)  → deletes cloned files
```

---

## 16. GITHUB RESULTS ENRICHMENT

Currently the TestResult only stores `url` (the GitHub repo URL) and score/defect data.
The following fields need to be added to carry GitHub-specific context through the pipeline.

### Fields to add to TestResult schema

```python
  repo_name: str | None        # "acme/my-frontend-app"
  repo_url: str | None         # "https://github.com/acme/my-frontend-app"
  branch: str | None           # "feature/login-redesign"
  commit_sha: str | None       # "abc123def456789abc123def456789abc123def4"
  commit_sha_short: str | None # "abc123d"  (first 7 chars)
  commit_message: str | None   # "fix: resolve login redirect loop"
  commit_author: str | None    # "Jane Dev"
```

### Where they appear in the UI

```
  History page — test run row:
  Before:  https://github.com/acme/my-app
  After:   🐙 acme/my-app   feature/login-redesign   abc123d

  Dashboard — recent runs:
  Before:  github.com/acme/my-app (monospace, truncated)
  After:   [GitHub icon] acme/my-app  ·  abc123d

  Test Report header:
  Repository:  acme/my-frontend-app
  Branch:      feature/login-redesign
  Commit:      abc123d — "fix: resolve login redirect loop"
  Author:      Jane Dev
  [View on GitHub →]  links to github.com/acme/my-app/commit/abc123def456
```

### How to identify repo-mode runs in the frontend

```javascript
  // In History.jsx and Dashboard.jsx, check the config stored on the run:
  if (run.config?.type === 'repo') {
    // render GitHub chip with repo_name + branch + commit_sha_short
  } else {
    // render raw URL as before
  }
```

---

## 17. GITHUB COMMIT STATUS API — CI GATE

This is how BugZero results appear directly on GitHub pull requests.
No extra setup needed from users — the OAuth token already has the right scope.

### What the developer sees on GitHub

```
  Pull Request: feature/login-redesign → main

  Checks:
  ✅ BugZero / Autonomous QA — Passed · Score 91/100 · 3 defects   Details →
  ❌ BugZero / Autonomous QA — Failed · Score 58/100 · 12 critical  Details →
  ⏳ BugZero / Autonomous QA — Running...                           Details →
```

Clicking "Details" opens the full BugZero report for that test run.

### API call — post status at test start (pending)

```
  POST https://api.github.com/repos/{owner}/{repo}/statuses/{commit_sha}
  Authorization: token {githubAccessToken}
  Content-Type: application/json

  {
    "state": "pending",
    "description": "BugZero is running autonomous QA...",
    "context": "BugZero / Autonomous QA",
    "target_url": "https://bugzero.app/tests/{run_id}"
  }
```

### API call — post status at test end (pass/fail)

```
  POST https://api.github.com/repos/{owner}/{repo}/statuses/{commit_sha}
  Authorization: token {githubAccessToken}
  Content-Type: application/json

  {
    "state": "success",       ← or "failure" or "error"
    "description": "Score: 91/100 · 3 defects found",
    "context": "BugZero / Autonomous QA",
    "target_url": "https://bugzero.app/tests/{run_id}/report"
  }
```

### State mapping

```
  score >= 80 AND no critical defects  →  "success"
  score >= 60 OR only minor defects    →  "failure"  (soft fail)
  score <  60 OR any critical defect   →  "failure"  (hard fail)
  test errored out                     →  "error"
```

### How to extract owner/repo from the GitHub URL

```python
  # repo_url = "https://github.com/acme/my-frontend-app"
  parts = repo_url.rstrip('/').split('/')  # ['https:', '', 'github.com', 'acme', 'my-frontend-app']
  owner = parts[-2]   # "acme"
  repo  = parts[-1]   # "my-frontend-app"
```

---

## 18. WHAT TO BUILD NEXT — GITHUB ENGINE PRIORITY ORDER

```
  PRIORITY  WHAT                                       WHERE
  ────────  ─────────────────────────────────────────  ──────────────────────────────────
  1         Capture commit SHA/message/branch/author   repo_server.py → git log + rev-parse
  2         Attach metadata to TestResult schema       models/schemas.py + orchestrator.py
  3         Store it in DB (TestRun table)             gateway prisma schema migration
  4         Show GitHub chip in History + Dashboard    History.jsx + Dashboard.jsx
  5         Show commit context in Report header       test report page
  6         Post "pending" status at test start        orchestrator.py (pre-pipeline)
  7         Post "success"/"failure" at test end       orchestrator.py (post-report)
  8         Branch selector in NewTest                 NewTest.jsx + new gateway route
  9         Webhook endpoint for push auto-trigger     gateway routes/webhooks.js (new)
```

Items 1–7 are **GitHub Engine V1** — dramatically more useful with minimal new complexity.
Items 8–9 are **V2** — the full CI gate / always-on mode.

---

*AutonomousQA System Workflow — updated July 2026 (GitHub Engine additions)*
