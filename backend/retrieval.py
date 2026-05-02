"""Search over the Thai-food SQLite KB.

Three modes:
  - bm25_search:   FTS5 BM25 over chunk content (lexical, fast, no API call)
  - vector_search: cosine similarity over bge-m3 embeddings (semantic, 1 API call/query)
  - hybrid_search: Reciprocal Rank Fusion of the two

The embedding matrix is small (≈400 chunks × 1024 dims ≈ 1.6 MB) so we load
it once into a module-level numpy array and never touch SQLite for vector math.
"""
from __future__ import annotations

import logging
import re
import sqlite3
from dataclasses import dataclass, field
from typing import Literal

import numpy as np

from db import get_conn
from embeddings import embed_texts

logger = logging.getLogger("kindee.retrieval")

SearchMode = Literal["bm25", "vector", "hybrid"]
RRF_K = 60

# Cached embedding matrix + chunk metadata, keyed by chunk_id position.
_VECTORS: np.ndarray | None = None  # shape (N, D), L2-normalised, dtype float32
_META: list["ChunkMeta"] | None = None


@dataclass
class ChunkMeta:
    chunk_id: int
    recipe_id: int
    recipe_name: str
    kind: str
    content: str


@dataclass
class Hit:
    recipe_id: int
    recipe_name: str
    chunk_id: int
    kind: str
    content: str
    score: float
    bm25_rank: int | None = None
    vector_rank: int | None = None

    def to_dict(self) -> dict:
        return {
            "recipe_id": self.recipe_id,
            "name": self.recipe_name,
            "kind": self.kind,
            "content": self.content,
            "score": self.score,
        }


# ---------------------------------------------------------------------------
# Cache loading
# ---------------------------------------------------------------------------

def _load_cache(force: bool = False) -> tuple[np.ndarray, list[ChunkMeta]]:
    global _VECTORS, _META
    if _VECTORS is not None and _META is not None and not force:
        return _VECTORS, _META

    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT c.id, c.recipe_id, r.name, c.kind, c.content, c.embedding
            FROM recipe_chunks c
            JOIN recipes r ON r.id = c.recipe_id
            WHERE c.embedding IS NOT NULL
            ORDER BY c.id
            """
        ).fetchall()
    finally:
        conn.close()

    if not rows:
        _VECTORS = np.zeros((0, 0), dtype=np.float32)
        _META = []
        return _VECTORS, _META

    meta: list[ChunkMeta] = []
    vecs: list[np.ndarray] = []
    for row in rows:
        v = np.frombuffer(row["embedding"], dtype=np.float32)
        vecs.append(v)
        meta.append(
            ChunkMeta(
                chunk_id=row["id"],
                recipe_id=row["recipe_id"],
                recipe_name=row["name"],
                kind=row["kind"],
                content=row["content"],
            )
        )
    matrix = np.vstack(vecs).astype(np.float32, copy=False)
    # L2-normalise once so cosine == dot product later.
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    matrix = matrix / norms

    _VECTORS = matrix
    _META = meta
    logger.info("retrieval cache loaded | chunks=%d | dim=%d", matrix.shape[0], matrix.shape[1])
    return _VECTORS, _META


def invalidate_cache() -> None:
    global _VECTORS, _META
    _VECTORS = None
    _META = None


# ---------------------------------------------------------------------------
# BM25 (FTS5)
# ---------------------------------------------------------------------------

# FTS5 query syntax treats these characters specially; for OCR'd Thai we just
# want a phrase match, so we strip anything that could blow up the parser and
# wrap whatever's left in double quotes.
_FTS_STRIP = re.compile(r'["\(\)\*\:\^]+')


def _fts_query(raw: str) -> str:
    cleaned = _FTS_STRIP.sub(" ", raw or "").strip()
    if not cleaned:
        return ""
    # Trigram tokenizer requires tokens of ≥3 chars. Whitespace-split first;
    # if the whole string is one short token (typical for Thai dish names),
    # fall back to using the full cleaned string verbatim.
    tokens = [tok for tok in cleaned.split() if len(tok) >= 3]
    if not tokens:
        if len(cleaned.replace(" ", "")) >= 3:
            return f'"{cleaned}"'
        return ""
    return " OR ".join(f'"{tok}"' for tok in tokens)


def bm25_search(query: str, k: int = 5) -> list[Hit]:
    fts_q = _fts_query(query)
    if not fts_q:
        return []
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT c.id AS chunk_id, c.recipe_id, r.name AS recipe_name,
                   c.kind, c.content,
                   bm25(recipe_chunks_fts) AS score
            FROM recipe_chunks_fts
            JOIN recipe_chunks c ON c.id = recipe_chunks_fts.rowid
            JOIN recipes r ON r.id = c.recipe_id
            WHERE recipe_chunks_fts MATCH ?
            ORDER BY score
            LIMIT ?
            """,
            (fts_q, k),
        ).fetchall()
    except sqlite3.OperationalError as exc:
        # Malformed FTS query — degrade gracefully so the agent still gets *something*.
        logger.warning("BM25 query failed (%r): %s", fts_q, exc)
        return []
    finally:
        conn.close()

    return [
        Hit(
            recipe_id=row["recipe_id"],
            recipe_name=row["recipe_name"],
            chunk_id=row["chunk_id"],
            kind=row["kind"],
            content=row["content"],
            score=float(row["score"]),
        )
        for row in rows
    ]


