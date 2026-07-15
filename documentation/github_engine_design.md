# BugZero — GitHub Engine: Full Workflow Design

**Purpose of this document:** This is the complete blueprint for how the GitHub Engine works in
BugZero — from the moment a user connects their GitHub account all the way to the moment test
results appear in both BugZero and on the GitHub pull request itself. Use this document to build
every piece of the GitHub Engine.

---

## What Is the GitHub Engine?

The GitHub Engine is a separate mode of running a BugZero test. Instead of the user pasting a
live URL, they connect their GitHub account, pick a repository, and BugZero:

1. Clones the repo onto the server
2. Starts a local development server from that repo
3. Runs the exact same AI-powered test pipeline against that local server
4. Returns results that are enriched with GitHub-specific metadata (branch, commit, author)
5. Optionally posts the result back to GitHub as a commit status check

The end result: developers can test their code **before it goes live** — not after — and the
pass/fail result shows up directly on their GitHub pull request.

---

## Stage 0 — GitHub OAuth Connection

### What happens from the user's point of view

The user goes to New Test, clicks the "GitHub Repository" tab, and sees either their list of
repositories (if already connected) or a "Connect GitHub" button (if not).

When they click "Connect GitHub":
- They are redirected to GitHub's authorization page
- They approve BugZero's access (the app requests `repo` and `user:email` scopes)
- GitHub redirects them back to BugZero
- Their repository list immediately loads

That's it from the user's perspective. It's a one-time setup.

### What happens behind the scenes

**Step 1 — Initiate OAuth**

The frontend sends the user to:
```
GET /api/auth/github?token={user's JWT}
```

The gateway decodes the JWT to find the user's ID, encodes it into a `state` parameter, and
redirects the browser to GitHub:
```
https://github.com/login/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:3000/api/auth/github/callback
  &scope=repo,user:email
  &state=BASE64_ENCODED_JSON
```

The `state` carries `{ action: "link", userId: "user-id-here", redirect: "/tests/new" }`.
This is how the callback knows which user to update.

**Step 2 — GitHub sends user back**

After the user approves, GitHub calls:
```
GET /api/auth/github/callback?code=TEMPORARY_CODE&state=SAME_STATE
```

**Step 3 — Exchange code for access token**

The gateway makes a server-side POST to GitHub:
```
POST https://github.com/login/oauth/access_token
  { client_id, client_secret, code, redirect_uri }
```

GitHub returns an `access_token`. This is the real OAuth token that lets BugZero call GitHub
on behalf of the user. It is stored in the database on the user's row as `githubAccessToken`.

**Step 4 — Redirect back to the app**

The gateway redirects the user back to:
```
http://localhost:5173/tests/new?github=linked
```

The frontend detects the `?github=linked` query param and immediately re-fetches the repository
list, which now works because the token is in the database.

### What the token can do

The `repo` scope means the token can:
- List all repos (public and private) the user has access to
- Clone private repos using the token embedded in the clone URL
- Post commit status checks to repos the user can push to

---

## Stage 1 — Repository Picker

### What the user sees

A dropdown select in the New Test form, listing all their GitHub repositories sorted by the date
they were last updated. Each repo shows its full name (e.g. `owner/repo-name`) and a lock icon
if it's private.

### What data is fetched

```
GET /api/auth/github/repos
Authorization: Bearer {user JWT}
```

The gateway calls the GitHub API:
```
GET https://api.github.com/user/repos?sort=updated&per_page=100
Authorization: token {user's githubAccessToken from DB}
```

GitHub returns an array of repo objects. The gateway maps them down to just what the frontend
needs: `{ id, name (full_name), url (html_url), private, updatedAt }`.

### What the user picks

The user selects a repository. The value stored is the repo's `html_url` — for example:
`https://github.com/acme/my-frontend-app`

This URL is what gets sent to the backend when the test is launched.

### What's missing right now (needs to be built)

**Branch selector.** Currently, the engine always clones the default branch (usually `main` or
`master`). The user has no way to pick a feature branch. This needs to be added:

