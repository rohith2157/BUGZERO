from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    openai_api_key: str = ""
    gemini_api_key: str = ""        # Stage 4: Gemini Vision (optional — free)
    gateway_url: str = "http://localhost:3000"
    headless: bool = True
    browser: str = "chromium"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
