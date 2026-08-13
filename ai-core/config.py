from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    gateway_url: str = "http://localhost:3000"
    headless: bool = True
    browser: str = "chromium"

    # Hugging Face VLM Integration
    hf_token: str = "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"
    hf_space_url: str = "https://rohith2157-vlm-for-bugzero.hf.space"
    hf_model_id: str = "nvidia/Eagle2-2B"
    hf_grounding_model_id: str = "nvidia/LocateAnything-3B"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
