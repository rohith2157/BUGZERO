import os
import shutil
import subprocess
import tempfile
import logging
import socket
import time
import asyncio
import re

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

    async def start_server(self) -> str:
        """Analyzes the repo and starts a local server. Returns the local URL."""
        port = self._find_free_port()
        
        # Check if it's a Node project
        if os.path.exists(os.path.join(self.temp_dir, "package.json")):
            logger.info("Found package.json. Installing dependencies...")
            
            # Use npm ci if package-lock exists, else npm install
            install_cmd = ["npm", "ci"] if os.path.exists(os.path.join(self.temp_dir, "package-lock.json")) else ["npm", "install"]
            
            try:
                proc = await asyncio.create_subprocess_exec(
                    *install_cmd,
                    cwd=self.temp_dir,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await proc.wait()
                if proc.returncode != 0:
                    stderr = await proc.stderr.read()
                    logger.warning(f"npm install had issues (this is common): {stderr.decode()}")
            except Exception as e:
                logger.error(f"Error during npm install: {e}")

            # Try to start the dev server
            logger.info("Starting Node server via 'npm run dev' fallback to 'npm start'...")
            
            # Create a wrapper script to find the port Vite or Next assigns, 
            # but usually we can pass PORT as env var
            env = os.environ.copy()
            env["PORT"] = str(port)
            env["BROWSER"] = "none" # Prevent react-scripts from opening browser
            
            # Start the process asynchronously
            self.server_process = await asyncio.create_subprocess_exec(
                "npm", "run", "dev",
                cwd=self.temp_dir,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT
            )
            
            # Read stdout to find the actual port (Vite/Next might ignore PORT env var)
            # Wait up to 15 seconds for a port to appear in the logs
            detected_port = port
            start_time = time.time()
            port_pattern = re.compile(r'http://(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)')
            
            while time.time() - start_time < 15:
                try:
                    # Read line with timeout
                    line_bytes = await asyncio.wait_for(self.server_process.stdout.readline(), timeout=1.0)
                    if not line_bytes:
                        break
                    line = line_bytes.decode().strip()
                    logger.debug(f"[Node Server] {line}")
                    
                    match = port_pattern.search(line)
                    if match:
                        detected_port = int(match.group(1))
                        logger.info(f"Detected server running on port {detected_port}")
                        # Give it 2 more seconds to fully boot
                        await asyncio.sleep(2)
                        break
                except asyncio.TimeoutError:
                    continue
            
            self.local_url = f"http://localhost:{detected_port}"
            return self.local_url

        else:
            # Fallback to simple python static server
            logger.info("No package.json found. Starting static Python server...")
            self.server_process = await asyncio.create_subprocess_exec(
                "python", "-m", "http.server", str(port),
                cwd=self.temp_dir,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL
            )
            # Give it a second to bind
            await asyncio.sleep(1)
            self.local_url = f"http://localhost:{port}"
            return self.local_url

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
