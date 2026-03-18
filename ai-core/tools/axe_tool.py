"""axe-core Accessibility Tool — injects axe-core into pages for WCAG 2.1 auditing.

Stage 5 of AutonomousQA pipeline:
  - Injects axe-core JavaScript library into the Playwright page
  - Runs axe.run() to scan the entire DOM
  - Returns structured WCAG violations with severity and remediation guidance

No API key needed. No installation needed. Loads axe-core from CDN.
"""

import logging

logger = logging.getLogger(__name__)

# axe-core CDN URL — automatically loads the library into any page
AXE_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js"

# Map axe-core impact levels to our severity system
IMPACT_TO_SEVERITY = {
    "critical": "critical",
    "serious": "major",
    "moderate": "minor",
    "minor": "warning",
}

# Map axe-core tags to WCAG criteria
def _extract_wcag_criterion(tags: list[str]) -> str:
    """Extract WCAG criterion from axe-core tags like 'wcag2a', 'wcag111'."""
    for tag in tags:
        if tag.startswith("wcag") and len(tag) > 5:
            # e.g., 'wcag111' → '1.1.1'
            digits = tag[4:]
            if digits.isdigit() and len(digits) >= 3:
                return f"{digits[0]}.{digits[1]}.{digits[2]}"
    # Return general WCAG level
    for tag in tags:
        if tag == "wcag2a":
            return "Level A"
        elif tag == "wcag2aa":
            return "Level AA"
        elif tag == "wcag2aaa":
            return "Level AAA"
    return "General"


def run_axe_sync(page) -> list[dict]:
    """Inject axe-core into a Playwright page and run accessibility scan.

    Args:
        page: A Playwright page object (sync API)

    Returns:
        List of violation dicts, each containing:
        - standard: "WCAG"
        - criterion: WCAG rule reference
        - severity: critical/major/minor/warning
        - description: Human-readable description
        - remediation: How to fix it
        - affected_elements: HTML snippets of violating elements
        - rule_id: axe-core rule identifier
        - help_url: Link to detailed axe docs
    """
    violations = []

    try:
        # Inject axe-core library
        page.add_script_tag(url=AXE_CDN_URL)

        # Wait a moment for the script to load
        page.wait_for_timeout(1000)

        # Run axe.run() — returns full results
        axe_results = page.evaluate("""async () => {
            try {
                if (typeof axe === 'undefined') return { violations: [], error: 'axe not loaded' };
                const results = await axe.run();
                return {
                    violations: results.violations.map(v => ({
                        id: v.id,
                        impact: v.impact,
                        description: v.description,
                        help: v.help,
                        helpUrl: v.helpUrl,
                        tags: v.tags,
                        nodes: v.nodes.map(n => ({
                            html: n.html,
                            target: n.target,
                            failureSummary: n.failureSummary
                        })).slice(0, 5)  // Limit to 5 nodes per violation
                    }))
                };
            } catch(e) {
                return { violations: [], error: e.message };
            }
        }""")

        if axe_results.get("error"):
            logger.warning(f"axe-core: {axe_results['error']}")
            return violations

        for v in axe_results.get("violations", []):
            impact = v.get("impact", "minor")
            severity = IMPACT_TO_SEVERITY.get(impact, "minor")
            criterion = _extract_wcag_criterion(v.get("tags", []))

            # Get affected element HTML snippets
            affected = [node.get("html", "") for node in v.get("nodes", [])]
            failure_summaries = [node.get("failureSummary", "") for node in v.get("nodes", []) if node.get("failureSummary")]

            # Build remediation from failure summaries
            remediation = "; ".join(set(failure_summaries[:3])) if failure_summaries else v.get("help", "")

            violations.append({
                "standard": "WCAG",
                "criterion": criterion,
                "severity": severity,
                "description": v.get("description", v.get("help", "Accessibility violation")),
                "remediation": remediation,
                "rule_id": v.get("id", ""),
                "help_url": v.get("helpUrl", ""),
                "affected_elements": affected[:3],  # Limit to 3 examples
                "instance_count": len(v.get("nodes", [])),
            })

        logger.info(f"axe-core: Found {len(violations)} accessibility violation(s)")

    except Exception as e:
        logger.error(f"axe-core: Scan failed — {e}")

    return violations
