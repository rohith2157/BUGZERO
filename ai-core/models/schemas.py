"""Pydantic models for AI Core request/response schemas."""

from pydantic import BaseModel
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
    max_pages: Optional[int] = None
    auth_enabled: bool = False
    auth_username: Optional[str] = None
    auth_password: Optional[str] = None
    chaos_mode: bool = False


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
    source: Optional[str] = None          # "manual", "gemini_vision", "axe_core"
    location: Optional[str] = None        # Where on the page (for vision defects)


class ComplianceViolation(BaseModel):
    standard: str                         # "WCAG", "GDPR"
    criterion: str                        # "1.1.1", "Level AA", "Cookie Consent"
    severity: str
    description: str
    remediation: Optional[str] = None
    rule_id: Optional[str] = None         # axe-core rule ID
    help_url: Optional[str] = None        # Link to docs
    affected_elements: list[str] = []     # HTML snippets
    instance_count: Optional[int] = None  # How many instances


class PerformanceMetric(BaseModel):
    value: float
    rating: Optional[str] = None


class PageResult(BaseModel):
    url: str
    page_type: Optional[str] = None
    hygiene_score: Optional[float] = None
    pagerank_score: Optional[float] = None       # Stage 3: PageRank importance
    vision_quality_score: Optional[float] = None  # Stage 4: Gemini visual score
    defects: list[DefectResult] = []
    compliance: list[ComplianceViolation] = []
    performance: dict[str, PerformanceMetric] = {}


# Stage 6: Site-wide report models

class PageScore(BaseModel):
    url: str
    page_type: Optional[str] = None
    hygiene_score: float = 0
    accessibility_score: float = 0
    visual_score: Optional[float] = None
    health_score: float = 0
    defect_count: int = 0
    compliance_violation_count: int = 0
    pagerank_score: Optional[float] = None


class SiteReport(BaseModel):
    target_url: str
    total_pages_tested: int = 0
    overall_score: float = 0
    grade: str = "F"
    wcag_compliance_pct: float = 0
    total_defects: int = 0
    total_compliance_violations: int = 0
    defects_by_severity: dict[str, int] = {}
    wcag_violations: int = 0
    gdpr_violations: int = 0
    page_scores: list[PageScore] = []
    top_issues: list[dict] = []


class TestResult(BaseModel):
    run_id: str
    url: str
    status: str = "completed"
    pages: list[PageResult] = []
    overall_score: Optional[float] = None
    total_defects: int = 0
    report: Optional[SiteReport] = None       # Stage 6: Full site report


class HealthResponse(BaseModel):
    status: str
    version: str
    browser_ready: bool
