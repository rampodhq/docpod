from __future__ import annotations

import json
from typing import Any

from litellm import acompletion

from app.core.config import settings


class LLMService:
    def __init__(self) -> None:
        self._provider = settings.llm_provider.strip().lower()
        self._api_key = self._resolve_api_key()
        self._timeout = settings.llm_timeout_seconds
        self._temperature = settings.llm_temperature

    def _resolve_api_key(self) -> str:
        if self._provider == "openrouter":
            return settings.llm_openrouter_api_key
        if self._provider == "groq":
            return settings.llm_groq_api_key
        return ""

    def _resolve_model(self, model: str) -> str:
        if self._provider == "openrouter" and not model.startswith("openrouter/"):
            return f"openrouter/{model}"
        return model

    def _completion_kwargs(self, model: str, temperature: float) -> dict[str, Any]:
        kwargs: dict[str, Any] = {
            "model": self._resolve_model(model),
            "api_key": self._api_key,
            "timeout": self._timeout,
            "temperature": temperature,
        }

        if self._provider == "openrouter":
            kwargs["api_base"] = settings.llm_openrouter_api_base
            extra_headers: dict[str, str] = {}
            if settings.llm_openrouter_http_referer:
                extra_headers["HTTP-Referer"] = settings.llm_openrouter_http_referer
            if settings.llm_openrouter_app_name:
                extra_headers["X-Title"] = settings.llm_openrouter_app_name
            if extra_headers:
                kwargs["extra_headers"] = extra_headers

        return kwargs

    async def generate_text(
        self,
        *,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float | None = None,
    ) -> str:
        if not self._api_key:
            raise ValueError(f"LLM API key is not configured for provider '{self._provider}'")

        request_temperature = self._temperature if temperature is None else temperature
        kwargs = self._completion_kwargs(model=model, temperature=request_temperature)
        kwargs["messages"] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        response = await acompletion(**kwargs)
        return (response.choices[0].message.content or "").strip()

    async def generate_json(
        self,
        *,
        model: str,
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any]:
        prompt = (
            f"{user_prompt}\n\n"
            "Return only strict JSON. Do not include markdown fences."
        )
        raw = await self.generate_text(
            model=model,
            system_prompt=system_prompt,
            user_prompt=prompt,
            temperature=0,
        )

        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            raise ValueError("Model did not return valid JSON") from e
