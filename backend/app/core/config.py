from __future__ import annotations

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env.local" if os.getenv("APP_ENV", "local") == "local" else None,
        extra="ignore",
    )

    app_env: str = "local"

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"
    shared_storage_path: str = "./shared_storage"
    llm_provider: str = "groq"
    llm_groq_api_key: str = ""
    llm_openrouter_api_key: str = ""
    llm_openrouter_api_base: str = "https://openrouter.ai/api/v1"
    llm_openrouter_http_referer: str = ""
    llm_openrouter_app_name: str = ""
    llm_model_planner: str = "openai/gpt-oss-20b"
    llm_model_writer: str = "openai/gpt-oss-20b"
    llm_temperature: float = 0.2
    llm_timeout_seconds: int = 120
    generation_section_parallelism: int = 8
    redis_cache_url: str = "redis://localhost:6379/2"
    generation_redis_ttl_seconds: int = 21600
    retrieval_chunk_size_chars: int = 1800
    retrieval_chunk_overlap_chars: int = 250
    retrieval_top_k_chunks: int = 6
    web_fetch_timeout_seconds: int = 20
    max_web_pages_per_input: int = 3
    prompt_registry_path: str = str(Path(__file__).resolve().parents[1] / "prompts" / "registry.yaml")
    cors_allow_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


settings = Settings()
