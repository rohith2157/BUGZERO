import os
import shutil
import subprocess
import tempfile
import logging
import socket
import time
import asyncio
import re
import sys

logger = logging.getLogger(__name__)

class RepoManager:
    def __init__(self, repo_url: str, github_token: str):
        self.original_url = repo_url
        self.github_token = github_token
        self.temp_dir = tempfile.mkdtemp(prefix="bugzero_repo_")
        self.server_process = None
        self.local_url = None
        # Commit metadata — populated after clone()
        self.commit_sha: str | None = None
        self.commit_sha_short: str | None = None
        self.commit_message: str | None = None
        self.commit_author: str | None = None
        self.branch: str | None = None

    def _get_auth_repo_url(self) -> str:
        """Injects the OAuth token into the github URL for cloning."""
        # E.g. https://github.com/owner/repo.git -> https://x-access-token:{token}@github.com/owner/repo.git
        if not self.github_token:
            return self.original_url
            
        url = self.original_url
        if "github.com" in url and "@" not in url:
            url = url.replace("https://github.com/", f"https://x-access-token:{self.github_token}@github.com/")
        return url

    def clone(self, branch: str | None = None) -> bool:
        """Clones the repository into the temporary directory.

        Captures commit metadata (SHA, message, author, branch) after clone.
        Optional branch arg enables testing feature branches / PRs.
        """
        auth_url = self._get_auth_repo_url()
        logger.info(f"Cloning repository to {self.temp_dir}...")
        try:
            cmd = ["git", "clone", "--depth", "1"]
            if branch:
                cmd += ["--branch", branch]
            cmd += [auth_url, "."]
            subprocess.run(
                cmd,
                cwd=self.temp_dir,
                capture_output=True,
                text=True,
                check=True
            )
            logger.info("Clone successful.")
            self._capture_commit_metadata()
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to clone repo: {e.stderr}")
            return False

    def _capture_commit_metadata(self) -> None:
        """Reads git log + rev-parse to populate commit fields. Non-fatal."""
        try:
            # Format: fullSHA|subject|authorName  (pipe is safe separator for commit messages)
            log = subprocess.run(
                ["git", "log", "-1", "--pretty=format:%H|%s|%an"],
                cwd=self.temp_dir, capture_output=True, text=True, check=True
            )
            parts = log.stdout.strip().split("|", 2)
            if len(parts) == 3:
                self.commit_sha = parts[0]
                self.commit_sha_short = parts[0][:7]
                self.commit_message = parts[1]
                self.commit_author = parts[2]

            branch_out = subprocess.run(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                cwd=self.temp_dir, capture_output=True, text=True, check=True
            )
            self.branch = branch_out.stdout.strip()
            logger.info(
                f"Commit metadata: branch={self.branch} sha={self.commit_sha_short} "
                f"msg='{self.commit_message}' author={self.commit_author}"
            )
        except Exception as e:
            logger.warning(f"Could not capture commit metadata (non-fatal): {e}")

    def _find_free_port(self) -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            return s.getsockname()[1]

    async def _health_check(self, url: str, retries: int = 10, interval: float = 2.0) -> bool:
        """Poll the local server until it responds or retries are exhausted."""
        import urllib.request
        import urllib.error
        for i in range(retries):
            try:
                urllib.request.urlopen(url, timeout=3)
                logger.info(f"Health check passed on attempt {i + 1}: {url}")
                return True
            except (urllib.error.URLError, OSError):
                await asyncio.sleep(interval)
        logger.error(f"Health check failed after {retries} attempts: {url}")
        return False

    def _detect_project_type(self) -> tuple[str, str]:
        """Detect project type and the directory to serve from.
        
        Searches root first, then common subdirectories.
        Returns (project_type, serve_dir).
        """
        # 1. Check root first
        root = self.temp_dir
        root_checks = [
            ("package.json", "node"),
            ("index.html", "static"),
            ("pyproject.toml", "python"),
            ("requirements.txt", "python"),
        ]
        for filename, ptype in root_checks:
            if os.path.exists(os.path.join(root, filename)):
                logger.info(f"Detected '{ptype}' via {filename} at root")
                return ptype, root

        # 2. Scan ALL immediate subdirectories for a servable app
        # Handles monorepos, custom dir names (e.g. NEO/, kombai/), etc.
        for entry in sorted(os.listdir(root)):
            candidate = os.path.join(root, entry)
            if not os.path.isdir(candidate) or entry.startswith("."):
                continue
            for filename, ptype in root_checks:
                if os.path.exists(os.path.join(candidate, filename)):
                    logger.info(f"Detected '{ptype}' via {entry}/{filename}")
                    return ptype, candidate

        # 3. Search for ANY .html file anywhere (1 level deep)
        for entry in os.listdir(root):
            full = os.path.join(root, entry)
            if entry.endswith(".html") and os.path.isfile(full):
                logger.info(f"Found HTML file at root: {entry}")
                return "static", root
            if os.path.isdir(full) and not entry.startswith("."):
                for sub in os.listdir(full):
                    if sub.endswith(".html"):
                        logger.info(f"Found HTML in {entry}/{sub}")
                        return "static", full

        # 4. Last resort: generate an index.html listing repo contents
        # so the static server has something the crawler can reach
        logger.info("No servable content found — generating index page from repo files")
        self._generate_index_page(root)
        return "static", root

    def _generate_index_page(self, directory: str) -> None:
        """Create a minimal index.html listing repo files for crawling."""
        entries = []
        for item in sorted(os.listdir(directory)):
            if item.startswith("."):
                continue
            path = os.path.join(directory, item)
            if os.path.isdir(path):
                entries.append(f'<li>📁 <a href="{item}/">{item}/</a></li>')
            else:
                entries.append(f'<li>📄 <a href="{item}">{item}</a></li>')

        html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Repository Contents</title>
