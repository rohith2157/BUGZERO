"""PageRank Scheduler — scores pages by importance and sorts for optimal testing order.

Stage 3 of AutonomousQA pipeline:
  1. Build a directed graph from crawled pages and their links
  2. Run PageRank to calculate importance scores
  3. Apply defect history and change detection boosting
  4. Greedy-sort pages so the most critical are tested first
"""

import logging

logger = logging.getLogger(__name__)

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False
    logger.warning("networkx not installed — PageRank scoring disabled. Install with: pip install networkx")


def calculate_pagerank(pages: list[dict], alpha: float = 0.85) -> dict[str, float]:
    """Build a link graph from crawled pages and return PageRank scores.

    Args:
        pages: List of page dicts from the crawler. Each page should have:
               - 'url': the page URL
               - 'links': list of outgoing URLs (optional, extracted during crawl)
        alpha: Damping factor for PageRank (default 0.85, same as Google)

    Returns:
        Dictionary mapping URL -> importance score (0.0 to 1.0)
    """
    if not HAS_NETWORKX:
        # Fallback: equal scores for all pages
        return {p["url"]: 1.0 / max(len(pages), 1) for p in pages}

    if not pages:
        return {}

    # Build directed graph
    G = nx.DiGraph()

    for page in pages:
        url = page["url"]
        G.add_node(url)
        for link in page.get("links", []):
            if link != url:  # No self-loops
                G.add_edge(url, link)

    # Run PageRank
    try:
        scores = nx.pagerank(G, alpha=alpha)
    except nx.PowerIterationFailedConvergence:
        # Fallback if convergence fails — use degree centrality
        logger.warning("PageRank convergence failed, falling back to degree centrality")
        scores = nx.degree_centrality(G)

    return scores


def _page_type_boost(page: dict) -> float:
    """Give bonus scores to page types that are more likely to have bugs."""
    page_type = page.get("page_type", "Content").lower()
    boosts = {
        "auth": 0.15,       # Login/signup — critical for security
        "form": 0.12,       # Forms — input validation bugs
        "settings": 0.10,   # Settings — permission + state bugs
        "dashboard": 0.08,  # Dashboards — data rendering bugs
        "data table": 0.05, # Tables — pagination, sorting bugs
        "content": 0.0,     # Static content — lowest priority
    }
    return boosts.get(page_type, 0.0)


def apply_defect_history_boost(pages: list[dict], defect_history: dict[str, int]) -> None:
    """Boost pages that had defects in previous runs (recidivism scoring).

    Pages with more historical defects get higher priority — they're more
    likely to have bugs again.

    Args:
        pages: List of page dicts (modified in-place, adds 'defect_history_boost')
        defect_history: Dict mapping URL -> total defect count from previous runs
    """
    if not defect_history:
        return

    for page in pages:
        url = page["url"]
        prev_defects = defect_history.get(url, 0)
        if prev_defects > 0:
            # Logarithmic scaling: 1 defect = +0.03, 10 = +0.10, 30+ capped at +0.20
            import math
            boost = min(0.20, math.log1p(prev_defects) * 0.04)
            page["defect_history_boost"] = round(boost, 4)
            page["defect_history_count"] = prev_defects
        else:
            page["defect_history_boost"] = 0.0
            page["defect_history_count"] = 0

    boosted = sum(1 for p in pages if p.get("defect_history_boost", 0) > 0)
    if boosted:
        logger.info(f"Defect history: {boosted}/{len(pages)} pages boosted based on {sum(defect_history.values())} historical defects")


def apply_change_detection_boost(pages: list[dict], previous_scores: dict[str, float]) -> None:
    """Boost pages whose hygiene scores dropped in previous runs.

    Pages that previously scored well but then degraded get higher priority —
    they represent regressions that need attention.

    Args:
        pages: List of page dicts (modified in-place, adds 'change_boost')
        previous_scores: Dict mapping URL -> previous hygiene score (0-100)
    """
    if not previous_scores:
        return

    for page in pages:
        url = page["url"]
        prev_score = previous_scores.get(url)
        if prev_score is not None and prev_score < 70:
            # Score was poor previously — boost proportionally to how bad it was
            boost = max(0, (70 - prev_score) * 0.003)
            page["change_boost"] = round(min(0.15, boost), 4)
            page["previous_score"] = prev_score
        else:
            page["change_boost"] = 0.0
            page["previous_score"] = prev_score

    boosted = sum(1 for p in pages if p.get("change_boost", 0) > 0)
    if boosted:
        logger.info(f"Change detection: {boosted}/{len(pages)} pages boosted due to previous score drops")


def greedy_sort(
    pages: list[dict],
    scores: dict[str, float],
    defect_history: dict[str, int] | None = None,
    previous_scores: dict[str, float] | None = None,
) -> list[dict]:
    """Sort pages by combined risk score (descending) with multi-factor boosting.

    Risk factors:
      1. PageRank importance (structural)
      2. Page type risk boost (heuristic)
      3. Defect history boost (recidivism) — from previous runs
      4. Change detection boost (regression) — from previous scores

    Args:
        pages: List of page dicts from crawler
        scores: PageRank scores from calculate_pagerank()
        defect_history: Optional dict of URL -> previous defect count
        previous_scores: Optional dict of URL -> previous hygiene score

    Returns:
        Sorted list of pages (highest priority first), each page gets
        a 'pagerank_score' field and risk boost fields added
    """
    # Apply defect history and change detection boosts
    if defect_history:
        apply_defect_history_boost(pages, defect_history)
    if previous_scores:
        apply_change_detection_boost(pages, previous_scores)

    for page in pages:
        base_score = scores.get(page["url"], 0.0)
        type_boost = _page_type_boost(page)
        history_boost = page.get("defect_history_boost", 0.0)
        change_boost = page.get("change_boost", 0.0)

        combined = base_score + type_boost + history_boost + change_boost
        page["pagerank_score"] = round(combined, 6)
        page["risk_factors"] = {
            "pagerank": round(base_score, 4),
            "type_boost": round(type_boost, 4),
            "defect_history_boost": round(history_boost, 4),
            "change_boost": round(change_boost, 4),
        }

    sorted_pages = sorted(pages, key=lambda p: p["pagerank_score"], reverse=True)

    # Log the top 5 for debugging
    if sorted_pages:
        logger.info("Risk priority order (top 5):")
        for i, p in enumerate(sorted_pages[:5]):
            factors = p.get("risk_factors", {})
            logger.info(
                f"  {i+1}. [{p.get('page_type', 'unknown')}] {p['url']} — "
                f"score: {p['pagerank_score']} "
                f"(PR:{factors.get('pagerank', 0):.3f} + type:{factors.get('type_boost', 0):.2f} "
                f"+ hist:{factors.get('defect_history_boost', 0):.3f} + chg:{factors.get('change_boost', 0):.3f})"
            )

    return sorted_pages