# ---------------------------------------------------------------------------
# Vector
# ---------------------------------------------------------------------------

async def vector_search(query: str, k: int = 5) -> list[Hit]:
    if not query or not query.strip():
        return []
    matrix, meta = _load_cache()
    if matrix.shape[0] == 0:
        return []

    vecs = await embed_texts([query])
    q = np.asarray(vecs[0], dtype=np.float32)
    n = np.linalg.norm(q)
    if n == 0:
        return []
    q = q / n

    sims = matrix @ q  # (N,)
    top_idx = np.argsort(-sims)[:k]
    hits: list[Hit] = []
    for idx in top_idx:
        m = meta[int(idx)]
        hits.append(
            Hit(
                recipe_id=m.recipe_id,
                recipe_name=m.recipe_name,
                chunk_id=m.chunk_id,
                kind=m.kind,
                content=m.content,
                score=float(sims[int(idx)]),
            )
        )
    return hits


# ---------------------------------------------------------------------------
# Hybrid (Reciprocal Rank Fusion)
# ---------------------------------------------------------------------------

async def hybrid_search(query: str, k: int = 5) -> list[Hit]:
    if not query or not query.strip():
        return []

    pool = max(k * 4, 10)
    bm25_hits = bm25_search(query, k=pool)
    try:
        vec_hits = await vector_search(query, k=pool)
    except Exception:
        # If embeddings are unavailable (no API key, no network), still serve
        # BM25 results — the agent should never lose retrieval entirely.
        logger.exception("vector_search failed inside hybrid; falling back to BM25 only")
        vec_hits = []

    fused: dict[int, Hit] = {}

    def _accumulate(hits: list[Hit], rank_field: str) -> None:
        for rank, h in enumerate(hits):
            entry = fused.get(h.chunk_id)
            if entry is None:
                entry = Hit(
                    recipe_id=h.recipe_id,
                    recipe_name=h.recipe_name,
                    chunk_id=h.chunk_id,
                    kind=h.kind,
                    content=h.content,
                    score=0.0,
                )
                fused[h.chunk_id] = entry
            entry.score += 1.0 / (RRF_K + rank + 1)
            setattr(entry, rank_field, rank + 1)

    _accumulate(bm25_hits, "bm25_rank")
    _accumulate(vec_hits, "vector_rank")

    # Dedupe to the best chunk per recipe so the final list is unique recipes.
    by_recipe: dict[int, Hit] = {}
    for h in sorted(fused.values(), key=lambda x: -x.score):
        if h.recipe_id not in by_recipe:
            by_recipe[h.recipe_id] = h
        if len(by_recipe) >= k:
            break
    return list(by_recipe.values())


def search(query: str, k: int = 5, mode: SearchMode = "hybrid") -> list[Hit]:
    """Sync wrapper for callers that don't want to await."""
    import asyncio
    if mode == "bm25":
        return bm25_search(query, k=k)
    if mode == "vector":
        return asyncio.run(vector_search(query, k=k))
    return asyncio.run(hybrid_search(query, k=k))
