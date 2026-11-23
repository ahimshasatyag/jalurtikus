import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "JalurTikus API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server Bindings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Security & Auth
    SECRET_KEY: str = "jalurtikus-secret-key-change-in-production-2026-super-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Supabase (Optional for local/dev fallback)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Traffic Provider
    TRAFFIC_PROVIDER: str = "osm"
    TRAFFIC_API_KEY: str = ""
    TRAFFIC_CACHE_TTL_SECONDS: int = 300  # 5 minutes

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Re-routing threshold settings
    REROUTE_DEVIATION_THRESHOLD_METERS: float = 50.0
    REROUTE_TIME_SAVING_THRESHOLD_SECONDS: int = 180  # 3 minutes faster to trigger reroute
    REROUTE_COOLDOWN_SECONDS: int = 120  # 2 minutes cooldown

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

