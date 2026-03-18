"""PageRank Scheduler — scores pages by importance and sorts for optimal testing order.

Stage 3 of AutonomousQA pipeline:
  1. Build a directed graph from crawled pages and their links
  2. Run PageRank to calculate importance scores
  3. Greedy-sort pages so the most critical are tested first
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


def greedy_sort(pages: list[dict], scores: dict[str, float]) -> list[dict]:
    """Sort pages by PageRank score (descending) with page-type boosting.

    Args:
        pages: List of page dicts from crawler
        scores: PageRank scores from calculate_pagerank()

    Returns:
        Sorted list of pages (highest priority first), each page gets
        a 'pagerank_score' field added
    """
    for page in pages:
        base_score = scores.get(page["url"], 0.0)
        boost = _page_type_boost(page)
        page["pagerank_score"] = round(base_score + boost, 6)

    sorted_pages = sorted(pages, key=lambda p: p["pagerank_score"], reverse=True)

    # Log the top 5 for debugging
    if sorted_pages:
        logger.info("PageRank priority order (top 5):")
        for i, p in enumerate(sorted_pages[:5]):
            logger.info(f"  {i+1}. [{p.get('page_type', 'unknown')}] {p['url']} — score: {p['pagerank_score']}")

    return sorted_pages
