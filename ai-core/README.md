<div align="center">
  <h1>🤖 AI Core — Autonomous Testing Engine</h1>
  <p><strong>Python FastAPI · Playwright · Gemini Vision · Self-Healing AI</strong></p>
</div>

---

## What This Does

The AI Core is the brain of AutonomousQA. It orchestrates a multi-stage pipeline that crawls, analyzes, and tests web applications without any scripts.

## Architecture

```
orchestrator.py (Pipeline Coordinator)
  ├── Stage 0: AuthAgent + ChaosAgent (optional)
  ├── Stage 1: CrawlerAgent (BFS discovery)
  ├── Stage 2: Scheduler (PageRank + 4-factor risk scoring)
  ├── Stage 3: Test Loop per page
  │   ├── 3a: SelfHealingAgent (fingerprint + heal broken selectors)
  │   ├── 3b: TesterAgent (SEO, forms, performance, links)
  │   ├── 3c: axe-core (WCAG 2.1 accessibility audit)
  │   ├── 3d: VisionAgent (Gemini visual bugs + regression diff)
  │   └── 3e: Post-test fingerprinting for future healing
  └── Stage 4: ReportAgent (aggregate scores, grade A+ to F)
```

## Agents

| Agent | File | Purpose |
|:---|:---|:---|
| **Crawler** | `agents/crawler.py` | BFS page discovery with link extraction |
| **Tester** | `agents/tester.py` | SEO, form, performance, and link checks |
| **Self-Healing** | `agents/self_healing_agent.py` | DOM fingerprinting + LLM-powered selector repair |
| **Vision** | `agents/vision_agent.py` | Gemini screenshot analysis + visual regression |
| **Scheduler** | `agents/scheduler.py` | PageRank + defect history + change detection |
| **Auth** | `agents/auth_agent.py` | SSO/OAuth/MFA navigation |
| **Chaos** | `agents/chaos_agent.py` | Network/CPU throttling |
| **Report** | `agents/report_agent.py` | Score aggregation + grade calculation |

## Setup

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
playwright install chromium
cp .env.example .env           # Add GEMINI_API_KEY
python main.py                 # Starts on :8000
```

## Environment Variables

| Variable | Required | Description |
|:---|:---|:---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for vision + healing |
| `GATEWAY_URL` | No | Gateway URL (default: `http://localhost:3000`) |
| `HEADLESS` | No | Run browser headless (default: `true`) |
| `BROWSER` | No | Browser engine (default: `chromium`) |

## API Endpoints

| Method | Path | Description |
|:---|:---|:---|
| `POST` | `/api/test/run` | Start autonomous test pipeline |
| `GET` | `/api/health` | Health check |
| `GET` | `/docs` | Interactive API docs (Swagger) |
