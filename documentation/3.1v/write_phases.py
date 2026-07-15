
# This script writes the detailed 15-phase implementation plan.
# Run: python write_phases.py

import os

out = os.path.join(os.path.dirname(__file__), "IMPLEMENTATION_PHASES.txt")

lines = []
def s(t=""):
    lines.append(t)

s("=" * 68)
s("  AUTONOMOUSQA v3.1 -- GOD-MODE ENGINE")
s("  15-PHASE DETAILED IMPLEMENTATION PLAN")
s()
s("  Based on: God-Mode Technical Roadmap (3.1v/) + Premium Roadmap")
s("             + 100percent_algo.md + Full Codebase Audit (July 2026)")
s("  Stack:")
s("    Frontend : React 18 + Vite  (autonomousqa-frontend/src/)")
s("    Gateway  : Node.js + Express + Prisma + SQLite (gateway/)")
s("    AI Core  : Python 3.11 + FastAPI + Playwright (ai-core/)")
s("  Status   : Phase 1 COMPLETE. Phases 2-15 pending.")
s("=" * 68)
s()
s()
s("=" * 68)
s("WHAT ALREADY EXISTS (DO NOT REBUILD)")
s("=" * 68)
s()
s("  AI Core (ai-core/)")
s("  " + "-" * 50)
s("  orchestrator.py           Full pipeline controller (457 lines)")
s("  agents/crawler.py         BFS page discovery using Playwright")
s("  agents/tester.py          DOM checks: SEO, forms, links, security, GDPR")
s("  agents/scheduler.py       PageRank + defect history + risk scoring")
s("  agents/self_healing_agent.py  Levenshtein + Pythagorean fuzzy heal (v2.0)")
s("  agents/vision_agent.py    Pillow pixel-math visual regression (v2.0)")
s("  agents/report_agent.py    Score aggregation + WCAG/GDPR report")
s("  agents/auth_agent.py      Auth navigator (stub -- Phase 12 completes it)")
s("  agents/chaos_agent.py     Network throttle stub (Phase 11 wires it)")
s("  tools/playwright_tool.py  Real browser wrapper")
s("  tools/axe_tool.py         axe-core WCAG 2.1 AA injection")
s("  utils/repo_server.py      RepoManager: clone + detect + serve")
s("  models/schemas.py         Pydantic models for all request/response types")
s()
s("  Gateway (gateway/)")
s("  " + "-" * 50)
s("  src/index.js              Express server, Socket.IO, rate limiter")
s("  src/routes/auth.js        Login, register, GitHub OAuth (partial)")
s("  src/routes/tests.js       Create/track test runs, progress updates")
s("  src/routes/playbooks.js   Auth playbooks CRUD (not wired to AuthAgent)")
s("  src/routes/settings.js    User settings (no API key or GitHub panel yet)")
s("  src/routes/baselines.js   Screenshot baseline storage")
s("  src/services/testService.js  Calls AI Core, handles WebSocket events")
s("  src/services/websocket.js    Socket.IO room management")
s()
s("  Frontend (autonomousqa-frontend/src/)")
s("  " + "-" * 50)
s("  pages/Landing.jsx         Public landing page")
s("  pages/Login.jsx           Auth page (JWT)")
s("  pages/Dashboard.jsx       KPI cards + recent runs")
s("  pages/NewTest.jsx         Start test (URL mode works; repo mode partial)")
s("  pages/LiveTest.jsx        Real-time test progress via WebSocket")
s("  pages/Report.jsx          Full test report (no healing events shown yet)")
s("  pages/History.jsx         All past runs (no GitHub chip yet)")
s("  pages/Compliance.jsx      WCAG/GDPR violation detail")
s("  pages/Performance.jsx     Core Web Vitals charts")
s("  pages/Settings.jsx        User settings (no GitHub panel or API keys)")
s("  pages/Playbooks.jsx       Auth playbook management")
s()
s()
s("=" * 68)
s("DEPENDENCY MAP")
s("=" * 68)
s()
s("  Phase 1 --> Phase 2 --> Phase 3 --> Phase 4")
s("                                          |")
s("                          +---------------+---------------+")
s("                          |               |               |")
s("                      Phase 5         Phase 7         Phase 9")
s("                      (UI chip)       (CI pending)    (branch)")
s("                          |               |")
s("                      Phase 6         Phase 8")
s("                      (report)        (CI final)")
s()
s("  Phase 10  standalone  (bounding box engine)")
s("  Phase 11  standalone  (chaos agent)")
s("  Phase 12  standalone  (auth playbooks)")
s("  Phase 13  needs Phase 3 done (healing events in response)")
s("  Phase 14  needs Phase 9 done (profile route)")
s("  Phase 15  needs all prior phases working end to end")
s()
s()

