from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="DocPod Backend", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    media_dir = Path(settings.shared_storage_path)
    try:
        media_dir.mkdir(parents=True, exist_ok=True)
    except OSError:
        fallback_dir = Path("/tmp/docpod_shared_storage")
        fallback_dir.mkdir(parents=True, exist_ok=True)
        logger.warning(
            "Shared storage path '%s' is not writable; using fallback '%s'",
            media_dir,
            fallback_dir,
        )
        media_dir = fallback_dir
    app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")
    app.include_router(v1_router)
    return app


app = create_app()
