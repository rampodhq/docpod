from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml
from jinja2 import StrictUndefined, Template

from app.core.config import settings


class PromptTemplateService:
    def __init__(self, registry_path: str | None = None) -> None:
        self._registry_path = Path(registry_path or settings.prompt_registry_path).resolve()
        self._base_dir = self._registry_path.parent

    @lru_cache(maxsize=1)
    def _load_registry(self) -> dict:
        if not self._registry_path.exists():
            raise ValueError(f"Prompt registry not found: {self._registry_path}")
        data = yaml.safe_load(self._registry_path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Prompt registry is invalid")
        return data

    def _resolve_template_paths(self, *, pipeline_version: str, stage: str) -> tuple[Path, Path]:
        registry = self._load_registry()
        versions = registry.get("versions", {})
        version_data = versions.get(pipeline_version)
        if not isinstance(version_data, dict):
            raise ValueError(f"Unknown prompt pipeline version: {pipeline_version}")

        stage_data = version_data.get("stages", {}).get(stage)
        if not isinstance(stage_data, dict):
            raise ValueError(f"Unknown prompt stage '{stage}' for version '{pipeline_version}'")

        system_path = self._base_dir / stage_data["system"]
        user_path = self._base_dir / stage_data["user"]
        return system_path, user_path

    def render(
        self,
        *,
        pipeline_version: str,
        stage: str,
        variables: dict,
    ) -> tuple[str, str]:
        system_path, user_path = self._resolve_template_paths(
            pipeline_version=pipeline_version,
            stage=stage,
        )
        if not system_path.exists():
            raise ValueError(f"Missing system prompt template: {system_path}")
        if not user_path.exists():
            raise ValueError(f"Missing user prompt template: {user_path}")

        system_template = Template(system_path.read_text(encoding="utf-8"), undefined=StrictUndefined)
        user_template = Template(user_path.read_text(encoding="utf-8"), undefined=StrictUndefined)
        return system_template.render(**variables), user_template.render(**variables)
