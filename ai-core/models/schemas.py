"""Pydantic models for AI Core request/response schemas."""

from pydantic import BaseModel, HttpUrl
from typing import Optional


class TestConfig(BaseModel):
    browser: str = "chromium"
    crawl_depth: str = "standard"
    modules: list[str] = [
        "functional",
        "accessibility",
        "performance",
        "seo",
        "compliance",
    ]
    playbook_id: Optional[str] = None


class TestRequest(BaseModel):
    run_id: str
    url: str
    config: Optional[TestConfig] = None


class DefectResult(BaseModel):
    type: str
    severity: str
    message: str
    fix: Optional[str] = None
    confidence: Optional[float] = None


class ComplianceViolation(BaseModel):
    standard: str
    criterion: str
    severity: str
    description: str
    remediation: Optional[str] = None


class PerformanceMetric(BaseModel):
    value: float
    rating: Optional[str] = None


class PageResult(BaseModel):
    url: str
    page_type: Optional[str] = None
    hygiene_score: Optional[float] = None
    defects: list[DefectResult] = []
    compliance: list[ComplianceViolation] = []
    performance: dict[str, PerformanceMetric] = {}


class TestResult(BaseModel):
    run_id: str
    url: str
    status: str = "completed"
    pages: list[PageResult] = []
    overall_score: Optional[float] = None
    total_defects: int = 0


class HealthResponse(BaseModel):
    status: str
    version: str
    browser_ready: bool
