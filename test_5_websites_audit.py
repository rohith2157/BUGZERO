"""Multi-website live QA audit and defect analyzer.

Tests 5 websites:
1. https://phycraft.tech/
2. https://bfl.ai/research
3. https://www.swiggy.com/instamart
4. https://news.ycombinator.com/
5. https://github.com/

Directly executes AutonomousQA orchestrator in-process and inspects all detected defects,
heuristics, axe-core rules, and patterns.
"""

import asyncio
import sys
import os
import json
import traceback
from collections import defaultdict

# Fix Windows console UTF-8 printing
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add ai-core to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ai-core"))

from orchestrator import Orchestrator
from models.schemas import TestRequest, TestConfig

WEBSITES = [
    {"name": "Phycraft Tech", "url": "https://phycraft.tech/"},
    {"name": "BFL AI Research", "url": "https://bfl.ai/research"},
    {"name": "Swiggy Instamart", "url": "https://www.swiggy.com/instamart"},
    {"name": "Hacker News", "url": "https://news.ycombinator.com/"},
    {"name": "GitHub", "url": "https://github.com/"},
]

async def test_single_website(orchestrator: Orchestrator, site_info: dict) -> dict:
    url = site_info["url"]
    name = site_info["name"]
    print(f"\n[{name}] >>> Starting test for {url} ...", flush=True)
    
    req = TestRequest(
        run_id=f"audit_{name.lower().replace(' ', '_')}",
        url=url,
        config=TestConfig(
            crawl_depth="shallow",
            max_pages=1,
            modules=["functional", "accessibility", "visual", "seo", "performance", "compliance"]
        )
    )
    
    try:
        result = await orchestrator.run_test(req)
        data = result.model_dump()
        return {"site": site_info, "data": data, "error": None}
    except Exception as e:
        err_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        print(f"[{name}] FAILED: {err_msg}", flush=True)
        return {"site": site_info, "data": None, "error": err_msg}

async def main():
    print("=" * 80)
    print("STARTING 5-WEBSITE IN-PROCESS QA LIVE AUDIT")
    print("=" * 80)
    
    orchestrator = Orchestrator()
    results = []
    
    for site in WEBSITES:
        res = await test_single_website(orchestrator, site)
        results.append(res)
        
    print("\n" + "=" * 80)
    print("DETAILED RESULTS PER WEBSITE")
    print("=" * 80)
    
    site_defects_map = defaultdict(list)
    site_compliance_map = defaultdict(list)
    all_defect_messages = defaultdict(set)
    all_compliance_rules = defaultdict(set)
    
    for r in results:
        site = r["site"]
        name = site["name"]
        url = site["url"]
        
        print(f"\n--------------------------------------------------------------------------------")
        print(f"WEBSITE: {name} ({url})")
        print(f"--------------------------------------------------------------------------------")
        
        if r["error"]:
            print(f"[ERROR]: {r['error']}")
            continue
            
        data = r["data"]
        pages = data.get("pages", [])
        overall_score = data.get("overall_score")
        total_defects = data.get("total_defects")
        
        print(f"Status:        {data.get('status')}")
        print(f"Overall Score: {overall_score}/100")
        print(f"Total Defects: {total_defects}")
        
        for p_idx, p in enumerate(pages, 1):
            p_url = p.get("url")
            hygiene = p.get("hygiene_score")
            defects = p.get("defects", [])
            compliance = p.get("compliance", [])
            perf = p.get("performance", {})
            
            print(f"\n  Page {p_idx}: {p_url} (Hygiene Score: {hygiene})")
            
            # Performance
            if perf:
                perf_strs = [f"{k}: {v.get('value')} ({v.get('rating')})" for k, v in perf.items()]
                print(f"  Performance: {' | '.join(perf_strs)}")
                
            # Defects
            print(f"  Defects ({len(defects)}):")
            if not defects:
                print("     (None)")
            for d in defects:
                d_type = d.get("type")
                d_sev = d.get("severity")
                d_msg = d.get("message")
                d_fix = d.get("fix")
                site_defects_map[name].append(d)
                all_defect_messages[d_msg].add(name)
                print(f"     * [{d_type}] [{d_sev.upper()}]: {d_msg}")
                if d_fix:
                    print(f"       Fix: {d_fix}")
                    
            # Compliance & Axe-core
            print(f"  Compliance & Axe-core Violations ({len(compliance)}):")
            if not compliance:
                print("     (None)")
            for c in compliance:
                std = c.get("standard")
                crit = c.get("criterion")
                sev = c.get("severity")
                desc = c.get("description")
                rule_id = c.get("rule_id", "")
                site_compliance_map[name].append(c)
                if rule_id:
                    all_compliance_rules[rule_id].add(name)
                print(f"     * [{std} - {crit}] [{sev.upper()}]: {desc} {f'(Rule: {rule_id})' if rule_id else ''}")

    print("\n" + "=" * 80)
    print("CROSS-WEBSITE PATTERN ANALYSIS: ARE THE SAME THINGS DETECTED EVERYWHERE?")
    print("=" * 80)
    
    print("\n1. Defects detected on MULTIPLE websites:")
    found_dup_defect = False
    for msg, sites in all_defect_messages.items():
        if len(sites) > 1:
            found_dup_defect = True
            print(f"   [!] Pattern: '{msg}'")
            print(f"       Appeared on ({len(sites)}/5 sites): {', '.join(sites)}")
    if not found_dup_defect:
        print("   (None)")

    print("\n2. Compliance / Accessibility rules triggered across multiple sites:")
    for rule, sites in all_compliance_rules.items():
        if len(sites) > 1:
            print(f"   [!] Axe-Core Rule: '{rule}' triggered on ({len(sites)}/5 sites): {', '.join(sites)}")

    print("\n3. Summary Table:")
    print(f"{'Website':<20} | {'Score':<6} | {'Defects':<8} | {'Compliance':<10} | {'Sample Issue'}")
    print("-" * 80)
    for r in results:
        site = r["site"]
        name = site["name"]
        if r["error"]:
            print(f"{name:<20} | {'ERR':<6} | {'-':<8} | {'-':<10} | Error occurred")
            continue
        data = r["data"]
        score = str(data.get("overall_score", 0))
        defs = len(site_defects_map[name])
        comp = len(site_compliance_map[name])
        sample = site_defects_map[name][0].get("message") if site_defects_map[name] else (site_compliance_map[name][0].get("description") if site_compliance_map[name] else "Clean")
        print(f"{name:<20} | {score:<6} | {defs:<8} | {comp:<10} | {sample[:40]}")
        
    with open("multi_site_audit_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("\nResults saved to multi_site_audit_results.json")

if __name__ == "__main__":
    asyncio.run(main())
