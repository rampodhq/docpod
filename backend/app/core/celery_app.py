from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_kwargs = {
    "broker": settings.celery_broker_url,
    "include": ["app.tasks.generation_tasks"],
}
if settings.celery_result_backend:
    celery_kwargs["backend"] = settings.celery_result_backend

celery_app = Celery("docpod", **celery_kwargs)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    # Generation state is persisted in Postgres events/jobs, so Celery results are unnecessary.
    task_ignore_result=True,
    task_store_errors_even_if_ignored=True,
    timezone="UTC",
    enable_utc=True,
)
