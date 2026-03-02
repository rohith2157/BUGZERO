"""Page classifier — detects page type using heuristic analysis."""

from urllib.parse import urlparse


# Keyword maps for classification
_CLASSIFIERS = [
    ("auth", ["login", "signin", "sign-in", "signup", "sign-up", "register", "password", "forgot-password", "reset-password"]),
    ("dashboard", ["dashboard", "overview", "analytics", "chart", "graph", "metrics", "stats"]),
    ("form", []),  # handled by input count
    ("wizard", ["step", "wizard", "progress", "onboarding", "setup"]),
    ("report", ["report", "export", "download", "summary", "invoice"]),
    ("list", []),  # handled by table / list detection
]


class PageClassifier:
    """Classifies a web page into a type based on URL and HTML content."""

    def classify(self, page_html: str, url: str) -> str:
        """Classify a page into one of the known types.

        Returns one of: dashboard, form, list, wizard, report, auth, home, detail
        """
        html_lower = page_html.lower()
        url_lower = urlparse(url).path.lower()

        # 1. Check URL path first (strongest signal)
        for page_type, keywords in _CLASSIFIERS:
            for kw in keywords:
                if kw in url_lower:
                    return page_type

        # 2. Check if it's the root/home page
        path = urlparse(url).path.rstrip("/")
        if path == "" or path == "/":
            return "home"
        if any(kw in html_lower for kw in ["hero", "landing", "welcome"]):
            return "home"

        # 3. Auth detection in HTML content
        auth_signals = sum(1 for kw in ["login", "sign in", "password", "register", "sign up"] if kw in html_lower)
        if auth_signals >= 2:
            return "auth"

        # 4. Dashboard detection
        dashboard_signals = sum(1 for kw in ["dashboard", "analytics", "chart", "graph", "overview"] if kw in html_lower)
        if dashboard_signals >= 2:
            return "dashboard"

        # 5. Wizard detection
        wizard_signals = sum(1 for kw in ["step 1", "step 2", "wizard", "progress"] if kw in html_lower)
        if wizard_signals >= 2:
            return "wizard"

        # 6. Report detection
        report_signals = sum(1 for kw in ["report", "export", "download", "summary"] if kw in html_lower)
        if report_signals >= 2:
            return "report"

        # 7. Form detection — count input fields
        input_count = html_lower.count("<input")
        textarea_count = html_lower.count("<textarea")
        select_count = html_lower.count("<select")
        total_fields = input_count + textarea_count + select_count
        if total_fields > 3:
            return "form"

        # 8. List/table detection
        table_count = html_lower.count("<table")
        li_count = html_lower.count("<li")
        if table_count > 0 or li_count > 10:
            return "list"

        # 9. Default
        return "detail"
