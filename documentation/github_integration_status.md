# GitHub Integration — Full Status & What to Add

## TL;DR: What's already done vs what's missing

The GitHub OAuth plumbing is **nearly complete** and working. The repo-mode test pipeline is wired
end-to-end. What's missing is the **results surface** — repo tests return the exact same format as
URL tests, but the UI doesn't exploit the extra GitHub context it could show.

---

## What's already built (and working)

### 1. GitHub OAuth — `gateway/src/routes/auth.js`

| Route | What it does |
|---|---|
| `GET /api/auth/github` | Redirects user to GitHub's OAuth page. Supports two modes: `login` (new user) and `link` (attach to existing account). Passes JWT in state param. ✅ |
| `GET /api/auth/github/callback` | Exchanges code for access_token, stores it in DB as `githubAccessToken` on the user row. Redirects back to frontend with JWT. ✅ |
| `GET /api/auth/github/repos` | Returns user's repos via GitHub API (sorted by `updated`, 100 per page). Returns `{ id, name, url, private, updatedAt }`. ✅ |
| `GET /api/auth/github/profile` | Returns connected GitHub username/avatar/stats. ✅ |
| `DELETE /api/auth/github` | Disconnects (nulls the token). ✅ |

**OAuth scope granted:** `repo,user:email` — this means it can read both public and **private** repos. ✅

---

### 2. Frontend — `autonomousqa-frontend/src/pages/NewTest.jsx`

- Mode toggle between "Live URL" and "GitHub Repository" is implemented. ✅
- When in `repo` mode, fetches repos via `/api/auth/github/repos`. ✅
- If no repos (not linked), shows a "Connect GitHub" button that redirects to the OAuth flow. ✅
- On launch, passes `{ url: repo.html_url, config: { type: 'repo', github_token } }` to the backend. ✅

---

### 3. AI Core — `ai-core/utils/repo_server.py` + `ai-core/orchestrator.py`

The orchestrator detects `config.type === 'repo'`, uses `RepoManager` to:
1. Clone the repo (shallow `--depth 1`) with the OAuth token injected into the URL. ✅
2. Detect Node vs static project (`package.json`). ✅
3. Start `npm run dev` and detect the actual port from stdout logs (handles Vite port detection). ✅
4. Replaces `target_url` with `http://localhost:{port}`. ✅
5. Runs the **exact same pipeline** as a URL test from that point forward. ✅
6. Cleans up (terminates server, deletes temp dir) in `finally`. ✅

---

## What's MISSING / could be added for better results

The tests run fine, but you're throwing away GitHub-specific metadata that would make the results
**much more useful**. Here's what to add, ranked by impact:

---

### 🔴 HIGH IMPACT — Results enrichment

#### A. Show repo context in the test result
**Currently:** The result just shows `url: "https://github.com/owner/repo"` (the original repo URL).
**What to add:** Pass repo metadata (name, branch, last commit SHA, commit message, author) into the
test result so the History/Dashboard page can show _"Tested: owner/repo @ abc1234 · 'fix: login bug'"_

**Where to add it:**
- `RepoManager.clone()` → after clone, run `git log -1 --format="%H|%s|%an"` to get commit info
- Pass it back up through `orchestrator.py` into `TestResult`
- Add `repo_name`, `commit_sha`, `commit_message`, `branch` fields to `TestResult` schema

#### B. GitHub Status Check / Commit Status API
**Currently:** Results only live in BugZero. Developers don't see them in the PR.
**What to add:** After a test run, call `POST https://api.github.com/repos/{owner}/{repo}/statuses/{sha}`
to post a pass/fail status on the commit. This makes BugZero results show up as a GitHub check directly
on the PR page — huge engagement/utility boost.

**Where:** Add a `_post_github_status(token, repo_url, sha, result)` helper in `orchestrator.py`,
call it after Stage 4 when `req_type == 'repo'`.

---

### 🟡 MEDIUM IMPACT — What to surface in the UI

#### C. Repo-mode results badge in History/Dashboard
In [History.jsx](file:///c:/testproject/autonomousqa-frontend/src/pages/History.jsx) and Dashboard,
show a GitHub icon + repo name instead of just the raw URL when `config.type === 'repo'`.
The data already comes back from the API — just need to render it differently.

#### D. Branch selector in NewTest
Right now users can only test the default branch.
Add a branch dropdown: after repo is selected, hit `GET /api/auth/github/repos/{owner}/{repo}/branches`
and let them pick. One extra API call, big UX win for teams with feature branches.

#### E. "Re-test on push" webhook (CI mode)
Add a GitHub webhook endpoint in the gateway: `POST /api/webhooks/github`.
When a push event comes in with a repo the user has previously tested, auto-trigger a new test run.
This is the killer feature that turns BugZero into a CI gate, not just a manual tool.

---

### 🟢 LOWER IMPACT — Nice to have

#### F. Show private/public badge on repo select dropdown
The repos API already returns `private: true/false`. Just render a lock icon in the select.

#### G. Repo README scan
After clone, read `README.md` and pass to Gemini as context so the AI understands what the
project is supposed to do — better defect descriptions.

---

## Current OAuth flow — step by step

```
User clicks "Connect GitHub" in NewTest
  → frontend hits: GET http://localhost:3000/api/auth/github?token={jwt}
    → gateway decodes JWT → state = { action: 'link', userId, redirect: '/tests/new' }
    → redirects to: github.com/login/oauth/authorize?scope=repo,user:email&state=...
      → user approves
        → github redirects to: GET /api/auth/github/callback?code=...&state=...
          → gateway exchanges code for access_token
          → stores access_token in DB: User.githubAccessToken
          → redirects to: localhost:5173/tests/new?github=linked
            → frontend reloads repo list (useEffect triggers on testMode='repo')
              → GET /api/auth/github/repos → returns repo list ✅
```

**Is the OAuth working?** Yes, structurally correct. The one thing to **verify in `.env`:**
- `GITHUB_CLIENT_ID` ✅
- `GITHUB_CLIENT_SECRET` ✅
- `GITHUB_CALLBACK_URL` must match exactly what's registered in your GitHub App settings
  (e.g. `http://localhost:3000/api/auth/github/callback`)

If the callback URL doesn't match GitHub's registered redirect URI, OAuth will silently fail.

---

## Recommended next step (shortest path to visible value)

**Do A + C together:**
1. After `git clone`, read the commit SHA and message (one `git log` call, 3 lines).
2. Store it in `TestResult`.
3. In History/Dashboard, render a GitHub chip with the repo name + SHA instead of the raw URL.

That alone makes repo-mode results look dramatically more useful with minimal code.

Want me to implement A + C now?
