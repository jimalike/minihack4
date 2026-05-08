"""Download pythainlp/thai_food_v1.0, populate SQLite, embed every chunk.

Idempotent: by default skips recipes whose `name` is already in the DB and
only embeds chunks whose `embedding` is still NULL. Use --rebuild to wipe
and start over.

    cd backend
    python -m scripts.build_index            # incremental
    python -m scripts.build_index --rebuild  # nuke and re-embed
"""
from __future__ import annotations

import argparse
import asyncio
import csv
import logging
import re
import sys
from pathlib import Path

import numpy as np
from dotenv import load_dotenv

# Allow `python -m scripts.build_index` from inside backend/ as well as
# `python scripts/build_index.py` from outside.
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / ".env")

from db import bootstrap_schema, db_path, get_conn, reset_schema  # noqa: E402
from embeddings import embed_texts  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("build_index")

DATASET_NAME = "pythainlp/thai_food_v1.0"
EMBED_BATCH = 16  # embed this many chunks per API call

# Headings used by the dataset's markdown body.
INGREDIENTS_HEADING = "## เครื่องปรุง"
METHOD_HEADING = "## วิธีทำ"


def parse_recipe_text(text: str) -> tuple[str, str]:
    """Split a recipe markdown body into (ingredients_text, method_text).
    If a heading is missing, that side is returned as ''."""
    if not text:
        return "", ""

    ingredients = ""
    method = ""

    ing_idx = text.find(INGREDIENTS_HEADING)
    method_idx = text.find(METHOD_HEADING)

    if ing_idx != -1:
        end = method_idx if method_idx != -1 and method_idx > ing_idx else len(text)
        ingredients = text[ing_idx + len(INGREDIENTS_HEADING) : end].strip()

    if method_idx != -1:
        method = text[method_idx + len(METHOD_HEADING) :].strip()

    if not ingredients and not method:
        # No headings at all — keep the whole body under "method" so search still works.
        method = text.strip()

    return ingredients, method


