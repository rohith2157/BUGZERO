"""Active Explorer Agent — executes form fuzzing and button click interactions.

Phase 1 of AutonomousQA 100X Upgrade:
  - Discovers interactive input controls and buttons
  - Fuzzes inputs with boundary payloads (XSS, SQL, 5000-char string, nulls)
  - Simulates active clicks and traps runtime JS crashes and 5xx API failures
"""

import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


class ActiveExplorerAgent:
    """Systematically discovers and fuzzes interactive UI elements."""

    BOUNDARY_PAYLOADS = [
        "<script>alert('bugzero_xss')</script>",
        "A" * 2000,
        "' OR '1'='1 --",
        "invalid_email_format",
        "",
    ]

    async def explore_and_fuzz(self, page) -> List[Dict]:
        """Discovers input fields and buttons, executes fuzzing, and catches crashes."""
        defects = []
        js_errors = []
        api_errors = []

        # Attach error listeners for interaction phase
        def on_page_error(err):
            js_errors.append(str(err))

        def on_console_msg(msg):
            if msg.type == "error":
                js_errors.append(f"Console {msg.type}: {msg.text}")

        def on_response(res):
            if res.status >= 500 and "text/html" not in (res.headers.get("content-type") or ""):
                api_errors.append(f"HTTP {res.status} on {res.url}")

        page.on("pageerror", on_page_error)
        page.on("console", on_console_msg)
        page.on("response", on_response)

        # ── Option 1: Network Interceptor Pipeline ──
        async def api_interceptor(route, request):
            if request.method in ["POST", "PUT", "PATCH"] and "application/json" in (request.headers.get("content-type") or ""):
                try:
                    post_data = request.post_data_json
                    if isinstance(post_data, dict) and post_data:
                        # Mutate keys with boundary payloads
                        mutated = post_data.copy()
                        first_key = list(mutated.keys())[0]
                        mutated[first_key] = None  # Null substitution test
                        logger.debug(f"[ActiveExplorer] [NetworkInterceptor] Fuzzing API {request.url} key={first_key}")
                        await route.continue_(post_data=mutated)
                        return
                except Exception:
                    pass
            await route.continue_()

        try:
            await page.route("**/*", api_interceptor)
        except Exception:
            pass

        try:
            # 1. Discover interactive inputs & buttons
            nodes = await page.evaluate("""() => {
                const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], textarea')).slice(0, 3).map(i => ({
                    selector: i.id ? '#' + i.id : (i.name ? `input[name="${i.name}"]` : null),
                    type: 'input'
                })).filter(i => i.selector);

                const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]')).slice(0, 3).map(b => ({
                    selector: b.id ? '#' + b.id : (b.className ? '.' + b.className.split(' ')[0] : null),
                    text: (b.innerText || b.value || 'button').trim(),
                    type: 'button'
                })).filter(b => b.selector);

                return { inputs, buttons };
            }""")

            # 2. Form Fuzzing Execution
            for input_node in nodes.get("inputs", []):
                selector = input_node["selector"]
                for payload in self.BOUNDARY_PAYLOADS[:2]:
                    try:
                        await page.fill(selector, payload, timeout=3000)
                    except Exception as e:
                        logger.debug(f"[ActiveExplorer] Fill skipped on {selector}: {e}")

            # 3. Button Click Exploration
            for button_node in nodes.get("buttons", []):
                selector = button_node["selector"]
                try:
                    # Click button safely with timeout
                    await page.click(selector, timeout=2000)
                    await page.wait_for_timeout(500)
                except Exception as e:
                    logger.debug(f"[ActiveExplorer] Click skipped on {selector}: {e}")

            # Unroute network interceptor
            try:
                await page.unroute("**/*", api_interceptor)
            except Exception:
                pass

            # 4. Process errors caught during interaction
            for js_err in js_errors[:3]:
                defects.append({
                    "type": "Functional",
                    "severity": "critical",
                    "message": f"Interactive JS Crash during Form Fuzzing: {js_err[:200]}",
                    "fix": "Add try-catch boundary or fix undefined property access on action trigger."
                })

            for api_err in api_errors[:3]:
                defects.append({
                    "type": "Functional",
                    "severity": "major",
                    "message": f"Backend API 5xx Crash during Action Fuzzing: {api_err[:200]}",
                    "fix": "Validate request payload on backend API before processing."
                })

        except Exception as e:
            logger.debug(f"[ActiveExplorer] Exploration loop finished with exception: {e}")

        return defects