- After the user selects a repo, fetch its branches:
  ```
  GET https://api.github.com/repos/{owner}/{repo}/branches
  ```
- Show a second dropdown: "Branch to test" — defaulting to the repo's `default_branch`
- Pass the selected branch name into the test config payload as `config.branch`
- In the clone step, use `git clone --branch {branch} --depth 1` instead of just `git clone`

This is the biggest missing piece in Stage 1.

---

## Stage 2 — Launching the Test

### What the frontend sends to the gateway

When the user clicks "Launch Autonomous Test", the frontend calls:
```
POST /api/tests
{
  "url": "https://github.com/acme/my-frontend-app",
  "config": {
    "type": "repo",
    "github_token": "gho_theOAuthToken",
    "branch": "feature/login-redesign",   ← needs to be added
    "browser": "chromium",
    "crawl_depth": "standard",
    "max_pages": 50,
    "modules": ["functional", "accessibility", "performance", "seo", "compliance"]
  }
}
```

The gateway creates a `TestRun` record in the database with `status: "running"` and forwards the
request to the AI Core via an internal HTTP call. The frontend receives the `testRun.id` and
navigates to the live test page to watch progress.

---

## Stage 3 — Clone & Serve (The GitHub Engine Core)

This is where the GitHub Engine diverges from the URL mode. Everything in this stage is handled
by `RepoManager` in `ai-core/utils/repo_server.py`.

### Step 3a — Authenticate the Clone URL

The engine cannot just `git clone https://github.com/acme/my-frontend-app` because that would
fail for private repos (and even public repos would require interactive prompts).

Instead, the OAuth token is injected directly into the URL:
```
https://x-access-token:{github_token}@github.com/acme/my-frontend-app
```

This is a standard, documented GitHub pattern. The `x-access-token` username is just a
placeholder — GitHub only looks at the password (the token) to authenticate.

For public repos, if there's no token, the original URL is used as-is.

### Step 3b — Shallow Clone

```
git clone --depth 1 {auth_url} .
```

`--depth 1` means only the latest commit is downloaded, not the full history. This makes the
clone significantly faster (often 5–10x faster for large repos with long histories). For our
purpose we don't need history — we just need the files.

If `config.branch` was specified, this becomes:
```
git clone --depth 1 --branch feature/login-redesign {auth_url} .
```

**After the clone completes, immediately capture commit metadata:**
```
git log -1 --format="%H|%s|%aN|%aE"
```

This returns one line like:
```
abc123def456|fix: resolve login redirect loop|Jane Dev|jane@acme.com
```

Parse it into:
- `commit_sha` = `abc123def456`
- `commit_message` = `fix: resolve login redirect loop`
- `commit_author_name` = `Jane Dev`
- `commit_author_email` = `jane@acme.com`

Also capture the branch name:
```
git rev-parse --abbrev-ref HEAD
```

Store all of this. It will be attached to the `TestResult` and displayed in the UI.

### Step 3c — Detect Project Type

After cloning, the engine looks at the repo's root directory to decide how to start the app:

| File found | What it means | How to start |
|---|---|---|
| `package.json` | Node.js project (React, Vue, Next, etc.) | `npm install` then `npm run dev` |
| `package.json` (no `dev` script) | Simple Node project | `npm start` |
| `requirements.txt` or `pyproject.toml` | Python project | `pip install -r requirements.txt` then start Flask/Django |
| `index.html` (no package.json) | Static HTML site | Python's built-in HTTP server |
| `Cargo.toml` | Rust project | `cargo run` |
| `go.mod` | Go project | `go run .` |

Currently only Node and static are handled. The others are future work.

### Step 3d — Install Dependencies

For Node projects:
- If `package-lock.json` exists: run `npm ci` (faster, exact versions)
- If only `package.json` exists: run `npm install`

This step can take anywhere from 5 seconds to 3 minutes depending on the project. The engine
waits for it to finish before moving on.

### Step 3e — Start the Development Server

