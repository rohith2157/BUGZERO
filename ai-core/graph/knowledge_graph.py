"""Neo4j Knowledge Graph Connector for the AutonomousQA Platform.

Saves pages, elements, defects, and runs directly into a property graph
enabling advanced queries (e.g. 'find all critical bugs reachable from login').
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from neo4j import AsyncGraphDatabase  # type: ignore
    HAS_NEO4J = True
except ImportError:
    HAS_NEO4J = False
    logger.info("neo4j module not installed. Graph functionality disabled.")

class KnowledgeGraph:
    """Manages connections and transactions to the Neo4j database."""

    def __init__(self, uri: str = "bolt://localhost:7687", user: str = "neo4j", password: str = "password"):
        self.uri = uri
        self.user = user
        self.password = password
        self.driver = None
        
        if HAS_NEO4J:
            try:
                self.driver = AsyncGraphDatabase.driver(  # type: ignore
                    self.uri, auth=(self.user, self.password))
                logger.info(f"KnowledgeGraph: Initialized connection to {self.uri}")
            except Exception as e:
                logger.error(f"KnowledgeGraph: Connection failed - {e}")

    async def close(self):
        """Close driver connections."""
        if self.driver:
            await self.driver.close()

    async def save_test_run(self, run_data: Dict):
        """Create a TestRun node."""
        if not self.driver:
            return

        query = """
        MERGE (r:TestRun {run_id: $run_id})
        SET r.url = $url,
            r.started_at = $started_at,
            r.completed_at = $completed_at
        """
        async with self.driver.session() as session:
            await session.run(query, **run_data)

    async def save_page_node(self, page_data: Dict):
        """Create or update a Page node."""
        if not self.driver:
            return

        query = """
        MERGE (p:Page {url: $url})
        SET p.title = $title,
            p.pagerank_score = $pagerank_score,
            p.page_type = $page_type,
            p.health_score = $health_score,
            p.test_run_id = $test_run_id
        """
        async with self.driver.session() as session:
            # handle default none values before throwing to neo4j
            params = {
                "url": page_data.get("url"),
                "title": page_data.get("title", ""),
                "pagerank_score": page_data.get("score", 0.0),
                "page_type": page_data.get("page_type", "unknown"),
                "health_score": page_data.get("health_score", 100.0),
                "test_run_id": page_data.get("run_id", "unknown")
            }
            await session.run(query, **params)

    async def save_element_node(self, element_data: Dict, page_url: str):
        """Create an Element node and link it to its Page."""
        if not self.driver:
            return

        query = """
        MATCH (p:Page {url: $page_url})
        MERGE (e:Element {selector: $selector})
        SET e.element_type = $element_type,
            e.text_content = $text_content,
            e.aria_label = $aria_label,
            e.is_interactive = $is_interactive
        MERGE (p)-[:CONTAINS]->(e)
        """
        async with self.driver.session() as session:
            params = {
                "page_url": page_url,
                "selector": element_data.get("selector"),
                "element_type": element_data.get("element_type", "unknown"),
                "text_content": element_data.get("text_content", ""),
                "aria_label": element_data.get("aria_label", ""),
                "is_interactive": element_data.get("is_interactive", False)
            }
            await session.run(query, **params)

    async def save_bug_node(self, bug_data: Dict, page_url: str, element_selector: Optional[str] = None):
        """Create a Bug node, link it to the page, and optionally link to an Element."""
        if not self.driver:
            return

        # Match Page, merge Bug, link Page -> Bug
        query_page = """
        MATCH (p:Page {url: $page_url})
        MERGE (b:Bug {bug_id: $bug_id})
        SET b.type = $type,
            b.severity = $severity,
            b.description = $description,
            b.screenshot_path = $screenshot_path,
            b.detected_at = $detected_at,
            b.wcag_rule = $wcag_rule
        MERGE (p)-[:HAS_BUG]->(b)
        """

        # Link Element -> Bug if a selector is provided
        query_element = """
        MATCH (e:Element {selector: $selector}), (b:Bug {bug_id: $bug_id})
        MERGE (e)-[:HAS_BUG]->(b)
        """
        
        async with self.driver.session() as session:
            params = {
                "page_url": page_url,
                "bug_id": bug_data.get("id", f"{page_url}-{datetime.now().timestamp()}"),
                "type": bug_data.get("type", "unknown"),
                "severity": bug_data.get("severity", "moderate"),
                "description": bug_data.get("description", ""),
                "screenshot_path": bug_data.get("screenshot_path", ""),
                "detected_at": bug_data.get("detected_at", datetime.now().isoformat()),
                "wcag_rule": bug_data.get("wcag_rule", "")
            }
            await session.run(query_page, **params)

            if element_selector:
                await session.run(query_element, selector=element_selector, bug_id=params["bug_id"])

    async def link_pages(self, source_url: str, target_url: str):
        """Create a LINKS_TO relationship between pages."""
        if not self.driver:
            return

        query = """
        MATCH (s:Page {url: $source_url})
        MERGE (t:Page {url: $target_url})
        MERGE (s)-[:LINKS_TO]->(t)
        """
        async with self.driver.session() as session:
            await session.run(query, source_url=source_url, target_url=target_url)

    async def mark_critical_path(self):
        """Marks the highest PageRank path through graph. (Placeholder for algorithm)"""
        if not self.driver:
            return
        # A more sophisticated Cypher algorithm is required to truly find critical paths; 
        # Here we demonstrate setting marking nodes based on pagerank dynamically.
        query = """
        MATCH (p:Page)-[r:LINKS_TO]->(t:Page)
        WHERE p.pagerank_score > 0.8 AND t.pagerank_score > 0.8
        MERGE (p)-[:CRITICAL_PATH_TO]->(t)
        """
        try:
            async with self.driver.session() as session:
                await session.run(query)
            logger.info("KnowledgeGraph: Critical path mapped based on PageRank densities.")
        except Exception as e:
            logger.error(f"KnowledgeGraph: Failed to map critical path - {e}")

    async def get_site_health_map(self) -> List[Dict]:
        """Full site topology with health scores."""
        if not self.driver:
            return []
        
        query = """
        MATCH (p:Page)
        OPTIONAL MATCH (p)-[:HAS_BUG]->(b:Bug)
        RETURN p.url AS url, 
               p.pagerank_score AS pagerank_score, 
               p.health_score AS health_score,
               count(b) as total_bugs,
               count(CASE WHEN b.severity='critical' THEN 1 END) as critical_bugs
        ORDER BY p.pagerank_score DESC
        """
        try:
            async with self.driver.session() as session:
                result = await session.run(query)
                records = await result.data()
                return records
        except Exception as e:
            logger.error(f"KnowledgeGraph: Fetching site health map failed - {e}")
            return []
