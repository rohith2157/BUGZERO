"""AutonomousQA AI Core — FastAPI server."""

import sys
import asyncio

# Windows requires ProactorEventLoop for Playwright subprocess support
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import TestRequest, TestResult, HealthResponse
from orchestrator import Orchestrator
from config import settings

app = FastAPI(
    title="AutonomousQA AI Core",
    description="AI-powered autonomous QA testing engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = Orchestrator()


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        browser_ready=True,
    )


@app.post("/api/test/run", response_model=TestResult)
async def run_test(request: TestRequest):
    """Start an autonomous test run on the given URL."""
    result = await orchestrator.run_test(request)
    return result


@app.post("/api/test/cancel/{run_id}")
async def cancel_test(run_id: str):
    """Cancel an in-progress test run."""
    cancelled = orchestrator.cancel(run_id)
    return {"run_id": run_id, "cancelled": cancelled}


@app.get("/api/test/status/{run_id}")
async def test_status(run_id: str):
    """Check the status of a test run."""
    active = run_id in orchestrator.active_runs
    return {"run_id": run_id, "status": "running" if active else "not_active"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        reload_excludes=["venv/*", "screenshots/*", "results/*"],
    )