phases = [
    {
        "n": 1, "title": "Commit Metadata Capture -- Git Engine Core",
        "status": "COMPLETE",
        "files": ["ai-core/utils/repo_server.py"],
        "body": """
WHAT WAS BUILT:
  Added 5 instance fields to RepoManager.__init__:
    self.commit_sha         (str | None)
    self.commit_sha_short   (str | None)   -- first 7 chars of SHA
    self.commit_message     (str | None)
    self.commit_author      (str | None)
    self.branch             (str | None)

  clone() now accepts optional branch: str | None = None
    With branch:    git clone --depth 1 --branch {branch} {url} .
    Without branch: git clone --depth 1 {url} .

  New private _capture_commit_metadata() called after clone succeeds:
    git log -1 --pretty=format:"%H|%s|%an"
    --> splits on "|" to get sha, subject, author name
    git rev-parse --abbrev-ref HEAD
    --> gets branch name
    Wrapped in try/except: fully non-fatal, logs warning on failure.

HOW TO VERIFY:
  from utils.repo_server import RepoManager
  rm = RepoManager("https://github.com/any/public-repo", "")
  rm.clone()
  print(rm.commit_sha)        # 40-char SHA
  print(rm.commit_sha_short)  # first 7 chars
  print(rm.branch)            # e.g. "main"
  print(rm.commit_message)    # e.g. "fix: resolve login redirect"
"""
    },
    {
        "n": 2, "title": "TestResult Schema + DB -- Add GitHub Fields",
        "status": "PENDING",
        "files": ["ai-core/models/schemas.py", "gateway/prisma/schema.prisma"],
        "body": """
STEP A -- ai-core/models/schemas.py

  In TestConfig add 3 new Optional fields:
    type: str = "url"              # "url" or "repo"
    github_token: Optional[str] = None
    branch: Optional[str] = None

  In TestResult add 7 new Optional fields:
    repo_name: Optional[str] = None       # "owner/repo-name"
    repo_url: Optional[str] = None        # full github URL
    branch: Optional[str] = None
    commit_sha: Optional[str] = None      # full 40-char SHA
    commit_sha_short: Optional[str] = None  # 7-char short SHA
    commit_message: Optional[str] = None
    commit_author: Optional[str] = None

  Also fix stale comment on PageResult.vision_quality_score:
    Before: # Stage 4: Gemini visual score
    After:  # Stage 4: Algorithmic visual score (Pillow, v2.0)

STEP B -- gateway/prisma/schema.prisma

  In model TestRun, add 7 nullable fields:
    repoName       String?
    repoUrl        String?
    branch         String?
    commitSha      String?
    commitShaShort String?
    commitMessage  String?
    commitAuthor   String?

STEP C -- Run migration:
  cd gateway
  npx prisma migrate dev --name add_github_fields

HOW TO VERIFY:
  npx prisma studio
  Open TestRun table.
  Confirm 7 new columns exist, all nullable.
  Existing rows should have NULL in all new columns (no data loss).
"""
    },
    {
        "n": 3, "title": "Orchestrator -- Wire Repo Metadata Through Pipeline",
        "status": "PENDING",
        "files": ["ai-core/orchestrator.py"],
        "body": """
WHAT TO FIND in orchestrator.py:
  The repo-mode pre-stage block (around line 100-150) that does:
    repo_manager = RepoManager(url, config.github_token)
    cloned = repo_manager.clone()
    target_url = await repo_manager.start_server()

WHAT TO ADD after clone() succeeds:
  # Extract owner/repo from URL
  repo_parts = request.url.rstrip('/').rstrip('.git').split('/')
  repo_name  = repo_parts[-2] + '/' + repo_parts[-1] if len(repo_parts) >= 2 else None

WHAT TO ADD after the full pipeline returns and before final TestResult:
  if config.type == "repo" and repo_manager:
      result.repo_name        = repo_name
      result.repo_url         = request.url
      result.branch           = repo_manager.branch
      result.commit_sha       = repo_manager.commit_sha
      result.commit_sha_short = repo_manager.commit_sha_short
      result.commit_message   = repo_manager.commit_message
      result.commit_author    = repo_manager.commit_author

ALSO FIX the docstring at the top of orchestrator.py (line 11):
  Before: "d. Gemini Vision (AI visual bug detection + regression diff)"
  After:  "d. Algo Vision  (Pillow pixel-math visual regression, v2.0, no LLM)"

HOW TO VERIFY:
  Start AI Core: python main.py
  POST /api/test/run with:
    { "run_id": "test-123", "url": "https://github.com/owner/repo",
      "config": { "type": "repo", "github_token": "gho_xxx" } }
  Response JSON should contain:
    repo_name, branch, commit_sha, commit_sha_short, commit_message, commit_author
"""
    },
    {
        "n": 4, "title": "Gateway -- Save and Expose GitHub Metadata",
        "status": "PENDING",
        "files": ["gateway/src/services/testService.js",
                  "gateway/src/routes/tests.js",
                  "gateway/src/routes/auth.js"],
        "body": """
STEP A -- testService.js
  Find the function that calls prisma.testRun.update() with status: "completed"
  Add these fields to the data object:
    repoName:       aiResult.repo_name        ?? null,
    repoUrl:        aiResult.repo_url         ?? null,
    branch:         aiResult.branch           ?? null,
    commitSha:      aiResult.commit_sha       ?? null,
    commitShaShort: aiResult.commit_sha_short ?? null,
    commitMessage:  aiResult.commit_message   ?? null,
    commitAuthor:   aiResult.commit_author    ?? null,

STEP B -- tests.js
  In GET /api/tests (list) and GET /api/tests/:id (single):
  Make sure Prisma select includes the 7 new fields OR they are already
  included via a wildcard select. Check that they are not stripped in the
  response mapping. They should appear in the JSON sent to the frontend.

STEP C -- auth.js GitHub repos endpoint
  In GET /api/auth/github/repos, the GitHub API already returns default_branch.
  Make sure this is included in the mapped response:
    repos.map(r => ({
      id:             r.id,
      name:           r.name,
      full_name:      r.full_name,
      private:        r.private,
      default_branch: r.default_branch,    // <-- ADD THIS if missing
      updated_at:     r.updated_at,
      description:    r.description,
    }))

HOW TO VERIFY:
  Run a full repo-mode test end to end.
  GET /api/tests (with Authorization header)
  Find the completed run in the response.
  Verify: commitSha, branch, repoName are non-null in the JSON.
  URL-mode runs should have these fields as null.
"""
    },
    {
        "n": 5, "title": "Frontend -- GitHub Chip in History + Dashboard",
        "status": "PENDING",
        "files": ["src/components/ui/GitHubChip.jsx (NEW)",
                  "src/pages/History.jsx",
                  "src/pages/Dashboard.jsx"],
        "body": """
STEP A -- Create GitHubChip.jsx (~60 lines)

  Props:
    repoName      -- "owner/my-app"
    branch        -- "feature/login"
    commitSha     -- full 40-char (for link)
    commitShaShort -- "abc123d" (displayed)
    repoUrl       -- full github repo URL

  Visual layout (horizontal flex):
    [GitHub SVG icon]  [owner/repo]  [branch badge]  [sha pill -> link]

  SHA pill: monospace font, dark background, 7 chars, links to:
    https://github.com/{repoName}/commit/{commitSha}

  Branch badge: subtle rounded badge, secondary color

  Styling: use existing CSS variables from index.css.
           Keep it compact -- should fit in a table row cell.

STEP B -- History.jsx
  In the run list row, find where run.url is displayed.
  Replace with:
    {run.commitSha
      ? <GitHubChip repoName={run.repoName} branch={run.branch}
                    commitSha={run.commitSha} commitShaShort={run.commitShaShort}
                    repoUrl={run.repoUrl} />
      : <span class="url-display">{run.url}</span>
    }

STEP C -- Dashboard.jsx
  Same pattern in the "Recent Runs" section.
  URL-mode runs still show the URL unchanged.

HOW TO VERIFY:
  Create a test run with commitSha set in DB (or run a real repo test).
  Open /history -- see GitHub chip: icon + owner/repo + branch + 7-char SHA.
  Click the SHA pill -- should open github.com/owner/repo/commit/abc123...
  URL-mode run in same list -- shows raw URL as before. No regression.
"""
    },
    {
        "n": 6, "title": "Frontend -- GitHub Commit Context in Report Header",
        "status": "PENDING",
        "files": ["src/pages/Report.jsx"],
        "body": """
WHAT TO FIND in Report.jsx:
  The header section that shows the tested URL (usually an <h2> or <p>).

WHAT TO ADD (conditionally, only when testRun.commitSha is present):

  <div class="commit-context-card">
    <div class="commit-context-row">
      <span class="label">Repository</span>
      <a href={testRun.repoUrl} target="_blank">{testRun.repoName}</a>
    </div>
    <div class="commit-context-row">
      <span class="label">Branch</span>
      <span class="branch-badge">{testRun.branch}</span>
    </div>
    <div class="commit-context-row">
      <span class="label">Commit</span>
      <code class="sha">{testRun.commitShaShort}</code>
      <span class="commit-msg">-- "{testRun.commitMessage}"</span>
    </div>
    <div class="commit-context-row">
      <span class="label">Author</span>
      <span>{testRun.commitAuthor}</span>
    </div>
    <a href={commitUrl} target="_blank" class="view-on-github">
      View on GitHub ->
    </a>
  </div>

  commitUrl = https://github.com/{repoName}/commit/{commitSha}

  If no commitSha: render nothing. Show URL as before.

HOW TO VERIFY:
  Open a report for a repo-mode run.
  Commit context card appears at top with all 4 fields + link.
  Open a report for url-mode run. No card. Normal URL shows.
"""
    },
    {
        "n": 7, "title": "GitHub Commit Status API -- pending (CI Gate starts)",
        "status": "PENDING",
        "files": ["ai-core/utils/github_status.py (NEW)",
                  "ai-core/orchestrator.py"],
        "body": """
STEP A -- Create ai-core/utils/github_status.py (~40 lines)

  import httpx, logging
  logger = logging.getLogger(__name__)

  GITHUB_STATUS_URL = "https://api.github.com/repos/{owner}/{repo}/statuses/{sha}"
  CONTEXT_NAME = "BugZero / Autonomous QA"

  async def post_commit_status(
      owner: str, repo: str, sha: str, state: str,
      description: str, run_id: str, token: str,
      frontend_url: str = "http://localhost:5173"
  ) -> None:
      url = GITHUB_STATUS_URL.format(owner=owner, repo=repo, sha=sha)
      payload = {
          "state": state,
          "description": description[:140],   # GitHub max 140 chars
          "context": CONTEXT_NAME,
          "target_url": f"{frontend_url}/tests/{run_id}/report",
      }
      headers = {
          "Authorization": f"token {token}",
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
      }
      try:
          async with httpx.AsyncClient(timeout=10.0) as client:
              resp = await client.post(url, json=payload, headers=headers)
              if resp.status_code == 201:
                  logger.info(f"GitHub status '{state}' posted: {owner}/{repo}@{sha[:7]}")
              else:
                  logger.warning(f"GitHub status returned {resp.status_code}: {resp.text[:200]}")
      except Exception as e:
          logger.warning(f"GitHub commit status failed (non-fatal): {e}")

STEP B -- orchestrator.py: after clone and metadata capture

  from utils.github_status import post_commit_status

  if config.type == "repo" and repo_manager.commit_sha and config.github_token:
      parts = request.url.rstrip('/').rstrip('.git').split('/')
      if len(parts) >= 2:
          gh_owner = parts[-2]
          gh_repo  = parts[-1]
          await post_commit_status(
              owner=gh_owner, repo=gh_repo,
              sha=repo_manager.commit_sha,
              state="pending",
              description="BugZero Autonomous QA is running...",
              run_id=request.run_id,
              token=config.github_token,
          )

HOW TO VERIFY:
  Own a GitHub repo. Push a commit.
  Run a repo-mode test against it.
  Go to GitHub -> commit -> should see a yellow circle "pending" check
  labelled "BugZero / Autonomous QA".
"""
    },
    {
        "n": 8, "title": "GitHub Commit Status API -- success/failure (CI Gate ends)",
        "status": "PENDING",
        "files": ["ai-core/orchestrator.py"],
        "body": """
WHERE IN orchestrator.py:
  After ReportAgent generates the site report and overall_score is known.
  Before the final TestResult is returned.

WHAT TO ADD:

  if config.type == "repo" and repo_manager and repo_manager.commit_sha:
      critical_count = sum(
          1 for p in result.pages
          for d in p.defects if d.severity == "critical"
      )
      has_criticals = critical_count > 0
      score = result.overall_score or 0

      if score >= 70 and not has_criticals:
          final_state = "success"
      else:
          final_state = "failure"

      n_defects = result.total_defects
      desc = f"Score: {score:.0f}/100 - {n_defects} defects"
      await post_commit_status(
          owner=gh_owner, repo=gh_repo,
          sha=repo_manager.commit_sha,
          state=final_state,
          description=desc,
          run_id=request.run_id,
          token=config.github_token,
      )

NOTE: gh_owner and gh_repo must be in scope here.
Move their extraction to the top of the repo-mode block in Phase 3
so both Phases 7 and 8 can use them.

STATE DECISION TABLE:
  score >= 70 AND no criticals  -->  "success"   (green check on PR)
  score >= 60 but has criticals -->  "failure"   (red X on PR)
  score < 60                    -->  "failure"   (red X on PR)
  orchestrator crashed          -->  "error"     (wrap in outer try/except)

HOW TO VERIFY:
  Run repo-mode test to completion.
  GitHub PR/commit shows green checkmark OR red X.
  Description: "Score: 91/100 - 3 defects"
  Clicking "Details" opens the BugZero report at /tests/{id}/report.
"""
    },
    {
        "n": 9, "title": "Branch Selector in NewTest",
        "status": "PENDING",
        "files": ["gateway/src/routes/auth.js",
                  "src/pages/NewTest.jsx",
                  "src/lib/api.js"],
        "body": """
STEP A -- gateway/src/routes/auth.js: new branch endpoint

  router.get('/github/repos/:owner/:repo/branches', authenticate, async (req, res) => {
    const { owner, repo } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.githubAccessToken) {
      return res.status(401).json({ error: 'GitHub not connected' });
    }
    const ghRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      { headers: { Authorization: `token ${user.githubAccessToken}` } }
    );
    if (!ghRes.ok) {
      return res.status(ghRes.status).json({ error: 'GitHub API error' });
    }
    const data = await ghRes.json();
    res.json(data.map(b => ({ name: b.name, sha: b.commit.sha })));
  });

STEP B -- src/lib/api.js: add helper function

  export const getRepoBranches = (owner, repo) =>
    api.get(`/auth/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`);

STEP C -- src/pages/NewTest.jsx: branch dropdown

  State additions:
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

  When user selects a repo from the repo dropdown:
    const [owner, repoName] = selectedRepo.full_name.split('/');
    const { data } = await getRepoBranches(owner, repoName);
    setBranches(data);
    setSelectedBranch(selectedRepo.default_branch);

  Render (below repo picker, only when repo is selected):
    <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
      {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
    </select>

  Include in POST /api/tests payload:
    config: {
      type: 'repo',
      github_token: ...,
      branch: selectedBranch,    // <-- NEW
    }

HOW TO VERIFY:
  Open /tests/new, connect GitHub, select a repo.
  Branch dropdown appears and shows all real branches.
  Select a feature branch. Start test.
  AI core logs should show: git clone --branch feature/xyz
"""
    },
    {
        "n": 10, "title": "Bounding Box Overlap Engine (Algorithmic Visual v2)",
        "status": "PENDING",
        "files": ["ai-core/tools/playwright_tool.py",
                  "ai-core/agents/vision_agent.py",
                  "ai-core/agents/tester.py"],
        "body": """
ALGORITHM (from 100percent_algo.md Section 7):
  Two rectangles R1(x1,y1,x2,y2) and R2(x3,y3,x4,y4) overlap iff:
    NOT (x2 < x3 OR x1 > x4 OR y2 < y3 OR y1 > y4)

STEP A -- playwright_tool.py: add get_bounding_boxes(page)

  async def get_bounding_boxes(self, page) -> list[dict]:
      return await page.evaluate("""() => {
          const sel = 'a,button,input,select,textarea,h1,h2,h3,p,label,img';
          return Array.from(document.querySelectorAll(sel)).map(el => {
              const r = el.getBoundingClientRect();
              const s = window.getComputedStyle(el);
              return {
                  tag: el.tagName.toLowerCase(),
                  text: (el.textContent||'').trim().slice(0,50),
                  x1: r.left, y1: r.top,
                  x2: r.right, y2: r.bottom,
                  zIndex: parseInt(s.zIndex) || 0,
                  visible: r.width > 0 && r.height > 0,
              };
          }).filter(el => el.visible && el.x2 > el.x1 && el.y2 > el.y1);
      }""")

STEP B -- vision_agent.py: add check_bounding_box_overlaps(elements)

  def check_bounding_box_overlaps(self, elements: list[dict]) -> list[dict]:
      """O(N^2) rectangle intersection. ponytail: fine for < 500 elements.
      Upgrade to rtree library if element count routinely exceeds 500."""
      defects = []
      for i, a in enumerate(elements):
          for b in elements[i+1:]:
              if abs(a['zIndex'] - b['zIndex']) > 0:
                  continue   # valid stacking context, not an overlap bug
              overlaps = not (a['x2'] < b['x1'] or a['x1'] > b['x2'] or
                              a['y2'] < b['y1'] or a['y1'] > b['y2'])
              if overlaps:
                  defects.append({
                      "type": "Visual",
                      "severity": "minor",
                      "message": (f"Overlapping elements: <{a['tag']}> "
                                  f"'{a['text'][:25]}' overlaps <{b['tag']}> "
                                  f"'{b['text'][:25]}'"),
                      "fix": "Check CSS z-index, position, overflow. Elements must not overlap.",
                      "source": "bounding_box_engine",
                      "confidence": 1.0,
                  })
      return defects

STEP C -- tester.py: wire it in
  After basic tests run on a page:
    boxes = await playwright_tool.get_bounding_boxes(page)
    overlap_defects = vision_agent.check_bounding_box_overlaps(boxes)
    defects.extend(overlap_defects)

HOW TO VERIFY:
  Create test.html with two overlapping <div> elements:
    <div style="position:absolute;left:0;top:0;width:200px;height:50px">A</div>
    <div style="position:absolute;left:100px;top:0;width:200px;height:50px">B</div>
  Serve with python -m http.server 9999
  Run test against http://localhost:9999/test.html
  Report should contain "Overlapping elements" defect.
"""
    },
    {
        "n": 11, "title": "ChaosAgent -- Real Network Throttling + Perf Regression",
        "status": "PENDING",
        "files": ["ai-core/agents/chaos_agent.py",
                  "ai-core/orchestrator.py"],
        "body": """
THROTTLE PROFILES (values in bytes/sec and ms):
  3g:       download=93750,  upload=31250,  latency=300ms
  slow_3g:  download=62500,  upload=20833,  latency=400ms
  fast_3g:  download=187500, upload=62500,  latency=150ms

STEP A -- chaos_agent.py: implement real CDP throttling

  THROTTLE_PROFILES = {
      "3g":      {"downloadThroughput": 93750,  "uploadThroughput": 31250,  "latency": 300},
      "slow_3g": {"downloadThroughput": 62500,  "uploadThroughput": 20833,  "latency": 400},
      "fast_3g": {"downloadThroughput": 187500, "uploadThroughput": 62500,  "latency": 150},
  }

  async def apply_throttle(self, page, profile: str = "3g"):
      cdp = await page.context.new_cdp_session(page)
      await cdp.send("Network.enable")
      p = THROTTLE_PROFILES[profile]
      await cdp.send("Network.emulateNetworkConditions", {
          "offline": False,
          "latency": p["latency"],
          "downloadThroughput": p["downloadThroughput"],
          "uploadThroughput": p["uploadThroughput"],
      })
      self._cdp_session = cdp

  async def remove_throttle(self):
      if self._cdp_session:
          await self._cdp_session.send("Network.emulateNetworkConditions", {
              "offline": False, "latency": 0,
              "downloadThroughput": -1, "uploadThroughput": -1,
          })

  async def measure_web_vitals(self, page) -> dict:
      return await page.evaluate("""() => {
          const nav = performance.getEntriesByType('navigation')[0] || {};
          const fcp = performance.getEntriesByName('first-contentful-paint')[0];
          return {
              ttfb:      nav.responseStart - nav.requestStart,
              fcp:       fcp ? fcp.startTime : null,
              dom_load:  nav.domContentLoadedEventEnd - nav.startTime,
              page_load: nav.loadEventEnd - nav.startTime,
          };
      }""")

STEP B -- orchestrator.py: wire chaos_mode

  When config.chaos_mode == True:
    Before testing each page:
      await chaos_agent.apply_throttle(page, "3g")
    After testing each page:
      vitals = await chaos_agent.measure_web_vitals(page)
      # Compare against baseline (first run stores baseline)
      # If any metric degrades > 20%: add Performance Regression defect
      await chaos_agent.remove_throttle()

HOW TO VERIFY:
  POST test with config.chaos_mode = true
  Logs show "Applied 3g throttling" before each page.
  Performance metrics in report show slower load times.
  Run twice: second run report flags regression if metrics degraded.
"""
    },
    {
        "n": 12, "title": "Auth Playbooks -- Real Form-Based Auth Navigation",
        "status": "PENDING",
        "files": ["ai-core/agents/auth_agent.py",
                  "gateway/src/routes/playbooks.js",
                  "gateway/prisma/schema.prisma"],
        "body": """
CURRENT GAP:
  auth_agent.py has a class but login logic is incomplete or stubbed.
  Without real auth, auth-gated apps show only the login page to the crawler.
  This means 90% of a real app's pages are never tested.

STEP A -- auth_agent.py: full form-based login

  async def login(self, page, playbook: dict) -> bool:
      url      = playbook['url']
      username = playbook['username']
      password = playbook['password']

      await page.goto(url, wait_until='networkidle')

      email_sel = await self._find_field(page, [
          'input[type=email]', 'input[name=email]',
          'input[name=username]', 'input[type=text]'
      ])
      pass_sel = await self._find_field(page, ['input[type=password]'])

      if not email_sel or not pass_sel:
          logger.warning("Login form fields not detected")
          return False

      await page.fill(email_sel, username)
      await page.fill(pass_sel, password)
      await page.keyboard.press('Enter')

      try:
          await page.wait_for_load_state('networkidle', timeout=10000)
      except Exception:
          pass

      current_url = page.url
      still_form  = await page.query_selector('input[type=password]')
      success     = (current_url != url) and (still_form is None)

      if success:
          self._cookies = await page.context.cookies()
          logger.info(f"Login OK. Now at: {current_url}")
      else:
          logger.warning("Login appears to have failed")

      return success

  async def restore_session(self, context):
      if self._cookies:
          await context.add_cookies(self._cookies)

  async def _find_field(self, page, selectors: list) -> str | None:
      for sel in selectors:
          el = await page.query_selector(sel)
          if el:
              return sel
      return None

STEP B -- gateway/src/routes/playbooks.js
  Ensure POST creates playbook with: name, url, username, password (encrypt)
  GET returns list for current user.
  The playbook is passed to AI Core as playbook_id in config.

STEP C -- orchestrator.py: use playbook if auth_enabled
  If config.auth_enabled and config.playbook_id:
    Fetch playbook from gateway
    auth_agent.login(page, playbook)
    All subsequent pages: auth_agent.restore_session(context)

HOW TO VERIFY:
  Set up a local app that requires login.
  Create a playbook for it. Run test with auth_enabled=True.
  LiveTest feed shows "Auth: Login successful".
  Report contains pages that are behind the login wall.
"""
    },
    {
        "n": 13, "title": "Self-Healing Audit Trail in Report + LiveTest",
        "status": "PENDING",
        "files": ["src/pages/Report.jsx",
                  "src/pages/LiveTest.jsx"],
        "body": """
THE DATA ALREADY EXISTS -- this is purely a UI phase.

  self_healing_agent.py generates HealingEventResult per healed selector.
  orchestrator.py collects them in page_result.healing_events.
  gateway stores them in the HealingEvent Prisma table.
  GET /api/tests/:id/pages returns healing_events in each page object.
  Report.jsx and LiveTest.jsx do NOT currently render this data.

STEP A -- Report.jsx: Self-Healing Events section

  Collect all healing events across all pages:
    const allHealingEvents = testRun.pages.flatMap(p =>
      (p.healingEvents || []).map(e => ({ ...e, pageUrl: p.url }))
    );

  Render (after the defects table):
    <section>
      <h3>Self-Healing Events ({allHealingEvents.length})</h3>
      {allHealingEvents.length === 0
        ? <p>No healing events. All selectors matched perfectly.</p>
        : <table>
            <thead>
              <tr>
                <th>Page</th>
                <th>Original Selector</th>
                <th>Healed To</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {allHealingEvents.map((e, i) =>
                <tr key={i}>
                  <td>{e.pageUrl}</td>
                  <td><code>{e.originalSelector}</code></td>
                  <td><code>{e.healedSelector}</code></td>
                  <td>{(e.confidence * 100).toFixed(0)}%</td>
                </tr>
              )}
            </tbody>
          </table>
      }
    </section>

STEP B -- LiveTest.jsx: healing events in live feed

  When page:complete WebSocket event has healing_events.length > 0:
    For each healing event, add to the feed:
      [amber badge] Healed: '#old-selector' -> '.new-selector' (92%)

HOW TO VERIFY:
  Rename an element ID in your test app mid-way (to simulate selector breakage).
  Run test with self-healing enabled.
  LiveTest feed shows healing event in real time (amber).
  Report shows the Self-Healing Events table with the repaired selector.
  Zero healing events case: section shows "All selectors matched perfectly."
"""
    },
    {
        "n": 14, "title": "Settings Page -- GitHub Connection Panel + API Keys",
        "status": "PENDING",
        "files": ["src/pages/Settings.jsx",
                  "gateway/src/routes/auth.js",
                  "gateway/src/routes/settings.js",
                  "gateway/prisma/schema.prisma"],
        "body": """
STEP A -- gateway/src/routes/auth.js: add /github/profile route

  router.get('/github/profile', authenticate, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.githubAccessToken) {
      return res.json({ connected: false });
    }
    const r = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${user.githubAccessToken}` }
    });
    const p = await r.json();
    res.json({
      connected:    true,
      login:        p.login,
      avatar_url:   p.avatar_url,
      public_repos: p.public_repos,
      name:         p.name,
    });
  });

  Add DELETE /github (disconnect):
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { githubAccessToken: null }
    });
    res.json({ disconnected: true });

STEP B -- gateway/prisma/schema.prisma: ApiKey model

  model ApiKey {
    id        String    @id @default(cuid())
    name      String
    keyHash   String    @unique
    prefix    String                         // first 8 chars shown in UI
    userId    String
    user      User      @relation(fields: [userId], references: [id])
    createdAt DateTime  @default(now())
    lastUsed  DateTime?
  }

  Run: npx prisma migrate dev --name add_api_keys

STEP C -- gateway/src/routes/settings.js: API key CRUD

  POST /api/settings/api-keys
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(raw, 10);
    await prisma.apiKey.create({ data: {
      name: req.body.name, keyHash: hash,
      prefix: raw.slice(0, 8), userId: req.user.id
    }});
    res.json({ key: raw });   // show ONCE, never again

  GET /api/settings/api-keys
    Return: [{ id, name, prefix, createdAt, lastUsed }]
    NEVER return keyHash.

  DELETE /api/settings/api-keys/:id
    Verify ownership, then delete.

STEP D -- Settings.jsx: two new panels

  [GitHub Integration]
    On mount: GET /api/auth/github/profile
    Connected:     show avatar, @login, N public repos, Disconnect button
    Not connected: show Connect GitHub button -> redirect to OAuth

  [API Keys]
    Table: prefix (****xxxx), name, created, last used, Revoke button
    Generate button: modal with name input -> on submit, show full key once
    Copy-to-clipboard icon on the generated key
    Warning: "You will not see this key again."

HOW TO VERIFY:
  Settings -> GitHub Integration -> Connect GitHub -> OAuth flow completes.
  Reconnect shows avatar and username.
  Disconnect -> shows "not connected" again.
  API Keys -> Generate -> copy key.
  curl -H "X-Api-Key: {key}" http://localhost:3000/api/tests -> 200
  Revoke key -> same curl -> 401
"""
    },
    {
        "n": 15, "title": "GitHub Webhook -- Auto-Trigger on Push/PR (CI Gate V2)",
        "status": "PENDING",
        "files": ["gateway/src/routes/webhooks.js (NEW)",
                  "gateway/src/index.js",
                  "gateway/.env"],
        "body": """
CONCEPT:
  User registers in GitHub repo: Settings -> Webhooks -> Add webhook
    Payload URL: https://your-domain/api/webhooks/github
    Content type: application/json
    Secret: (same as GITHUB_WEBHOOK_SECRET in .env)
    Events: Pushes + Pull requests

  Every push or PR auto-creates a BugZero TestRun.
  No user clicks. Fully autonomous CI gate.

STEP A -- gateway/src/routes/webhooks.js (NEW, ~100 lines)

  import crypto from 'crypto';
  import express from 'express';
  import prisma from '../db.js';
  import { triggerAITest } from '../services/testService.js';

  const router = express.Router();

  function verifyGitHubSignature(rawBody, sigHeader) {
    if (!sigHeader) return false;
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const expected = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    // timingSafeEqual prevents timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(sigHeader), Buffer.from(expected)
    );
  }

  // Use raw body for HMAC verification
  router.post('/github',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const sig   = req.headers['x-hub-signature-256'];
      const event = req.headers['x-github-event'];

      if (!verifyGitHubSignature(req.body, sig)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const payload = JSON.parse(req.body.toString());
      let repoUrl, sha, branch;

      if (event === 'push') {
        repoUrl = payload.repository?.html_url;
        sha     = payload.after;
        branch  = payload.ref?.replace('refs/heads/', '');
      } else if (event === 'pull_request') {
        repoUrl = payload.pull_request?.head?.repo?.html_url;
        sha     = payload.pull_request?.head?.sha;
        branch  = payload.pull_request?.head?.ref;
      } else {
        return res.json({ skipped: true, event });
      }

      if (!repoUrl || !sha || sha === '0000000000000000000000000000000000000000') {
        return res.status(400).json({ error: 'Missing or delete event' });
      }

      // ponytail: find first user with token. Per-repo user matching = v2.
      const user = await prisma.user.findFirst({
        where: { githubAccessToken: { not: null } }
      });
      if (!user) return res.status(404).json({ error: 'No GitHub-connected user' });

      const testRun = await prisma.testRun.create({
        data: {
          url:    repoUrl,
          status: 'queued',
          config: JSON.stringify({
            type:         'repo',
            github_token: user.githubAccessToken,
            branch,
          }),
          userId: user.id,
        }
      });

      const io = req.app.get('io');
      // Fire and forget -- webhook must respond < 10s
      triggerAITest(testRun, io).catch(e =>
        console.error('[webhook] test trigger failed:', e)
      );

      res.json({ received: true, runId: testRun.id, event, branch });
    }
  );

  export default router;

STEP B -- gateway/src/index.js

  import webhookRoutes from './routes/webhooks.js';
  app.use('/api/webhooks', webhookRoutes);

STEP C -- gateway/.env

  GITHUB_WEBHOOK_SECRET=your-random-secret-here-min-32-chars

SECURITY REQUIREMENTS:
  - timingSafeEqual used (prevents timing attack on signature)
  - Raw body used for HMAC (not parsed JSON, which may differ)
  - Webhook secret minimum 32 random chars
  - Never log the raw signature or secret
  - Separate rate limit for /api/webhooks/* (GitHub retries aggressively)

HOW TO VERIFY:
  1. Start gateway: npm run dev (port 3000)
  2. Expose via ngrok: ngrok http 3000
  3. GitHub repo -> Settings -> Webhooks -> Add:
       URL: https://{ngrok-id}.ngrok.io/api/webhooks/github
       Secret: your GITHUB_WEBHOOK_SECRET value
       Events: Pushes, Pull requests
  4. Push a commit to the repo
  5. GitHub Webhooks tab shows 200 response
  6. /history in BugZero shows a new test run appearing automatically
  7. The commit on GitHub shows a "pending" -> "success/failure" check
"""
    },
]

