from __future__ import annotations

import re

from app.core.config import settings

_WHITESPACE_RE = re.compile(r"\s+")
_HTML_TAG_RE = re.compile(r"<[^>]+>")


class CrawlService:
    async def fetch_text(self, url: str) -> str:
        import httpx

        async with httpx.AsyncClient(
            timeout=settings.web_fetch_timeout_seconds,
            follow_redirects=True,
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text

        text = self._extract_with_trafilatura(html)
        if not text:
            text = _HTML_TAG_RE.sub(" ", html)
        return _WHITESPACE_RE.sub(" ", text).strip()

    def _extract_with_trafilatura(self, html: str) -> str:
        try:
            import trafilatura  # type: ignore
        except Exception:
            return ""

        extracted = trafilatura.extract(html, include_comments=False, include_tables=True)
        return (extracted or "").strip()
