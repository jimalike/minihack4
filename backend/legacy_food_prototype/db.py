"""SQLite connection + schema bootstrap for the Thai-food knowledge base.

The DB has two real tables — `recipes` and `recipe_chunks` — plus an FTS5
virtual table over chunk content for BM25 retrieval. Embeddings are stored
inline on `recipe_chunks` as float32 BLOBs.

The trigram tokenizer is chosen on purpose: Thai has no whitespace word
boundaries, so the default `unicode61` tokenizer would treat each Thai
sentence as a single token and BM25 would degenerate to substring matching.
Trigrams also tolerate the OCR-induced typos we get from Stage 1.
"""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "thai_food.db"


def db_path() -> Path:
    raw = os.getenv("THAI_FOOD_DB_PATH", "").strip()
    if not raw:
        return DEFAULT_DB_PATH
    p = Path(raw)
    return p if p.is_absolute() else BACKEND_DIR / p


def get_conn() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


SCHEMA_DDL = [
    """
    CREATE TABLE IF NOT EXISTS recipes (
      id                 INTEGER PRIMARY KEY,
      name               TEXT NOT NULL,
      full_text          TEXT NOT NULL,
      ingredients_text   TEXT,
      method_text        TEXT,
      source             TEXT NOT NULL DEFAULT 'pythainlp/thai_food_v1.0'
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name)",
    """
    CREATE TABLE IF NOT EXISTS recipe_chunks (
      id          INTEGER PRIMARY KEY,
      recipe_id   INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL CHECK (kind IN ('name','ingredients','method')),
      content     TEXT NOT NULL,
      embedding   BLOB
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_chunks_recipe ON recipe_chunks(recipe_id)",
    """
    CREATE VIRTUAL TABLE IF NOT EXISTS recipe_chunks_fts USING fts5(
      content,
      kind UNINDEXED,
      recipe_id UNINDEXED,
      tokenize = 'trigram',
      content = 'recipe_chunks',
      content_rowid = 'id'
    )
    """,
    """
    CREATE TRIGGER IF NOT EXISTS recipe_chunks_ai
    AFTER INSERT ON recipe_chunks BEGIN
      INSERT INTO recipe_chunks_fts(rowid, content, kind, recipe_id)
      VALUES (new.id, new.content, new.kind, new.recipe_id);
    END
    """,
    """
    CREATE TRIGGER IF NOT EXISTS recipe_chunks_ad
    AFTER DELETE ON recipe_chunks BEGIN
      INSERT INTO recipe_chunks_fts(recipe_chunks_fts, rowid, content, kind, recipe_id)
      VALUES ('delete', old.id, old.content, old.kind, old.recipe_id);
    END
    """,
    """
    CREATE TRIGGER IF NOT EXISTS recipe_chunks_au
    AFTER UPDATE ON recipe_chunks BEGIN
      INSERT INTO recipe_chunks_fts(recipe_chunks_fts, rowid, content, kind, recipe_id)
      VALUES ('delete', old.id, old.content, old.kind, old.recipe_id);
      INSERT INTO recipe_chunks_fts(rowid, content, kind, recipe_id)
      VALUES (new.id, new.content, new.kind, new.recipe_id);
    END
    """,
]


def bootstrap_schema(conn: sqlite3.Connection) -> None:
    for stmt in SCHEMA_DDL:
        conn.execute(stmt)
    conn.commit()


def reset_schema(conn: sqlite3.Connection) -> None:
    """Drop everything (used by build_index --rebuild). Order matters: triggers
    and FTS first, then real tables."""
    conn.executescript(
        """
        DROP TRIGGER IF EXISTS recipe_chunks_au;
        DROP TRIGGER IF EXISTS recipe_chunks_ad;
        DROP TRIGGER IF EXISTS recipe_chunks_ai;
        DROP TABLE IF EXISTS recipe_chunks_fts;
        DROP TABLE IF EXISTS recipe_chunks;
        DROP TABLE IF EXISTS recipes;
        """
    )
    conn.commit()
    bootstrap_schema(conn)