For Node projects, run `npm run dev` with `PORT={free_port}` set as an environment variable.
Also set `BROWSER=none` so React/Next don't try to open a browser window.

The tricky part: Vite, Next.js, Create React App, and other tools all output their port number
differently in their startup logs, and they don't always respect the `PORT` environment variable.

The engine reads stdout line by line and watches for a URL pattern like:
```
http://localhost:5173
http://127.0.0.1:3001
```

When it finds one, it knows the actual port the server is running on. It waits 2 more seconds
to let the server finish warming up, then moves on.

If no URL is found within 15 seconds, the engine assumes the server started on the port that
was passed via the `PORT` env var and continues anyway.

### Step 3f — Replace Target URL

The `target_url` that was originally `https://github.com/acme/my-frontend-app` is now replaced
with `http://localhost:5173` (or whatever port was detected). From this point on, the rest of
the pipeline treats this exactly like a URL test — it has no idea it started as a repo.

---

## Stage 4 — The Test Pipeline (Same as URL Mode)

After Stage 3, the GitHub Engine is effectively done — the repo is running locally and the
rest of the pipeline is identical to a URL test. This is intentional: the test quality is the
same regardless of whether the source was a URL or a repo.

The pipeline runs these stages in order:

### Stage 4a — BFS Crawl

The crawler starts at `http://localhost:5173` (the local server) and discovers all pages by
following links. It does a breadth-first search up to the configured depth and max pages limit.

Every page discovered is sent as a progress event to the gateway so the live test page can
show "Discovered: /about, /login, /dashboard..." in real time.

### Stage 4b — PageRank + Risk Scoring

After crawling, every discovered page gets a priority score based on:
- How many other pages link to it (PageRank)
- Whether previous test runs found defects on that page (defect history)
- Whether that page's content has changed since the last run (change detection)

Pages are sorted by this score so the most important/risky pages get tested first.

### Stage 4c — Test Loop

For each page, in priority order:
1. **Self-Healing** — check if any previously-tracked CSS selectors have broken (elements moved
   or renamed). If so, try to find the new location and record the healing event.
2. **Basic Tests** — run the TesterAgent: check all links, form submissions, page performance,
   SEO tags, meta descriptions, heading structure, alt text.
3. **axe-core Accessibility** — inject axe-core into the page and get all WCAG 2.1 AA violations
   with specific element locations and remediation suggestions.
4. **Gemini Vision** — take a screenshot and send it to Gemini to check for visual bugs, layout
   issues, and contrast problems. Also compare against the baseline screenshot if one exists.

Each page result is sent to the gateway as a progress event immediately after it completes.

### Stage 4d — Report Generation

After all pages are tested, the ReportAgent aggregates everything into a single compliance report:
- Overall hygiene score (0–100)
- Letter grade (A, B, C, D, F)
- Total defect count broken down by severity
- Per-module scores (accessibility, SEO, performance, etc.)
- List of the most critical issues with fix recommendations

---

## Stage 5 — Results Enrichment (GitHub-Specific)

This is the stage that needs to be built. Right now results come back with just a score and
defect list. With the GitHub Engine, we have extra context that should be attached.

### What to add to TestResult

The following fields need to be added to the `TestResult` schema and stored in the database:

```python
# These are captured in Stage 3b after git clone
repo_name: str | None          # "acme/my-frontend-app"
repo_url: str | None           # "https://github.com/acme/my-frontend-app"
branch: str | None             # "feature/login-redesign"
commit_sha: str | None         # "abc123def456789..."
commit_sha_short: str | None   # "abc123d" (first 7 chars)
commit_message: str | None     # "fix: resolve login redirect loop"
commit_author: str | None      # "Jane Dev"
```

### How to capture them

