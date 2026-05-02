"""OpenRouter embeddings client (OpenAI-compatible /embeddings endpoint).

Mirrors the env-var conventions and error semantics of `_call_openrouter`
in main.py so the two clients feel like the same surface.
"""
from __future__ import annotations

import logging
import os
from typing import Iterable

import httpx
from fastapi import HTTPException

logger = logging.getLogger("kindee.embeddings")

DEFAULT_MODEL = "baai/bge-m3"
DEFAULT_BATCH_SIZE = 32
DEFAULT_TIMEOUT = 60.0


def _api_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise HTTPException(
            status_code=503,
            detail="OPENROUTER_API_KEY is not configured on the server.",
        )
    return key


def _base_url() -> str:
    return os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").strip().rstrip("/")


def _model() -> str:
    return os.getenv("OPENROUTER_EMBEDDING_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL


def _chunked(seq: list[str], size: int) -> Iterable[list[str]]:
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


async def embed_texts(
    texts: list[str],
    *,
    batch_size: int = DEFAULT_BATCH_SIZE,
    timeout: float = DEFAULT_TIMEOUT,
) -> list[list[float]]:
    """Embed a list of strings via OpenRouter; returns one vector per input,
    in the same order. Empty input returns an empty list."""
    if not texts:
        return []

    headers = {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "kindee thai-food embeddings",
    }
    url = f"{_base_url()}/embeddings"
    model = _model()

    out: list[list[float]] = []
    async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
        for batch in _chunked(texts, batch_size):
            payload = {"model": model, "input": batch}
            try:
                resp = await client.post(url, headers=headers, json=payload)
            except httpx.HTTPError as exc:
                logger.exception("OpenRouter embeddings request failed (model=%s)", model)
                raise HTTPException(
                    status_code=502, detail=f"OpenRouter embeddings request failed: {exc}"
                ) from exc

            if resp.status_code >= 400:
                logger.error(
                    "OpenRouter embeddings %s returned %s: %s",
                    model, resp.status_code, resp.text[:500],
                )
                raise HTTPException(
                    status_code=502,
                    detail=f"OpenRouter embeddings error {resp.status_code}: {resp.text[:200]}",
                )

            body = resp.json()
            try:
                items = body["data"]
            except (KeyError, TypeError) as exc:
                raise HTTPException(
                    status_code=502, detail="Unexpected embeddings response shape."
                ) from exc

            # OpenAI-compatible: each item has .index and .embedding; sort by index.
            items_sorted = sorted(items, key=lambda it: it.get("index", 0))
            for it in items_sorted:
                vec = it.get("embedding")
                if not isinstance(vec, list):
                    raise HTTPException(
                        status_code=502, detail="Embedding payload missing vector."
                    )
                out.append(vec)

    if len(out) != len(texts):
        raise HTTPException(
            status_code=502,
            detail=f"Embedding count mismatch: got {len(out)}, expected {len(texts)}.",
        )
    return out