def insert_recipe(
    conn,
    name: str,
    full_text: str,
    ingredients: str,
    method: str,
    source: str | None = None,
) -> int:
    if source is None:
        cur = conn.execute(
            """
            INSERT INTO recipes (name, full_text, ingredients_text, method_text)
            VALUES (?, ?, ?, ?)
            """,
            (name, full_text, ingredients or None, method or None),
        )
    else:
        cur = conn.execute(
            """
            INSERT INTO recipes (name, full_text, ingredients_text, method_text, source)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, full_text, ingredients or None, method or None, source),
        )
    recipe_id = cur.lastrowid

    chunks: list[tuple[str, str]] = [("name", name)]
    if ingredients:
        chunks.append(("ingredients", f"{name}\n{INGREDIENTS_HEADING}\n{ingredients}"))
    if method:
        chunks.append(("method", f"{name}\n{METHOD_HEADING}\n{method}"))

    conn.executemany(
        "INSERT INTO recipe_chunks (recipe_id, kind, content) VALUES (?, ?, ?)",
        [(recipe_id, kind, content) for kind, content in chunks],
    )
    return recipe_id


CSV_PIPE_RE = re.compile(r"\s*\|\s*")
CSV_PATH = BACKEND_DIR / "data" / "thaifood_recipes_merged.csv"


def _split_pipes(value: str) -> str:
    """Convert a pipe-separated CSV cell into newline-separated text."""
    if not value:
        return ""
    parts = [p.strip() for p in CSV_PIPE_RE.split(value) if p.strip()]
    return "\n".join(parts)


def load_recipes_csv(conn, csv_path: Path = CSV_PATH) -> tuple[int, int]:
    """Load `thaifood_recipes_merged.csv` into the same recipes/recipe_chunks
    tables, tagging each row with the CSV's `source` column. Idempotent: skips
    any (name, source) pair already in the DB. Returns (added, skipped)."""
    if not csv_path.exists():
        logger.warning("CSV not found at %s — skipping", csv_path)
        return 0, 0

    added = 0
    skipped = 0
    with open(csv_path, encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            name = (row.get("menu_name") or "").strip()
            ingredients = _split_pipes(row.get("ingredients") or "")
            method = _split_pipes(row.get("instructions") or "")
            source = (row.get("source") or "").strip() or "thaifood_recipes_merged.csv"

            if not name or not ingredients:
                continue

            existing = conn.execute(
                "SELECT 1 FROM recipes WHERE name = ? AND source = ?",
                (name, source),
            ).fetchone()
            if existing:
                skipped += 1
                continue

            full_text = (
                f"# {name}\n"
                f"{INGREDIENTS_HEADING}\n{ingredients}"
                + (f"\n{METHOD_HEADING}\n{method}" if method else "")
            )
            insert_recipe(
                conn,
                name=name,
                full_text=full_text,
                ingredients=ingredients,
                method=method,
                source=source,
            )
            added += 1

    conn.commit()
    return added, skipped


def load_dataset_rows() -> list[dict]:
    from datasets import load_dataset

    ds = load_dataset(DATASET_NAME, split="train")
    rows: list[dict] = []
    seen: set[str] = set()
    for row in ds:
        name = (row.get("name") or "").strip()
        text = row.get("text") or ""
        if not (name and text):
            continue
        if name in seen:
            # Dataset has a few duplicate names; first one wins.
            continue
        seen.add(name)
        rows.append({"name": name, "text": text})
    return rows


async def embed_pending(conn) -> int:
    """Embed every chunk whose embedding is NULL. Returns count embedded."""
    rows = conn.execute(
        "SELECT id, content FROM recipe_chunks WHERE embedding IS NULL ORDER BY id"
    ).fetchall()
    if not rows:
        return 0

    total = 0
    for i in range(0, len(rows), EMBED_BATCH):
        batch = rows[i : i + EMBED_BATCH]
        texts = [r["content"] for r in batch]
        vectors = await embed_texts(texts)
        updates = []
        for r, vec in zip(batch, vectors):
            arr = np.asarray(vec, dtype=np.float32).tobytes()
            updates.append((arr, r["id"]))
        conn.executemany(
            "UPDATE recipe_chunks SET embedding = ? WHERE id = ?",
            updates,
        )
        conn.commit()
        total += len(updates)
        logger.info("embedded %d / %d", total, len(rows))
    return total


async def run(rebuild: bool) -> None:
    conn = get_conn()
    try:
        if rebuild:
            logger.info("--rebuild: dropping all tables")
            reset_schema(conn)
        else:
            bootstrap_schema(conn)

        existing_names = {
            r["name"]
            for r in conn.execute("SELECT name FROM recipes").fetchall()
        }
        logger.info("existing recipes in DB: %d", len(existing_names))

        logger.info("loading dataset %s …", DATASET_NAME)
        rows = load_dataset_rows()
        logger.info("dataset rows: %d", len(rows))

        added = 0
        skipped = 0
        for row in rows:
            if row["name"] in existing_names:
                skipped += 1
                continue
            ingredients, method = parse_recipe_text(row["text"])
            insert_recipe(conn, row["name"], row["text"], ingredients, method)
            added += 1
        conn.commit()
        logger.info("inserted recipes: %d (skipped existing: %d)", added, skipped)

        csv_added, csv_skipped = load_recipes_csv(conn)
        logger.info(
            "thaifood_recipes_merged.csv | added=%d | skipped=%d",
            csv_added, csv_skipped,
        )

        embedded = await embed_pending(conn)

        recipe_count = conn.execute("SELECT COUNT(*) AS n FROM recipes").fetchone()["n"]
        chunk_count = conn.execute("SELECT COUNT(*) AS n FROM recipe_chunks").fetchone()["n"]
        embedded_count = conn.execute(
            "SELECT COUNT(*) AS n FROM recipe_chunks WHERE embedding IS NOT NULL"
        ).fetchone()["n"]

        size_bytes = db_path().stat().st_size if db_path().exists() else 0
        logger.info(
            "DONE | recipes=%d | chunks=%d | embedded=%d | newly_embedded=%d | db=%s | size=%.1f MB",
            recipe_count, chunk_count, embedded_count, embedded,
            db_path(), size_bytes / (1024 * 1024),
        )
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Drop all tables and re-import from scratch.",
    )
    args = parser.parse_args()
    asyncio.run(run(rebuild=args.rebuild))


if __name__ == "__main__":
    main()
