"""Bugzero Crawler — standalone entry point.

Run: python crawl.py
Then enter any URL to crawl and watch real-time results.
"""

import asyncio
import json
import os
import sys

from rich.console import Console
from rich.table import Table
from rich.panel import Panel

# Fix for Windows asyncio subprocess support
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Ensure crawler package is importable
sys.path.insert(0, os.path.dirname(__file__))

from crawler.crawler import BugzeroCrawler

console = Console()


async def main():
    """Main entry point — prompts for URL and runs the crawler."""
    console.print(Panel.fit(
        "[bold cyan]BUGZERO — Autonomous QA Crawler[/bold cyan]\n"
        "[dim]Real Playwright browser • Real page analysis • Real results[/dim]",
        border_style="cyan",
    ))

    # Get URL from command line or prompt
    if len(sys.argv) > 1:
        url = sys.argv[1].strip()
    else:
        url = console.input("\n[bold]Enter URL to crawl:[/bold] ").strip()

    if not url.startswith("http"):
        url = "https://" + url

    # Get max pages
    max_pages = 20
    if len(sys.argv) > 2:
        try:
            max_pages = int(sys.argv[2])
        except ValueError:
            pass

    # Ensure output directories exist
    screenshots_dir = os.path.join(os.path.dirname(__file__), "screenshots")
    results_dir = os.path.join(os.path.dirname(__file__), "results")
    os.makedirs(screenshots_dir, exist_ok=True)
    os.makedirs(results_dir, exist_ok=True)

    # Run the crawl
    crawler = BugzeroCrawler(
        start_url=url,
        max_pages=max_pages,
        screenshots_dir=screenshots_dir,
    )
    result = await crawler.crawl()

    # Print summary table
    console.print(f"\n[bold cyan]{'═' * 60}[/bold cyan]")
    console.print(f"[bold cyan]  CRAWL COMPLETE[/bold cyan]")
    console.print(f"[bold cyan]{'═' * 60}[/bold cyan]\n")

    summary = Table(title="Crawl Summary", show_header=True, header_style="bold cyan")
    summary.add_column("Metric", style="white", width=30)
    summary.add_column("Value", style="green", justify="right")
    summary.add_row("Total Pages Crawled", str(result.total_pages))
    summary.add_row("Broken Links Found", f"[red]{result.total_broken_links}[/red]" if result.total_broken_links else "0")
    summary.add_row("Broken Images Found", f"[red]{result.total_broken_images}[/red]" if result.total_broken_images else "0")
    summary.add_row("Missing Alt Texts", f"[yellow]{result.total_missing_alts}[/yellow]" if result.total_missing_alts else "0")
    summary.add_row("Form Issues", f"[yellow]{result.total_form_issues}[/yellow]" if result.total_form_issues else "0")
    summary.add_row("Crawl Duration", f"{result.crawl_duration_seconds:.1f}s")
    console.print(summary)

    # Per-page breakdown
    if result.pages:
        console.print()
        pages_table = Table(title="Pages Found", show_header=True, header_style="bold magenta")
        pages_table.add_column("#", justify="right", width=4)
        pages_table.add_column("URL", style="white", max_width=50, no_wrap=True)
        pages_table.add_column("Type", style="cyan", width=12)
        pages_table.add_column("Status", justify="right", width=8)
        pages_table.add_column("Issues", justify="right", width=8)
        pages_table.add_column("Load", justify="right", width=10)

        for i, p in enumerate(result.pages, 1):
            issues = len(p.analysis.broken_links) + len(p.analysis.broken_images) + len(p.analysis.missing_alts)
            status_style = "green" if p.status_code == 200 else "red"
            issue_style = "red" if issues > 0 else "green"
            pages_table.add_row(
                str(i),
                p.url,
                p.page_type,
                f"[{status_style}]{p.status_code}[/{status_style}]",
                f"[{issue_style}]{issues}[/{issue_style}]",
                f"{p.analysis.load_time_ms:.0f}ms",
            )
        console.print(pages_table)

    # Save JSON result
    output_path = os.path.join(results_dir, "crawl_result.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result.model_dump(), f, indent=2, default=str)
    console.print(f"\n[bold green]✅ Full results saved to {output_path}[/bold green]")

    # Show screenshot paths
    screenshots = [p.analysis.screenshot_path for p in result.pages if p.analysis.screenshot_path]
    if screenshots:
        console.print(f"[bold green]📸 {len(screenshots)} screenshots saved to {screenshots_dir}/[/bold green]\n")


if __name__ == "__main__":
    asyncio.run(main())
