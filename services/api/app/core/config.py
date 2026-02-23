"""Application configuration via environment variables."""
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./vds.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM providers
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = "AIzaSyAFhCe30tUt7ql-H5nPiNYSmjZoAGGe3pE"
    DEFAULT_LLM_PROVIDER: str = "gemini"  # openai | anthropic | gemini
    DEFAULT_LLM_MODEL: str = "gemini-2.5-flash"
    
    # Model routing by agent task
    MODEL_ROUTING: dict = {
        "problem_framer": {"provider": "gemini", "model": "gemini-2.5-pro"},
        "mapper": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "default": {"provider": "gemini", "model": "gemini-2.5-flash"}
    }

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Feature flags
    ENABLE_AGENT_BUILDER: bool = True
    ENABLE_MODELING: bool = True
    ENABLE_WRITEBACK: bool = False  # Disabled until governance is fully wired

    # Connector credentials (runtime-fetched from vault; these are placeholders)
    SALESFORCE_CLIENT_ID: str = ""
    SALESFORCE_CLIENT_SECRET: str = ""
    STRIPE_API_KEY: str = ""
    SNOWFLAKE_ACCOUNT: str = ""


settings = Settings()
