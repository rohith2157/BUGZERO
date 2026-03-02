"""Utility functions for the Bugzero crawler."""

from urllib.parse import urljoin, urlparse
import re


def sanitize_url_for_filename(url: str) -> str:
    """Convert a URL to a safe filename.

    Example: https://example.com/path/page → example.com_path_page
    """
    parsed = urlparse(url)
    path = parsed.path.strip("/").replace("/", "_")
    query = parsed.query.replace("&", "_").replace("=", "-") if parsed.query else ""
    name = parsed.netloc + ("_" + path if path else "") + ("_" + query if query else "")
    name = re.sub(r"[^\w\-.]", "_", name)
    name = re.sub(r"_+", "_", name).strip("_")
    return name or "index"


def is_same_domain(url: str, base_url: str) -> bool:
    """Return True only if url is on the same domain as base_url."""
    try:
        return urlparse(url).netloc == urlparse(base_url).netloc
    except Exception:
        return False


def is_valid_url(url: str) -> bool:
    """Return True if url starts with http:// or https://."""
    return url.startswith("http://") or url.startswith("https://")


def normalize_url(url: str, base_url: str) -> str:
    """Convert relative URLs to absolute URLs and strip fragments."""
    absolute = urljoin(base_url, url)
    parsed = urlparse(absolute)
    # Strip fragment (#section) and normalize
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
