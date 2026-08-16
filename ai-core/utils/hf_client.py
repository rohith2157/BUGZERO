import io
import base64
import logging
import asyncio
import os
from typing import Optional
import httpx
from config import settings

logger = logging.getLogger(__name__)


class HuggingFaceVLMClient:
    """Client for Hugging Face Visual-Language Models (Eagle2 & LocateAnything)."""

    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.hf_token
        self._gradio_client = None

    def _get_client(self):
        if self._gradio_client is None:
            from gradio_client import Client
            self._gradio_client = Client("rohith2157/vlm_for_bugzero", token=self.token)
        return self._gradio_client

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
        target_model = model_id or "Qwen/Qwen2-VL-2B-Instruct"
        url = f"https://router.huggingface.co/hf-inference/models/{target_model}"

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
        """Direct call to private ZeroGPU Space API via Gradio Client API."""
        import tempfile
        from gradio_client import Client, handle_file

        tmp_path = None
        try:
            # Convert image bytes using PIL to guarantee valid RGB PNG format for Gradio
            from PIL import Image
            import io
            img_bytes = base64.b64decode(img_b64)
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                img.save(tmp, format="PNG")
                tmp_path = tmp.name

            def _sync_gradio_call():
                client = self._get_client()
                res = client.predict(
                    image=handle_file(tmp_path),
                    prompt=prompt,
                    model_label="NVIDIA Eagle2-2B (Visual QA)",
                    api_token=self.token or "",
                    api_name="/analyze_image"
                )

                if isinstance(res, (tuple, list)) and len(res) > 0:
                    return str(res[0])
                return str(res)

            out = await asyncio.to_thread(_sync_gradio_call)
            if out and ("Error connecting" in out or "[Errno" in out or "Method Not Allowed" in out):
                logger.debug(f"Direct HF Space error payload: {out[:150]}")
                return None
            return out

        except Exception as e:
            logger.debug(f"Direct HF Space call skipped: {e}")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
        return None




hf_vlm_client = HuggingFaceVLMClient()
