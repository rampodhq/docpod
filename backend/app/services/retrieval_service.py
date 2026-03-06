from __future__ import annotations

import hashlib
import re
import uuid
from collections import Counter, defaultdict

from redis.asyncio import Redis

from app.core.config import settings
from app.services.crawl_service import CrawlService
from app.services.document_parse_service import DocumentParseService

_TOKEN_RE = re.compile(r"[a-zA-Z0-9]{2,}")
_WS_RE = re.compile(r"\s+")


class RetrievalService:
    def __init__(self) -> None:
        self._redis = Redis.from_url(settings.redis_cache_url, decode_responses=True)
        self._crawl = CrawlService()
        self._parse = DocumentParseService()
        self._ttl = settings.generation_redis_ttl_seconds
        self._chunk_size = max(500, settings.retrieval_chunk_size_chars)
        self._chunk_overlap = max(50, min(settings.retrieval_chunk_overlap_chars, self._chunk_size - 1))
        self._top_k = max(1, settings.retrieval_top_k_chunks)

    async def close(self) -> None:
        await self._redis.aclose()

    async def ingest_context_values(self, *, job_id: uuid.UUID, context_values: list[dict]) -> dict:
        prefix = self._prefix(job_id)
        chunk_count = 0
        source_count = 0

        for idx, item in enumerate(context_values):
            input_type = str(item.get("type", "TEXT")).upper()
            value = str(item.get("value", "")).strip()
            if not value:
                continue

            source_text = ""
            source_ref = value
            source_type = input_type

            if input_type == "WEBSITE":
                source_text = await self._safe_fetch_website(value)
            elif input_type == "FILE":
                source_text = self._parse.parse_path(value)
            else:
                source_text = value

            source_text = _normalize_text(source_text)
            if not source_text:
                continue

            source_count += 1
            chunk_ids = await self._store_source_chunks(
                prefix=prefix,
                source_id=f"src_{idx + 1}",
                source_type=source_type,
                source_ref=source_ref,
                text=source_text,
            )
            chunk_count += len(chunk_ids)

        await self._redis.expire(f"{prefix}:chunks", self._ttl)
        return {"sources": source_count, "chunks": chunk_count}

    async def retrieve_for_section(
        self,
        *,
        job_id: uuid.UUID,
        section_title: str,
        section_instructions: str | None,
        allowed_styles: list[str],
    ) -> dict:
        queries = self._build_section_queries(
            section_title=section_title,
            section_instructions=section_instructions,
            allowed_styles=allowed_styles,
        )
        scored: Counter[str] = Counter()
        score_meta: dict[str, dict] = {}

        for query in queries:
            candidate_ids = await self._candidate_chunk_ids(job_id=job_id, query=query)
            for cid in candidate_ids:
                chunk_key = f"{self._prefix(job_id)}:chunk:{cid}"
                data = await self._redis.hgetall(chunk_key)
                if not data:
                    continue
                score = self._score_chunk(query=query, chunk_text=data.get("text", ""), source_type=data.get("source_type", "TEXT"))
                if score <= 0:
                    continue
                scored[cid] += score
                score_meta[cid] = data

        ranked = scored.most_common(self._top_k)
        chunks = []
        for cid, score in ranked:
            data = score_meta.get(cid, {})
            chunks.append(
                {
                    "chunk_id": cid,
                    "score": float(score),
                    "source_type": data.get("source_type"),
                    "source_ref": data.get("source_ref"),
                    "text": data.get("text", ""),
                }
            )

        context_text = "\n".join(
            [f"- [{c['source_type']}] {c['text'][:1200]}" for c in chunks]
        ).strip()
        if not context_text:
            context_text = "No strongly relevant indexed context found for this section."

        return {
            "queries": queries,
            "chunks": chunks,
            "context_text": context_text,
        }

    async def cleanup_job(self, *, job_id: uuid.UUID) -> None:
        prefix = self._prefix(job_id)
        chunk_ids = await self._redis.smembers(f"{prefix}:chunks")

        keys: list[str] = [f"{prefix}:chunks"]
        for cid in chunk_ids:
            keys.append(f"{prefix}:chunk:{cid}")
        # Index keys are discovered by scan to avoid maintaining a second registry set.
        async for idx_key in self._redis.scan_iter(match=f"{prefix}:idx:*", count=500):
            keys.append(idx_key)

        if keys:
            await self._redis.delete(*keys)

    async def _safe_fetch_website(self, url: str) -> str:
        try:
            return await self._crawl.fetch_text(url)
        except Exception:
            return ""

    async def _store_source_chunks(
        self,
        *,
        prefix: str,
        source_id: str,
        source_type: str,
        source_ref: str,
        text: str,
    ) -> list[str]:
        chunks = _chunk_text(text, self._chunk_size, self._chunk_overlap)
        out_ids: list[str] = []

        for idx, chunk in enumerate(chunks):
            chunk_id = hashlib.sha1(f"{source_id}:{idx}:{chunk[:80]}".encode("utf-8")).hexdigest()
            out_ids.append(chunk_id)
            chunk_key = f"{prefix}:chunk:{chunk_id}"

            await self._redis.hset(
                chunk_key,
                mapping={
                    "text": chunk,
                    "source_type": source_type,
                    "source_ref": source_ref,
                },
            )
            await self._redis.expire(chunk_key, self._ttl)
            await self._redis.sadd(f"{prefix}:chunks", chunk_id)

            for token in _tokenize(chunk):
                idx_key = f"{prefix}:idx:{token}"
                await self._redis.sadd(idx_key, chunk_id)
                await self._redis.expire(idx_key, self._ttl)

        await self._redis.expire(f"{prefix}:chunks", self._ttl)
        return out_ids

    async def _candidate_chunk_ids(self, *, job_id: uuid.UUID, query: str) -> list[str]:
        prefix = self._prefix(job_id)
        tokens = _tokenize(query)
        if not tokens:
            return []

        buckets = []
        for token in tokens[:15]:
            ids = await self._redis.smembers(f"{prefix}:idx:{token}")
            if ids:
                buckets.append(ids)
        if not buckets:
            return []

        freq = defaultdict(int)
        for bucket in buckets:
            for cid in bucket:
                freq[cid] += 1
        return [cid for cid, _ in sorted(freq.items(), key=lambda item: item[1], reverse=True)[:100]]

    def _build_section_queries(
        self,
        *,
        section_title: str,
        section_instructions: str | None,
        allowed_styles: list[str],
    ) -> list[str]:
        title = _normalize_text(section_title)
        instr = _normalize_text(section_instructions or "")
        style_hint = ", ".join(allowed_styles[:3]).strip()
        queries = [title]
        if instr:
            queries.append(f"{title} {instr}")
        if style_hint:
            queries.append(f"{title} {style_hint}")
        return list(dict.fromkeys([q for q in queries if q]))

    def _score_chunk(self, *, query: str, chunk_text: str, source_type: str) -> float:
        q_tokens = _tokenize(query)
        c_tokens = set(_tokenize(chunk_text))
        if not q_tokens or not c_tokens:
            return 0

        overlap = sum(1 for t in q_tokens if t in c_tokens)
        phrase_bonus = 2 if query.lower() in chunk_text.lower() else 0
        trust_bonus = 2 if source_type == "FILE" else 1 if source_type == "TEXT" else 0
        return float(overlap * 3 + phrase_bonus + trust_bonus)

    @staticmethod
    def _prefix(job_id: uuid.UUID) -> str:
        return f"gen:{job_id}"


def _tokenize(text: str) -> list[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text.lower())]


def _normalize_text(text: str) -> str:
    return _WS_RE.sub(" ", text or "").strip()


def _chunk_text(text: str, size: int, overlap: int) -> list[str]:
    if len(text) <= size:
        return [text]
    out: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + size)
        out.append(text[start:end].strip())
        if end == n:
            break
        start = max(0, end - overlap)
    return [c for c in out if c]
