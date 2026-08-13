import io
import base64
import logging
import asyncio
from typing import Optional
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
        """Queries HF VLM via Space API or direct Inference API with retry backoff."""
        if not self.is_configured():
            return None

        img_b64 = base64.b64encode(image_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        # 1. Try Direct Gradio Space Endpoint
        if settings.hf_space_url:
            space_result = await self._query_space(img_b64, prompt, headers, timeout)
            if space_result:
                return space_result

        # 2. Fall back to Model Inference API with retry backoff
        target_model = model_id or settings.hf_model_id
        url = f"https://api-inference.huggingface.co/models/{target_model}"
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

        for attempt in range(2):
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
                    elif res.status_code == 503:
                        # Model loading on HF side, wait 5s and retry
                        await asyncio.sleep(5.0)
                        continue
            except Exception as e:
                logger.debug(f"HF VLM API query attempt {attempt + 1} skipped: {e}")

        return None

    async def _query_space(
        self,
        img_b64: str,
        prompt: str,
        headers: dict,
        timeout: float
    ) -> Optional[str]:
        """Direct call to private ZeroGPU Space API via Gradio REST endpoint."""
        try:
            space_url = f"{settings.hf_space_url.rstrip('/')}/api/predict"
            payload = {
                "data": [
                    f"data:image/png;base64,{img_b64}",
                    prompt,
                    "NVIDIA Eagle2-2B (Visual QA)",
                    self.token
                ]
            }
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(space_url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, dict) and "data" in data:
                        out = data["data"]
                        if isinstance(out, list) and len(out) > 0:
                            return str(out[0])
                        return str(out)
        except Exception as e:
            logger.debug(f"Direct HF Space call skipped: {e}")
        return None



hf_vlm_client = HuggingFaceVLMClient()