In `repo_server.py`, after `git clone` succeeds, add:
```python
import subprocess

result = subprocess.run(
    ["git", "log", "-1", "--format=%H|%s|%aN"],
    cwd=self.temp_dir,
    capture_output=True, text=True
)
parts = result.stdout.strip().split("|", 2)
self.commit_sha = parts[0] if len(parts) > 0 else None
self.commit_message = parts[1] if len(parts) > 1 else None
self.commit_author = parts[2] if len(parts) > 2 else None

branch_result = subprocess.run(
    ["git", "rev-parse", "--abbrev-ref", "HEAD"],
    cwd=self.temp_dir,
    capture_output=True, text=True
)
self.branch = branch_result.stdout.strip() or None
```

Then in `orchestrator.py`, read these from `repo_manager` and attach them to the `TestResult`.

---

## Stage 6 — GitHub Commit Status API (Post Results Back to GitHub)

This is the feature that turns BugZero from a standalone tool into a proper CI gate.

### What it looks like on GitHub

After the test completes, a status check appears on the commit in GitHub:

```
✅ BugZero QA — Passed (Score: 91/100, 3 minor issues)   Details
❌ BugZero QA — Failed (Score: 58/100, 12 critical issues)  Details
⏳ BugZero QA — Running...                                Details
```

This appears on every pull request that includes that commit, in the Checks section. Clicking
"Details" takes the developer to the full BugZero report page.

### How to implement it

After Stage 4d (report complete), if `req_type == "repo"` and we have a `commit_sha` and a
`github_token`, make this API call:

```
POST https://api.github.com/repos/{owner}/{repo}/statuses/{commit_sha}
Authorization: token {github_token}
Content-Type: application/json

{
  "state": "success",          ← "success", "failure", or "error"
  "target_url": "https://bugzero.yourdomain.com/tests/{run_id}/report",
  "description": "Score: 91/100 · 3 defects found",
  "context": "BugZero / Autonomous QA"
}
```

The `state` mapping:
- Score >= 80 and no critical defects → `"success"`
- Score >= 60 or only minor defects → `"failure"` (still a soft failure)
- Score < 60 or any critical defect → `"failure"`
- Test errored out → `"error"`

The `context` field (`"BugZero / Autonomous QA"`) is the name that appears in the GitHub UI.
If you use different contexts for different test types (e.g. `"BugZero / Accessibility"` for
an accessibility-only run), GitHub will show them as separate status checks.

### When to post the "pending" status

For best UX, also post a `"pending"` status the moment the test starts (before cloning). This
way developers immediately see "BugZero is running" in their PR rather than no status at all.

This means posting two statuses per run: one at the start (`pending`) and one at the end
(`success` or `failure`).

---

## Stage 7 — Webhook Auto-Trigger (Future Feature)

This is not built yet but is the natural evolution: instead of users manually triggering tests,
GitHub automatically triggers them on every push.

### How it works

1. The user installs the BugZero GitHub App on their repository (or just adds a webhook in
   repo settings pointing to `https://bugzero.yourdomain.com/api/webhooks/github`)

2. On every push to `main` (or any branch the user configured), GitHub sends a POST to that
   webhook endpoint with the push event payload

3. BugZero receives it, looks up which user owns this repo, and automatically launches a test
   run with `type: "repo"`, the same config as the last manually-triggered run for that repo

4. The result is posted back as a commit status (Stage 6)

5. If the score drops compared to the last run, BugZero can send an email/Slack notification

This is the "always-on quality gate" mode. It's the feature that makes BugZero feel essential
rather than optional.

---

## UI Changes Required

### NewTest page (`NewTest.jsx`)

**Currently working:**
- Mode toggle between URL and GitHub Repository ✅
- Repository list fetching ✅
- "Connect GitHub" prompt when not linked ✅
- Launch with `type: "repo"` and `github_token` ✅

**Needs to be added:**
- Branch dropdown: appears after a repo is selected, fetches branches from GitHub API
- Private repo lock icon on each option in the repo select dropdown
- Last updated date shown next to each repo name
- When no repos load but GitHub IS linked (e.g. user has 0 repos), show a different empty state
- Loading skeleton while repos are being fetched (instead of just disabled option text)

### History page (`History.jsx`) and Dashboard (`Dashboard.jsx`)

**Currently:** Every run shows just the raw URL in a monospace font.

