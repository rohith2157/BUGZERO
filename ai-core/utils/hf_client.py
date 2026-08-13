import io
import base64
import logging
from typing import Optional, Dict, Any
import httpx
from config import settings

logger = logging.getLogger(__name__)


class HuggingFaceVLMClient:
    """Client for Hugging Face Visual-Language Models (Eagle2 & LocateAnything)."""

    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.hf_token

    def is_configured(self) -> bool:
        return bool(self.token and self.token.strip())

    async def query_vlm(
        self,
        image_bytes: bytes,
        prompt: str,
        model_id: Optional[str] = None,
        timeout: float = 30.0
    ) -> Optional[str]:
        """Queries HF VLM with base64 image and text prompt."""
        if not self.is_configured():
            logger.info("HF VLM Client: No token configured — skipping API call.")
            return None

        target_model = model_id or settings.hf_model_id
        url = f"https://api-inference.huggingface.co/models/{target_model}"

        img_b64 = base64.b64encode(image_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        payload = {
            "inputs": {
                "image": f"data:image/png;base64,{img_b64}",
                "prompt": prompt
            },
            "parameters": {
                "max_new_tokens": 512,
                "temperature": 0.2
            }
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0:
                        return data[0].get("generated_text", str(data[0]))
                    elif isinstance(data, dict):
                        return data.get("generated_text", str(data))
                    return str(data)
                else:
                    logger.warning(f"HF VLM API returned {res.status_code}: {res.text}")
                    return None
        except Exception as e:
            logger.error(f"HF VLM API connection failed: {e}")
            return None


hf_vlm_client = HuggingFaceVLMClient()
