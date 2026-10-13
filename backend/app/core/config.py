"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized typed settings for Vyapar Memory AI."""

    APP_NAME: str = "Vyapar Memory AI"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Security & JWT
    SECRET_KEY: str = "vyapar-memory-dev-secret-key-replace-in-production-9f8e7d6c5b4a3210"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Timezone for commitment & deadline calculation
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"

    # Database (Supports PostgreSQL+pgvector or local SQLite fallback)
    DATABASE_URL: str = "sqlite:///./vyapar_memory.db"

    # AI Provider Configuration
    AI_PROVIDER: str = "auto"  # "gemini", "openai", "auto"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "models/text-embedding-004"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Speech-to-Text & OCR
    STT_PROVIDER: str = "auto"
    OCR_ENABLED: bool = True

    # Uploads
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 15

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def active_llm_provider(self) -> str:
        """Return the active configured LLM provider name without exposing secrets."""
        if self.AI_PROVIDER == "gemini" and self.GEMINI_API_KEY:
            return "gemini"
        if self.AI_PROVIDER == "openai" and self.OPENAI_API_KEY:
            return "openai"
        if self.AI_PROVIDER == "auto":
            if self.GEMINI_API_KEY:
                return "gemini"
            if self.OPENAI_API_KEY:
                return "openai"
        return "deterministic_rule_assisted"

    @property
    def active_stt_provider(self) -> str:
        """Return active speech-to-text provider name."""
        if self.GEMINI_API_KEY and self.STT_PROVIDER in ("auto", "gemini"):
            return "gemini_audio"
        if self.OPENAI_API_KEY and self.STT_PROVIDER in ("auto", "openai_whisper"):
            return "openai_whisper"
        return "unconfigured"

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
