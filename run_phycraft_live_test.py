"""Run full live AutonomousQA pipeline on https://phycraft.tech"""

import asyncio
import httpx
import json

async def run_live_test():
    print("[TITAN-QA] Triggering AutonomousQA full pipeline on https://phycraft.tech...")
    async with httpx.AsyncClient(timeout=300.0) as client:
        payload = {
            "run_id": f"phycraft_test_{int(asyncio.get_event_loop().time())}",
            "url": "https://phycraft.tech",
            "crawl_depth": "standard",
            "modules": ["functional", "accessibility", "visual", "seo"]
        }

        res = await client.post("http://localhost:8000/api/test/run", json=payload)
        if res.status_code == 200:
            data = res.json()
            print("\n==========================================")
            print("[SUCCESS] AutonomousQA Live Test Complete!")
            print("==========================================")
            print(f"Run ID:        {data.get('run_id')}")
            print(f"Status:        {data.get('status')}")
            print(f"Pages Tested:  {len(data.get('pages', []))}")
            print(f"Overall Score: {data.get('overall_score')}")
            print(f"Total Defects: {data.get('total_defects')}")
            print("------------------------------------------")
            for page in data.get('pages', []):
                print(f"Page: {page.get('url')} | Hygiene Score: {page.get('hygiene_score')}")
                for defect in page.get('defects', []):
                    print(f"   - [{defect.get('type')}] ({defect.get('severity')}): {defect.get('message')}")

        else:
            print(f"[ERROR] API returned status {res.status_code}: {res.text}")


if __name__ == "__main__":
    asyncio.run(run_live_test())