for p in phases:
    s()
    s("=" * 68)
    status_tag = f"[{p['status']}]"
    s(f"PHASE {p['n']} -- {p['title']}  {status_tag}")
    s("=" * 68)
    s()
    s("TARGET FILES:")
    for f in p["files"]:
        s(f"  {f}")
    for line in p["body"].strip().split("\n"):
        s(line)
    s()

s()
s("=" * 68)
s("QUICK REFERENCE: FILES TOUCHED BY EACH PHASE")
s("=" * 68)
s()
s("  Phase 1   ai-core/utils/repo_server.py                          [DONE]")
s("  Phase 2   ai-core/models/schemas.py, gateway/prisma/schema.prisma")
s("  Phase 3   ai-core/orchestrator.py")
s("  Phase 4   gateway/src/services/testService.js, routes/tests.js, routes/auth.js")
s("  Phase 5   src/components/ui/GitHubChip.jsx (new), History.jsx, Dashboard.jsx")
s("  Phase 6   src/pages/Report.jsx")
s("  Phase 7   ai-core/utils/github_status.py (new), orchestrator.py")
s("  Phase 8   ai-core/orchestrator.py")
s("  Phase 9   gateway/src/routes/auth.js, src/pages/NewTest.jsx, src/lib/api.js")
s("  Phase 10  ai-core/tools/playwright_tool.py, agents/vision_agent.py, tester.py")
s("  Phase 11  ai-core/agents/chaos_agent.py, orchestrator.py")
s("  Phase 12  ai-core/agents/auth_agent.py, gateway/src/routes/playbooks.js")
s("  Phase 13  src/pages/Report.jsx, src/pages/LiveTest.jsx")
s("  Phase 14  src/pages/Settings.jsx, routes/auth.js, routes/settings.js, schema.prisma")
s("  Phase 15  gateway/src/routes/webhooks.js (new), gateway/src/index.js")
s()
s()
s("=" * 68)
s("STATUS TRACKER")
s("=" * 68)
s()
s("  [X] Phase 1   Commit metadata capture (repo_server.py)")
s("  [ ] Phase 2   Schema + DB GitHub fields")
s("  [ ] Phase 3   Orchestrator metadata wiring")
s("  [ ] Phase 4   Gateway save/expose")
s("  [ ] Phase 5   GitHubChip in History + Dashboard")
s("  [ ] Phase 6   Report header commit context")
s("  [ ] Phase 7   GitHub pending status post")
s("  [ ] Phase 8   GitHub success/failure status post")
s("  [ ] Phase 9   Branch selector")
s("  [ ] Phase 10  Bounding box overlap engine")
s("  [ ] Phase 11  Chaos agent throttling")
s("  [ ] Phase 12  Auth playbook real navigation")
s("  [ ] Phase 13  Healing audit UI")
s("  [ ] Phase 14  Settings GitHub panel + API keys")
s("  [ ] Phase 15  Webhook auto-trigger")

with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Written: {out}")
print(f"Lines: {len(lines)}")
