<div align="center">
  <h1>🤖 AI Core — Autonomous Testing Engine</h1>
  <p><strong>Python FastAPI · Playwright · NVIDIA Eagle2 VLM · Offline Algorithmic Engine</strong></p>
</div>

---

## What This Does

The AI Core is the brain of AutonomousQA. It orchestrates a multi-stage pipeline that crawls, analyzes, and tests web applications autonomously without any manual scripts.

It operates in a **Hybrid VLM + Deterministic Engine** mode:
- **NVIDIA Eagle2 & LocateAnything-3B VLM**: Connects to Hugging Face Inference API / ZeroGPU Space ([rohith2157/vlm_for_bugzero](https://huggingface.co/spaces/rohith2157/vlm_for_bugzero)) for AI-powered visual QA and UI element grounding.
- **100% Offline Fallback**: If no token is provided or offline, automatically falls back to deterministic PIL pixel math and Levenshtein DOM fuzzy matching ($0 cost, 100% offline).

---

## Architecture

```
orchestrator.py (Pipeline Coordinator)
  ├── Stage 0: AuthAgent + ChaosAgent (Form, SSO, PyOTP MFA, CDP Throttle)
  ├── Stage 1: CrawlerAgent (BFS discovery)
  ├── Stage 2: Scheduler (PageRank + 4-factor risk scoring)
  ├── Stage 3: Test Loop per page
  │   ├── 3a: SelfHealingAgent (DOM fingerprinting + Levenshtein / LocateAnything healing)
  │   ├── 3b: TesterAgent (SEO, forms, performance, links)
  │   ├── 3c: axe-core (WCAG 2.1 accessibility audit)
  │   ├── 3d: VisionAgent (NVIDIA Eagle2 VLM + PIL pixel-variance diff)
  │   └── 3e: Post-test fingerprinting for future healing
  └── Stage 4: ReportAgent (aggregate scores, grade A+ to F)
```

---

## Agents

| Agent | File | Purpose | VLM / Local Engine |
|:---|:---|:---|:---|
| **Crawler** | `agents/crawler.py` | BFS page discovery with link extraction | Local Async Playwright |
| **Tester** | `agents/tester.py` | SEO, form, performance, and link checks | Local Heuristics |
| **Self-Healing** | `agents/self_healing_agent.py` | DOM fingerprinting + selector repair | `nvidia/LocateAnything-3B` / Levenshtein |
| **Vision** | `agents/vision_agent.py` | Visual bug analysis + screenshot diffing | `nvidia/Eagle2-2B` / PIL Pixel-Math |
| **Scheduler** | `agents/scheduler.py` | PageRank + defect history + change detection | `networkx` Graph Algo |
| **Auth** | `agents/auth_agent.py` | SSO/OAuth/MFA navigation | `pyotp` + Heuristic DOM |
| **Chaos** | `agents/chaos_agent.py` | Network/CPU throttling | Chrome DevTools Protocol (CDP) |
| **Report** | `agents/report_agent.py` | Score aggregation + grade calculation | Local Math Aggregator |

---

## Setup

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
playwright install chromium
cp .env.example .env           # Configure HF_TOKEN (Optional)
python main.py                 # Starts on :8000
```

---

## Environment Variables

| Variable | Required | Description | Default |
|:---|:---|:---|:---|
| `HF_TOKEN` | No | Hugging Face Access Token for NVIDIA Eagle VLM | `""` (Falls back to local PIL/Levenshtein) |
| `HF_MODEL_ID` | No | Hugging Face VLM model for Visual QA | `nvidia/Eagle2-2B` |
| `HF_GROUNDING_MODEL_ID` | No | Hugging Face Grounding model for UI element locating | `nvidia/LocateAnything-3B` |
| `GATEWAY_URL` | No | Gateway backend URL | `http://localhost:3000` |
| `HEADLESS` | No | Run browser headless | `true` |
| `BROWSER` | No | Browser engine | `chromium` |

---

## Verification & Self-Check

Run the VLM integration self-check script:
```bash
python test_vlm_integration.py
```

---

## API Endpoints

| Method | Path | Description |
|:---|:---|:---|
| `POST` | `/api/test/run` | Start autonomous test pipeline |
| `GET` | `/api/health` | Health check |
| `GET` | `/docs` | Interactive API docs (Swagger) |
