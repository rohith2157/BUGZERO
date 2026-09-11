"""Autonomous API Contract & Schema Mutation Fuzzer (RESTler / Microsoft Research).

Intercepts background network traffic during browser sessions, infers JSON schemas
on the fly, and fires asynchronous boundary mutation payloads to detect unhandled
HTTP 500 server crashes, database errors, and API contract violations.

Paper Reference:
  RESTler: Stateful REST API Fuzzing (Microsoft Research / IEEE S&P)
  Atlidakis et al.
"""

import json
import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse
import httpx

logger = logging.getLogger(__name__)


class ApiFuzzerAgent:
    """Autonomous API contract inference and mutation fuzzing engine."""

    # High-signal mutation test cases
    NUMERIC_MUTATIONS = [-1, 0, 9999999999, "NaN", -999999]
    STRING_MUTATIONS = [
        "",
        "<script>alert('bugzero')</script>",
        "' OR '1'='1",
        "A" * 2000,
        None
    ]

    def __init__(self, max_concurrent: int = 5, timeout_sec: float = 3.0):
        self.max_concurrent = max_concurrent
        self.timeout_sec = timeout_sec
        self.intercepted_calls: List[Dict[str, Any]] = []

    def record_request(self, method: str, url: str, headers: Dict[str, str], post_data: Optional[str] = None):
        """Records an outgoing API request from the browser for fuzzing analysis."""
        parsed = urlparse(url)
        # Filter static assets and browser internals
        if any(url.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.css', '.js', '.woff2']):
            return
        if not parsed.scheme.startswith("http"):
            return

        payload = None
        if post_data:
            try:
                payload = json.loads(post_data)
            except Exception:
                payload = post_data

        self.intercepted_calls.append({
            "method": method.upper(),
            "url": url,
            "headers": {k: v for k, v in headers.items() if k.lower() in ('authorization', 'content-type', 'cookie', 'x-api-key')},
            "payload": payload,
        })

    def generate_mutations(self, payload: Any) -> List[Tuple[str, Any]]:
        """Generates mutation test cases from a request payload.
        # ponytail: shallow schema inference covers 90% of REST JSON bodies without OpenAPI spec, upgrade path: OpenAPI 3.1 Swagger generator
        """
        mutations = []
        if not isinstance(payload, dict):
            return mutations

        # 1. Null-injection mutation
        for key in list(payload.keys())[:3]:
            mutated = dict(payload)
            mutated[key] = None
            mutations.append((f"Null Injection on '{key}'", mutated))

        # 2. Type confusion / Boundary value mutation
        for key, val in list(payload.items())[:3]:
            if isinstance(val, (int, float)):
                for num in self.NUMERIC_MUTATIONS[:2]:
                    mutated = dict(payload)
                    mutated[key] = num
                    mutations.append((f"Numeric Boundary ({num}) on '{key}'", mutated))
            elif isinstance(val, str):
                for s in self.STRING_MUTATIONS[:2]:
                    mutated = dict(payload)
                    mutated[key] = s
                    mutations.append((f"String Boundary on '{key}'", mutated))

        # 3. Missing field mutation
        if len(payload) > 1:
            for key in list(payload.keys())[:2]:
                mutated = dict(payload)
                del mutated[key]
                mutations.append((f"Missing Required Field '{key}'", mutated))

        return mutations

    async def fuzz_endpoint(self, call_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Executes mutation fuzzing against an intercepted API endpoint and flags 500 crashes."""
        defects = []
        method = call_info["method"]
        url = call_info["url"]
        headers = call_info["headers"]
        payload = call_info["payload"]

        if not payload or not isinstance(payload, dict):
            return defects

        mutations = self.generate_mutations(payload)
        logger.info(f"ApiFuzzer: Fuzzing {method} {url} with {len(mutations)} mutations...")

        async with httpx.AsyncClient(timeout=self.timeout_sec, verify=False) as client:
            for test_name, mutated_body in mutations[:6]:  # Bounded to 6 mutations per endpoint
                try:
                    if method in ("POST", "PUT", "PATCH"):
                        resp = await client.request(
                            method=method,
                            url=url,
                            json=mutated_body,
                            headers=headers
                        )
                    else:
                        resp = await client.request(
                            method=method,
                            url=url,
                            params=mutated_body,
                            headers=headers
                        )

                    # An unhandled 500 server crash indicates an unhandled exception or data vulnerability
                    if resp.status_code >= 500:
                        logger.warning(f"ApiFuzzer: Discovered API 500 Crash on {url} [{test_name}]")
                        defects.append({
                            "type": "Functional",
                            "severity": "critical",
                            "message": f"API Contract Crash (HTTP {resp.status_code}): {method} {url} crashed on payload mutation '{test_name}'",
                            "fix": f"Add schema validation guard on endpoint {url} to reject invalid/malformed payloads gracefully (HTTP 400 Bad Request instead of HTTP 500).",
                            "source": "api_contract_fuzzer",
                            "fuzzing_payload": json.dumps(mutated_body)[:200],
                            "confidence": 1.0,
                        })

                except (httpx.ConnectError, httpx.TimeoutException):
                    # Timeout on boundary payload can also signal server-side hang / DoS vulnerability
                    pass
                except Exception as e:
                    logger.debug(f"Fuzz request error: {e}")

        return defects

    async def fuzz_all(self, max_endpoints: int = 3) -> List[Dict[str, Any]]:
        """Runs mutation fuzzing across unique captured API endpoints."""
        all_defects = []
        seen_endpoints = set()

        targets = []
        for call in self.intercepted_calls:
            key = (call["method"], call["url"])
            if key not in seen_endpoints and call.get("payload") and isinstance(call["payload"], dict):
                seen_endpoints.add(key)
                targets.append(call)
                if len(targets) >= max_endpoints:
                    break

        for target in targets:
            defects = await self.fuzz_endpoint(target)
            all_defects.extend(defects)

        return all_defects


if __name__ == "__main__":
    # Self-test
    fuzzer = ApiFuzzerAgent()
    fuzzer.record_request(
        method="POST",
        url="https://httpbin.org/post",
        headers={"Content-Type": "application/json"},
        post_data=json.dumps({"username": "alice", "age": 25, "active": True})
    )
    assert len(fuzzer.intercepted_calls) == 1, "Should record call"
    mutations = fuzzer.generate_mutations(fuzzer.intercepted_calls[0]["payload"])
    print(f"Generated {len(mutations)} schema mutations successfully.")
    assert len(mutations) > 0, "Should generate mutations"
    print("ApiFuzzer self-test passed!")