<style>body{{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem}}
ul{{list-style:none;padding:0}}li{{padding:4px 0;font-size:15px}}</style>
</head><body>
<h1>Repository File Listing</h1>
<p>No runnable web app detected. Serving static file listing for analysis.</p>
<ul>{"".join(entries)}</ul>
</body></html>"""
        with open(os.path.join(directory, "index.html"), "w", encoding="utf-8") as f:
            f.write(html)

    async def _start_node_server(self, port: int) -> str | None:
        """Install deps and start a Node dev server. Returns URL or None."""
        import json
        npm_bin = "npm.cmd" if sys.platform == "win32" else "npm"

        # Install dependencies
        lock_exists = os.path.exists(os.path.join(self.temp_dir, "package-lock.json"))
        install_cmd = [npm_bin, "ci"] if lock_exists else [npm_bin, "install"]
        try:
            proc = await asyncio.to_thread(
                subprocess.run, install_cmd, cwd=self.temp_dir, capture_output=True
            )
            if proc.returncode != 0:
                logger.warning(f"npm install issues: {proc.stderr.decode('utf-8', errors='ignore')[:500]}")
        except Exception as e:
            logger.error(f"npm install failed: {e}")

        # Read package.json to check available scripts
        pkg_path = os.path.join(self.temp_dir, "package.json")
        try:
            with open(pkg_path) as f:
                pkg = json.load(f)
            scripts = pkg.get("scripts", {})
        except Exception:
            scripts = {}

        # Try 'dev' first, then 'start'
        run_scripts = [s for s in ("dev", "start") if s in scripts]
        if not run_scripts:
            logger.error("No 'dev' or 'start' script in package.json")
            return None

        env = os.environ.copy()
        env["PORT"] = str(port)
        env["BROWSER"] = "none"

        for script_name in run_scripts:
            logger.info(f"Trying 'npm run {script_name}'...")
            self.server_process = subprocess.Popen(
                [npm_bin, "run", script_name],
                cwd=self.temp_dir, env=env,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            )

            detected_port = port
            start_time = time.time()
            port_pattern = re.compile(r'http://(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)')

            while time.time() - start_time < 20:
                try:
                    line_bytes = await asyncio.wait_for(
                        asyncio.to_thread(self.server_process.stdout.readline), timeout=1.0
                    )
                    if not line_bytes:
                        break
                    line = line_bytes.decode("utf-8", errors="ignore").strip()
                    logger.debug(f"[Node:{script_name}] {line}")
                    match = port_pattern.search(line)
                    if match:
                        detected_port = int(match.group(1))
                        logger.info(f"Detected server on port {detected_port}")
                        await asyncio.sleep(2)
                        url = f"http://localhost:{detected_port}"
                        if await self._health_check(url, retries=5, interval=1.0):
                            self.local_url = url
                            return url
                        break
                except asyncio.TimeoutError:
                    continue

            if self.server_process.poll() is not None:
                logger.warning(f"'npm run {script_name}' exited with code {self.server_process.returncode}")
                self.server_process = None
                continue

            url = f"http://localhost:{port}"
            if await self._health_check(url, retries=5, interval=2.0):
                self.local_url = url
                return url

            self.server_process.terminate()
            self.server_process = None

        return None

    async def _start_static_server(self, port: int, serve_dir: str | None = None) -> str | None:
        """Start a Python http.server for static/HTML repos."""
        target_dir = serve_dir or self.temp_dir
        python_bin = sys.executable
        logger.info(f"Starting static Python server on port {port} in {target_dir}...")
        self.server_process = subprocess.Popen(
            [python_bin, "-m", "http.server", str(port)],
            cwd=target_dir,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        url = f"http://localhost:{port}"
        if await self._health_check(url, retries=5, interval=1.0):
            self.local_url = url
            return url
        self.server_process.terminate()
        self.server_process = None
        return None

    async def start_server(self) -> str | None:
        """Detect project type, start the appropriate server, health-check it.
        
        Returns the local URL if the server is alive, or None on failure.
        Always finds something to serve — generates an index page as last resort.
        """
        port = self._find_free_port()
        project_type, serve_dir = self._detect_project_type()

        original_temp = self.temp_dir

        if project_type == "node":
            self.temp_dir = serve_dir
            result = await self._start_node_server(port)
            if result:
                return result
            logger.warning("Node server failed, falling back to static serve")
            self.temp_dir = original_temp

        # Static/Python: serve from the detected directory
        return await self._start_static_server(port, serve_dir)

    def cleanup(self):
        """Terminates the server and cleans up the temp directory."""
        if self.server_process:
            logger.info("Terminating local server...")
            try:
                self.server_process.terminate()
            except Exception as e:
                logger.error(f"Error terminating server: {e}")
                
        if os.path.exists(self.temp_dir):
            logger.info(f"Cleaning up temp dir {self.temp_dir}...")
            try:
                # Windows might have file locks, use ignore_errors
                shutil.rmtree(self.temp_dir, ignore_errors=True)
            except Exception as e:
                logger.error(f"Failed to delete temp dir: {e}")

