"""Report Agent — generates comprehensive site-wide compliance reports.

Stage 6 of AutonomousQA pipeline:
  - Aggregates defects from all pages
  - Calculates per-page and site-wide scores
  - Generates WCAG compliance percentage
  - Assigns overall grade (A+ to F)
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


# Severity weights for score calculation
SEVERITY_WEIGHTS = {
    "critical": 20,
    "major": 10,
    "minor": 4,
    "warning": 1,
    "serious": 12,  # axe-core uses 'serious'
    "moderate": 6,   # axe-core uses 'moderate'
}

# Grade thresholds
GRADE_THRESHOLDS = [
    (95, "A+"), (90, "A"), (85, "A-"),
    (80, "B+"), (75, "B"), (70, "B-"),
    (65, "C+"), (60, "C"), (55, "C-"),
    (50, "D+"), (45, "D"), (40, "D-"),
    (0,  "F"),
]


def _calculate_grade(score: float) -> str:
    """Convert a numeric score (0-100) to a letter grade."""
    for threshold, grade in GRADE_THRESHOLDS:
        if score >= threshold:
            return grade
    return "F"


class ReportAgent:
    """Generates comprehensive site-wide QA reports from test results."""

    def generate_report(self, pages: list, url: str) -> dict:
        """Generate a full site report from tested pages.

        Args:
            pages: List of PageResult objects (Pydantic models) from testing
            url: The original target URL

        Returns:
            SiteReport dict with scores, grades, and aggregated defect data
        """
        if not pages:
            return self._empty_report(url)

        # Aggregate defects by severity
        severity_counts = {"critical": 0, "major": 0, "minor": 0, "warning": 0}
        total_defects = 0
        total_compliance_violations = 0
        wcag_violations = 0
        gdpr_violations = 0

        page_scores = []

        for page in pages:
            # Count defects
            page_defect_count = len(page.defects) if hasattr(page, 'defects') else 0
            page_compliance_count = len(page.compliance) if hasattr(page, 'compliance') else 0
            total_defects += page_defect_count
            total_compliance_violations += page_compliance_count

            for d in (page.defects if hasattr(page, 'defects') else []):
                sev = d.severity if hasattr(d, 'severity') else 'minor'
                severity_counts[sev] = severity_counts.get(sev, 0) + 1

            for v in (page.compliance if hasattr(page, 'compliance') else []):
                standard = v.standard if hasattr(v, 'standard') else ''
                sev = v.severity if hasattr(v, 'severity') else 'minor'
                severity_counts[sev] = severity_counts.get(sev, 0) + 1

                if standard == "WCAG":
                    wcag_violations += 1
                elif standard == "GDPR":
                    gdpr_violations += 1

            # Calculate per-page scores
            hygiene = page.hygiene_score if hasattr(page, 'hygiene_score') and page.hygiene_score is not None else 0
            pagerank = page.pagerank_score if hasattr(page, 'pagerank_score') and page.pagerank_score is not None else 0

            # Accessibility score: start at 100, deduct for violations
            a11y_penalty = sum(
                SEVERITY_WEIGHTS.get(
                    (v.severity if hasattr(v, 'severity') else 'minor'), 4
                )
                for v in (page.compliance if hasattr(page, 'compliance') else [])
            )
            accessibility_score = max(0, min(100, 100 - a11y_penalty))

            # Visual score from Gemini (if available)
            visual_score = page.vision_quality_score if hasattr(page, 'vision_quality_score') and page.vision_quality_score is not None else None

            # Overall page health
            components = [hygiene, accessibility_score]
            if visual_score is not None:
                components.append(visual_score)
            health_score = sum(components) / len(components) if components else 0

            page_scores.append({
                "url": page.url,
                "page_type": page.page_type if hasattr(page, 'page_type') else None,
                "hygiene_score": round(hygiene, 1),
                "accessibility_score": round(accessibility_score, 1),
                "visual_score": round(visual_score, 1) if visual_score is not None else None,
                "health_score": round(health_score, 1),
                "defect_count": page_defect_count,
                "compliance_violation_count": page_compliance_count,
                "pagerank_score": round(pagerank, 6) if pagerank else None,
            })

        # Site-wide scores
        if page_scores:
            overall_score = sum(p["health_score"] for p in page_scores) / len(page_scores)
        else:
            overall_score = 0

        # WCAG compliance percentage
        total_pages = len(pages)
        pages_with_wcag_issues = sum(1 for p in page_scores if p["compliance_violation_count"] > 0)
        wcag_compliance_pct = round(((total_pages - pages_with_wcag_issues) / max(total_pages, 1)) * 100, 1)

        overall_grade = _calculate_grade(overall_score)

        report = {
            "target_url": url,
            "total_pages_tested": total_pages,
            "overall_score": round(overall_score, 1),
            "grade": overall_grade,
            "wcag_compliance_pct": wcag_compliance_pct,
            "total_defects": total_defects,
            "total_compliance_violations": total_compliance_violations,
            "defects_by_severity": severity_counts,
            "wcag_violations": wcag_violations,
            "gdpr_violations": gdpr_violations,
            "page_scores": page_scores,
            # Top issues for quick summary
            "top_issues": self._get_top_issues(pages),
        }

        logger.info(
            f"Report generated: {total_pages} pages, score={overall_score:.1f}, "
            f"grade={overall_grade}, defects={total_defects}"
        )

        return report

    def _get_top_issues(self, pages: list, max_issues: int = 10) -> list[dict]:
        """Extract the most critical issues across all pages."""
        all_issues = []

        severity_priority = {"critical": 0, "major": 1, "serious": 1, "moderate": 2, "minor": 3, "warning": 4}

        for page in pages:
            url = page.url if hasattr(page, 'url') else ''
            for d in (page.defects if hasattr(page, 'defects') else []):
                all_issues.append({
                    "page": url,
                    "type": d.type if hasattr(d, 'type') else 'Unknown',
                    "severity": d.severity if hasattr(d, 'severity') else 'minor',
                    "message": d.message if hasattr(d, 'message') else '',
                    "fix": d.fix if hasattr(d, 'fix') else None,
                })

        # Sort by severity (most critical first)
        all_issues.sort(key=lambda x: severity_priority.get(x["severity"], 5))

        return all_issues[:max_issues]

    def _empty_report(self, url: str) -> dict:
        """Return an empty report when no pages were tested."""
        return {
            "target_url": url,
            "total_pages_tested": 0,
            "overall_score": 0,
            "grade": "F",
            "wcag_compliance_pct": 0,
            "total_defects": 0,
            "total_compliance_violations": 0,
            "defects_by_severity": {"critical": 0, "major": 0, "minor": 0, "warning": 0},
            "wcag_violations": 0,
            "gdpr_violations": 0,
            "page_scores": [],
            "top_issues": [],
        }
