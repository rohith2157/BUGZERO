"""Tester Agent — runs tests on each discovered page."""

from tools.playwright_tool import PlaywrightTool
from models.schemas import PageResult, DefectResult, ComplianceViolation, PerformanceMetric


class TesterAgent:
    """Tests each page for functional, accessibility, SEO, and performance issues."""

    def __init__(self, playwright_tool: PlaywrightTool):
        self.tool = playwright_tool

    async def test_page(self, url: str, modules: list[str] | None = None) -> PageResult:
        """Run all enabled test modules on a single page."""
        raw = await self.tool.test_page(url)

        defects = []
        for d in raw.get("defects", []):
            defects.append(DefectResult(
                type=d["type"],
                severity=d["severity"],
                message=d["message"],
                fix=d.get("fix"),
            ))

        compliance = []
        for v in raw.get("accessibility", []):
            compliance.append(ComplianceViolation(
                standard=v["standard"],
                criterion=v["criterion"],
                severity=v["severity"],
                description=v["description"],
                remediation=v.get("remediation"),
            ))

        performance = {}
        for name, data in raw.get("performance", {}).items():
            performance[name] = PerformanceMetric(
                value=data["value"],
                rating=data.get("rating"),
            )

        # Calculate hygiene score
        severity_weights = {"critical": 15, "major": 8, "minor": 3, "warning": 1}
        penalty = sum(severity_weights.get(d.severity, 3) for d in defects)
        penalty += sum(severity_weights.get(v.severity, 2) for v in compliance)
        hygiene_score = max(0, min(100, 100 - penalty))

        return PageResult(
            url=url,
            page_type=raw.get("page_type"),
            hygiene_score=hygiene_score,
            defects=defects,
            compliance=compliance,
            performance=performance,
        )
