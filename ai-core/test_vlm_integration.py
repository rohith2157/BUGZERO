import asyncio
import logging
from utils.hf_client import hf_vlm_client
from agents.vision_agent import VisionAgent
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_vlm")


async def main():
    print("==========================================")
    print("AutonomousQA VLM Integration Self-Check")
    print("==========================================")
    print(f"HF Token Configured: {'YES' if settings.hf_token else 'NO'}")
    print(f"Primary Vision Model: {settings.hf_model_id}")
    print(f"Grounding Model: {settings.hf_grounding_model_id}")
    print("------------------------------------------")

    vision_agent = VisionAgent()
    print(f"VisionAgent Available: {vision_agent.is_available()}")

    # 1x1 dummy PNG image
    dummy_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
        b"\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\aeB`\x82"
    )

    print("\nRunning VisionAgent.analyze_screenshot check...")
    result = await vision_agent.analyze_screenshot(dummy_png, "http://localhost:3000")
    print("Result summary:", result.get("summary"))
    print("Defects count:", len(result.get("defects", [])))
    print("Page score:", result.get("page_quality_score"))

    print("\n[SUCCESS] VLM Integration Test Complete!")


if __name__ == "__main__":
    asyncio.run(main())
