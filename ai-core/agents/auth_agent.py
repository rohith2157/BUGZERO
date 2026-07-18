"""Auth Agent - fully autonomous authentication using heuristic and visual layout detection.

Supports 4 main injection strategies:
- Simple Username/Password forms (form)
- SSO (sso)
- Multi-factor TOTP generation (totp)
- Raw JWT / Bearer Token headers (token)
"""

import json
import logging
import asyncio
from typing import Optional, Dict

logger = logging.getLogger(__name__)



# Fallback PyOTP for TOTP strategy
try:
    import pyotp  # type: ignore
except ImportError:
    pyotp = None

class AuthWallDetectedException(Exception):
    pass

class AuthFailedException(Exception):
    pass

class SessionExpiredException(Exception):
    pass

class TOTPGenerationException(Exception):
    pass

class AuthAgent:
    """Navigates login pages autonomously using strict DOM heuristics."""

    def __init__(self, playwright_tool, state_path: str = "./auth_state.json"):
        self.tool = playwright_tool
        self._state_path = state_path

    def _generate_totp(self, secret: str) -> str:
        if not pyotp:
            raise TOTPGenerationException("pyotp module is required for TOTP authentication strategy.")
        try:
            totp = pyotp.TOTP(secret)
            return totp.now()
        except Exception as e:
            raise TOTPGenerationException(f"Failed to generate TOTP from secret: {e}")

    async def _save_auth_state(self, auth_state: Dict):
        """Dumps the context to physical drive for persistence in pipelines."""
        try:
            with open(self._state_path, "w", encoding="utf-8") as f:
                json.dump(auth_state, f)
            logger.info(f"AuthAgent: Saved session context to {self._state_path}")
        except Exception as e:
            logger.error(f"AuthAgent: Failed to save auth state to disk - {e}")

    async def authenticate(self, auth_config: Dict, max_retries: int = 3) -> Dict:
        """
        Main entrypoint. Dispatches the authentication pipeline depending on the configuration strategy.
        Accepts: 
            auth_config: The dictionary payload originating from the JSON playbooks/TestConfig.
        """
        if not auth_config.get("enabled", False):
            logger.info("AuthAgent: Auth explicitly disabled. Returning empty context.")
            return {}

        strategy = auth_config.get("strategy", "form").lower()
        url = auth_config.get("login_url", "")
        
        logger.info(f"AuthAgent: Triggering autonomous {strategy} strategy on target: {url}")

        retries = 0
        last_error = None
        auth_state = None

        while retries < max_retries:
            try:
                if strategy == "form" or strategy == "totp":
                    auth_state = await self._execute_form_login(url, auth_config)
                
                elif strategy == "sso":
                    auth_state = await self._execute_sso_login(url, auth_config)
                
                elif strategy == "token":
                    auth_state = await self._execute_token_injection(auth_config)
                
                else:
                    raise ValueError(f"Unknown auth strategy: {strategy}")

                if auth_state:
                    # Persist successfully
                    await self._save_auth_state(auth_state)
                    
                    # Verify
                    verification_url = auth_config.get("verification_url")
                    success_pattern = auth_config.get("success_url_pattern")
                    if verification_url or success_pattern:
                        verified = await self._verify_session(auth_state, verification_url, success_pattern)
                        if not verified:
                            logger.warning(f"AuthAgent (Attempt {retries+1}/{max_retries}): Session verified as invalid post-login.")
                            retries += 1
                            continue
                            
                    logger.info("AuthAgent: Authentication sequence verified and complete.")
                    return auth_state

            except Exception as e:
                last_error = e
                logger.error(f"AuthAgent: Strategy failure during attempt {retries+1}/{max_retries}: {e}")
                retries += 1
                await asyncio.sleep(2)  # Backoff

        logger.critical("AuthAgent: All authentication retry sequences exhausted.")
        raise AuthFailedException(f"Failed to authenticate after {max_retries} attempts. Last error: {last_error}")

    async def _execute_form_login(self, url: str, auth_config: Dict) -> Dict:
        """Navigates and physically controls a standard credentials form."""
        credentials = auth_config.get("credentials", {})
        username = credentials.get("username")
        password = credentials.get("password")

        if not username or not password:
            raise ValueError("AuthAgent relies on 'username' and 'password' inside credentials map for Form auth.")

        heuristics = {
            "username_selector": "input[type='email'], input[name='username'], input[name='email'], input[id='email'], input[id='username'], input[autocomplete='username']",
            "password_selector": "input[type='password'], input[name='password'], input[id='password'], input[autocomplete='current-password']",
            "submit_selector": "button[type='submit'], input[type='submit'], button:has-text('Login'), button:has-text('Sign In')"
        }

        totp_secret = auth_config.get("totp_secret")
        totp_value = self._generate_totp(totp_secret) if totp_secret else None

        # Engage the headless driver sequence
        auth_state = await self.tool.execute_login_stateful(
            url=url,
            username_selector=heuristics["username_selector"],
            password_selector=heuristics["password_selector"],
            submit_selector=heuristics["submit_selector"],
            username=username,
            password=password,
            totp_value=totp_value
        )
        
        if not auth_state:
            raise AuthFailedException("Form login UI actions completed but no successful state was captured.")
            
        return auth_state

    async def _execute_sso_login(self, url: str, auth_config: Dict) -> Dict:
        """Handles basic SSO routing clicks using LLM Vision targeting specifically SSO boundaries."""
        provider = auth_config.get("sso_provider", "google").lower()
        credentials = auth_config.get("credentials", {})
        
        sso_button = f"button:has-text('{provider}')"
            
        logger.info(f"AuthAgent: Orchestrating SSO constraint toward {provider} using {sso_button}")
        # Note: True SSO architectures generally bounce through multiple origins. We rely on the shared context injection here.
        auth_state = await self.tool.execute_sso_login_stateful(
            url=url,
            sso_selector=sso_button,
            provider=provider,
            username=credentials.get("username", ""),
            password=credentials.get("password", "")
        )
        return auth_state

    async def _execute_token_injection(self, auth_config: Dict) -> Dict:
        """Injects raw authorization headers into a synthetic local storage dump."""
        token = auth_config.get("bearer_token")
        if not token:
            raise ValueError("Token injection strategy lacks bearer token.")
        
        return {
            "cookies": [],
            "local_storage": {},
            "session_storage": {},
            "auth_headers": {"Authorization": f"Bearer {token}"}
        }

    async def _verify_session(self, auth_state: Dict, verification_url: Optional[str] = None, success_pattern: Optional[str] = None) -> bool:
        """Fires a test load using the captured token bounds to confirm auth acceptance without dropping the session loop."""
        if not verification_url:
            return True
            
        logger.info(f"AuthAgent: Verifying injected session state bound against {verification_url}")
        
        return await self.tool.verify_session_state(
            auth_state=auth_state,
            url=verification_url,
            pattern=success_pattern
        )
