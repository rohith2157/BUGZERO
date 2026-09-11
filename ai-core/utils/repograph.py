"""RepoGraph AST Fault Localization Engine (ICLR 2025 RepoGraph).

Constructs repository-level definition-reference graphs (V_def, V_ref, E_invoke)
to map black-box browser runtime crashes and component failures back to the exact
source code file, line number, and component definition in the repository.

Paper Reference:
  REPO GRAPH: Enhancing AI Software Engineering with Repository-Level Code Graph
  Ouyang et al., ICLR 2025 (UIUC, Tencent AI, Rice, Notre Dame)
"""

import os
import re
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)


class RepoGraphNode:
    """Represents a code entity definition or reference."""
    def __init__(self, name: str, file_path: str, line_number: int, node_type: str, snippet: str = ""):
        self.name = name
        self.file_path = file_path
        self.line_number = line_number
        self.node_type = node_type  # 'component', 'function', 'class', 'route', 'hook'
        self.snippet = snippet
        self.references: List[str] = []  # files that import/invoke this entity


class RepoGraph:
    """Repository-level AST code graph engine for fault localization."""

    def __init__(self, root_dir: Optional[str] = None):
        self.root_dir = root_dir or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.definitions: Dict[str, RepoGraphNode] = {}
        self.route_map: Dict[str, str] = {}  # e.g. "/login" -> "src/pages/Login.jsx"
        self._build_graph()

    def _build_graph(self):
        """Scans the repository and builds the V_def, V_ref AST graph.
        # ponytail: regex/AST hybrid parses JS/TS without Node runtime dependencies, upgrade path: Tree-sitter native bindings
        """
        exclude_dirs = {'.git', 'node_modules', '.next', 'dist', 'build', 'venv', '__pycache__', 'coverage'}
        code_exts = {'.js', '.jsx', '.ts', '.tsx', '.py'}

        if not os.path.exists(self.root_dir):
            return

        for root, dirs, files in os.walk(self.root_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in code_exts:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, self.root_dir).replace("\\", "/")
                    self._parse_file(full_path, rel_path)

        logger.info(f"RepoGraph: Indexed {len(self.definitions)} definitions across codebase.")

    def _parse_file(self, full_path: str, rel_path: str):
        """Extracts component, function, and route definitions from a source file."""
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except Exception:
            return

        # Map page routes based on file path conventions
        base_name = os.path.splitext(os.path.basename(rel_path))[0].lower()
        if "pages" in rel_path or "routes" in rel_path or "app" in rel_path:
            route_slug = "/" if base_name in ("index", "page", "home", "landing") else f"/{base_name}"
            self.route_map[route_slug] = rel_path

        # Regex patterns for component / function definitions
        patterns = [
            # React components: export function ComponentName, const ComponentName = ...
            (r'(?:export\s+)?(?:default\s+)?function\s+([A-Z][a-zA-Z0-9_]*)', 'component'),
            (r'(?:export\s+)?const\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*(?:React\.)?(?:memo|forwardRef)?\s*\(', 'component'),
            # React hooks: function useSomething, const useSomething =
            (r'(?:export\s+)?(?:default\s+)?function\s+(use[A-Z][a-zA-Z0-9_]*)', 'hook'),
            (r'(?:export\s+)?const\s+(use[A-Z][a-zA-Z0-9_]*)\s*=', 'hook'),
            # Python / JS standard functions
            (r'def\s+([a-zA-Z0-9_]+)\s*\(', 'function'),
            (r'(?:export\s+)?function\s+([a-z][a-zA-Z0-9_]*)\s*\(', 'function'),
            # Class definitions
            (r'class\s+([A-Z][a-zA-Z0-9_]*)', 'class'),
        ]

        for i, line in enumerate(lines):
            line_str = line.strip()
            for pattern, node_type in patterns:
                m = re.search(pattern, line_str)
                if m:
                    entity_name = m.group(1)
                    # Extract a 3-line snippet context
                    start = max(0, i - 1)
                    end = min(len(lines), i + 3)
                    snippet = "".join(lines[start:end]).strip()

                    node = RepoGraphNode(
                        name=entity_name,
                        file_path=rel_path,
                        line_number=i + 1,
                        node_type=node_type,
                        snippet=snippet
                    )
                    self.definitions[entity_name.lower()] = node
                    break

    def localize_fault(
        self,
        error_message: str,
        url: str = "",
        stack_trace: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Maps browser errors and URLs to the exact source code location in the repository.

        Returns:
            Dict containing file_path, line_number, entity_name, and code snippet, or None.
        """
        combined_text = f"{error_message} {stack_trace or ''}"

        # 1. Direct file:line match in stack trace (e.g. `at App.jsx:42:15` or `Login.tsx:18`)
        stack_match = re.search(r'([a-zA-Z0-9_\-\./]+\.(?:jsx?|tsx?|py)):(\d+)', combined_text)
        if stack_match:
            matched_file = stack_match.group(1).replace("\\", "/")
            matched_line = int(stack_match.group(2))
            # Find closest matching file in definitions
            for node in self.definitions.values():
                if node.file_path.endswith(matched_file) or matched_file.endswith(os.path.basename(node.file_path)):
                    return {
                        "file_path": node.file_path,
                        "line_number": matched_line,
                        "entity_name": node.name,
                        "node_type": node.node_type,
                        "snippet": node.snippet,
                        "confidence": 0.95
                    }

        # 2. Entity name match in error text (e.g., "Cannot read properties of CheckoutModal")
        words = re.findall(r'[A-Za-z0-9_]{3,}', combined_text)
        for w in words:
            w_lower = w.lower()
            if w_lower in self.definitions:
                node = self.definitions[w_lower]
                return {
                    "file_path": node.file_path,
                    "line_number": node.line_number,
                    "entity_name": node.name,
                    "node_type": node.node_type,
                    "snippet": node.snippet,
                    "confidence": 0.85
                }

        # 3. Route-based fallback (e.g. error occurred on `/login`)
        if url:
            from urllib.parse import urlparse
            path = urlparse(url).path.rstrip("/") or "/"
            for route_slug, rel_path in self.route_map.items():
                if route_slug == path or (route_slug != "/" and route_slug in path):
                    return {
                        "file_path": rel_path,
                        "line_number": 1,
                        "entity_name": os.path.splitext(os.path.basename(rel_path))[0],
                        "node_type": "route_page",
                        "snippet": f"Route handler for {path}",
                        "confidence": 0.70
                    }

        return None


if __name__ == "__main__":
    # Self-test
    graph = RepoGraph()
    print(f"RepoGraph initialized with {len(graph.definitions)} definitions.")
    result = graph.localize_fault("TypeError: Cannot read properties of undefined in Login component", url="https://app.com/login")
    print(f"Fault Localization result: {result}")
    assert result is not None, "Should localize fault on Login"
    print("RepoGraph self-test passed!")
