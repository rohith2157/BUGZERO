"""Tester Agent — runs tests on each discovered page."""

from tools.playwright_tool import PlaywrightTool
from models.schemas import PageResult, DefectResult, ComplianceViolation, PerformanceMetric
from agents.vision_agent import VisionAgent


class TesterAgent:
    """Tests each page for functional, accessibility, SEO, and performance issues."""

    def __init__(self, playwright_tool: PlaywrightTool):
        self.tool = playwright_tool

    async def test_page(self, url: str, modules: list[str] | None = None, previous_performance: dict | None = None) -> PageResult:
        """Run all enabled test modules on a single page."""
        if modules is None:
            modules = ["functional", "accessibility", "performance", "seo", "compliance"]

        raw = await self.tool.test_page(url)

        defects = []
        for d in raw.get("defects", []):
            dtype = d["type"]
            m_key = None
            if dtype in ["Accessibility", "WCAG"]:
                m_key = "accessibility"
            elif dtype == "SEO":
                m_key = "seo"
            elif dtype == "Functional":
                m_key = "functional"

            if m_key is None or m_key in modules:
                defects.append(DefectResult(
                    type=d["type"],
                    severity=d["severity"],
                    message=d["message"],
                    fix=d.get("fix"),
                ))

        compliance = []
        for v in raw.get("accessibility", []):
            standard = v.get("standard", "WCAG")
            m_key = "compliance" if standard == "GDPR" else "accessibility"
            if m_key in modules:
                compliance.append(ComplianceViolation(
                    standard=standard,
                    criterion=v["criterion"],
                    severity=v["severity"],
                    description=v["description"],
                    remediation=v.get("remediation"),
                ))

        performance = {}
        if "performance" in modules:
            for name, data in raw.get("performance", {}).items():
                val = data["value"]
                performance[name] = PerformanceMetric(
                    value=val,
                    rating=data.get("rating"),
                )
                
                # Compare against baseline if available
                if previous_performance and name in previous_performance:
                    prev_val = previous_performance[name].get("value", 0)
                    if prev_val > 0 and val > prev_val * 1.2:  # Degraded by > 20%
                        defects.append(DefectResult(
                            type="Performance",
                            severity="major",
                            message=f"Performance Regression: {name} degraded from {prev_val} to {val} (>20% worse)",
                            fix=f"Investigate {name} regressions under throttled network/CPU conditions."
                        ))

        # Check visual layout defects mathematically
        elements = raw.get("elements", [])
        if elements and ("visual" in modules or not modules):
            vision = VisionAgent()
            overlap_defects = vision.check_bounding_box_overlaps(elements)
            for d in overlap_defects:
                defects.append(DefectResult(
                    type=d["type"],
                    severity=d["severity"],
                    message=d["message"],
                    fix=d.get("fix")
                ))

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