**Needs to be added for repo-mode runs:**
- Instead of showing `https://github.com/acme/my-app`, show:
  - GitHub logo icon
  - Repo name (`acme/my-app`) as the primary label
  - Branch name in smaller secondary text (`feature/login-redesign`)
  - Short commit SHA as a pill/badge (`abc123d`)
  - Commit message on hover (tooltip)

This makes it immediately clear which runs came from a GitHub repo vs a live URL, and what
exact code state was tested.

**Implementation:** Check `run.config?.type === 'repo'` in the row render logic. If true,
render the GitHub chip instead of the raw URL string.

### Test Report page (wherever it lives)

For repo-mode tests, the report header should show:
```
Repository: acme/my-frontend-app
Branch: feature/login-redesign
Commit: abc123d — "fix: resolve login redirect loop"
Author: Jane Dev
Tested at: 2026-07-15 22:41 IST
```

And a button: "View on GitHub →" that links to:
`https://github.com/acme/my-frontend-app/commit/abc123def456`

---

## Data Flow Summary

Here is the complete data flow from click to result, in one place:

```
User clicks "Connect GitHub"
  → Gateway redirects to GitHub OAuth
    → User approves
      → Gateway exchanges code for access_token
      → Stores access_token in DB (User.githubAccessToken)
        → Redirects back to /tests/new

User selects repo "acme/my-app", branch "feature/login"
  → Frontend sends POST /api/tests with:
       { url: "https://github.com/acme/my-app",
         config: { type: "repo", github_token, branch: "feature/login", ... } }
    → Gateway creates TestRun (status: running), forwards to AI Core

AI Core Orchestrator receives the request
  → RepoManager.clone():
       git clone --depth 1 --branch feature/login
           https://x-access-token:{token}@github.com/acme/my-app .
       git log -1 → captures commit_sha, commit_message, commit_author
       git rev-parse --abbrev-ref HEAD → captures branch name
  → RepoManager.start_server():
       npm ci
       npm run dev → detects port 5173 from stdout
  → target_url = http://localhost:5173

  → [POST commit status: "pending" to GitHub]

  → Stage 1: BFS Crawl on http://localhost:5173
  → Stage 2: PageRank sort
  → Stage 3: Test loop (self-heal + basic + axe + vision) per page
  → Stage 4: ReportAgent generates compliance report

  → TestResult built with repo_name, branch, commit_sha, commit_message, commit_author
  → [POST commit status: "success"/"failure" to GitHub with score and report link]

  → Result saved to DB
  → Frontend shows report with GitHub context (repo, branch, commit, author)

RepoManager.cleanup():
  → Server process terminated
  → Temp directory deleted
```

---

## Environment Variables Required

For the GitHub Engine to work, these must be set in `gateway/.env`:

```
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

The `GITHUB_CALLBACK_URL` must **exactly match** what is registered in your GitHub OAuth App
settings at `github.com/settings/developers → OAuth Apps → your app → Authorization callback URL`.
A mismatch here is the number one cause of OAuth failures.

For the Commit Status API (Stage 6), no extra env vars are needed — the OAuth token that's
already stored on the user is used. Just make sure the token has the `repo` scope (it does,
based on the current OAuth scope setting).

---

## What to Build Next (Priority Order)

1. **Capture commit metadata in `repo_server.py`** — 3 lines of Python, big UI payoff
2. **Pass metadata through `orchestrator.py` into `TestResult`** — extend the schema
3. **Show GitHub chip in History and Dashboard** — render differently when `config.type === 'repo'`
4. **Post commit status to GitHub after test completes** — one API call in orchestrator.py
5. **Post pending status when test starts** — same API, called earlier
6. **Branch selector in NewTest** — new dropdown + new gateway route for branch list
7. **Webhook endpoint** — auto-trigger on push events

Items 1–5 are the "GitHub Engine V1" — they make the existing flow dramatically more useful
without adding any new user-facing complexity. Items 6–7 are the "V2" that makes BugZero a
real CI gate.
