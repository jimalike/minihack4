"""kindee menu-scan backend.

POST /api/scan-menu  — multipart upload of a menu photo
                       returns { rows: MenuCautionRow[] }
GET  /health         — sanity check

Pipeline (2-stage agent):
  Stage 1 (vision): exhaustively transcribe every menu item visible.
                    Output is intentionally tiny per-item so the model can fit ALL items.
  Stage 2 (text):   for each transcribed item, derive English translation,
                    likely allergens, caution notes, and a vendor question.

Splitting these jobs avoids the failure mode where a single multimodal call
runs out of attention/tokens and silently drops menu items.
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import re
from datetime import datetime
from typing import Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-3-27b-it").strip()
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", OPENROUTER_MODEL).strip()
OPENROUTER_TEXT_MODEL = os.getenv("OPENROUTER_TEXT_MODEL", OPENROUTER_MODEL).strip()
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").strip().rstrip("/")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]

ALLOWED_INGREDIENTS = [
    "fishSauce", "shrimpPaste", "peanuts", "egg",
    "oysterSauce", "driedShrimp", "boneBroth", "soySauce",
    "wheatNoodles", "pork", "coconutMilk", "sesameSeeds",
]
IngredientKey = Literal[
    "fishSauce", "shrimpPaste", "peanuts", "egg",
    "oysterSauce", "driedShrimp", "boneBroth", "soySauce",
    "wheatNoodles", "pork", "coconutMilk", "sesameSeeds",
]
ConfidenceLevel = Literal["Low", "Medium", "High"]

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB
MAX_EXTRACTED_ITEMS = 40
ALLOWED_MIME_PREFIX = "image/"

logger = logging.getLogger("kindee.scan")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ExtractedItem(BaseModel):
    """Stage 1 output — just what the OCR can read off the menu."""
    thai: str
    proteinOptions: list[str] = Field(default_factory=list)
    price: str = ""


class ExtractResponse(BaseModel):
    items: list[ExtractedItem]


class AnalyzedItem(BaseModel):
    """Stage 2 output — what we infer from the dish name (text-only LLM)."""
    english: str
    confidence: ConfidenceLevel = "Medium"
    likelyContains: list[IngredientKey] = Field(default_factory=list)
    cautionNotes: list[str] = Field(default_factory=list)
    askVendor: str = ""


class AnalyzeResponse(BaseModel):
    analyses: list[AnalyzedItem]


class ServerMenuRow(BaseModel):
    """Final shape returned to the frontend (one per menu item)."""
    thai: str
    english: str
    price: str = ""
    confidence: ConfidenceLevel
    likelyContains: list[IngredientKey] = Field(default_factory=list)
    cautionNotes: list[str] = Field(default_factory=list)
    askVendor: str = ""


class ScanResponse(BaseModel):
    rows: list[ServerMenuRow]


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

STAGE1_SYSTEM = (
    "You are a strict OCR transcriber for Thai street food menus. Your ONLY job "
    "is to read the Thai text in the image and list every menu item you can see. "
    "Do NOT analyze ingredients or allergens. Do NOT translate. Be exhaustive — "
    "missing items is worse than including a slightly imperfect transcription. "
    "Output STRICT JSON only — no prose, no markdown fences."
)

STAGE1_USER = f"""Look at the photographed menu and list EVERY menu item you can see — Thai food menus often have 15–30 items in a single column. Be exhaustive.

For each menu item, return:
- thai: the Thai characters EXACTLY as printed (verbatim, no normalization, no rephrasing)
- proteinOptions: array of protein/main choices written next to the item if visible, transliterated using lower-case English keys.
  Examples of mapping: เนื้อ → "beef", หมู → "pork", ไก่ → "chicken", ปลาหมึก → "squid",
  กุ้ง → "shrimp", ปลา → "fish", เครื่องใน → "offal", เต้าหู้ → "tofu", ไข่ → "egg".
  Empty array if no protein choices are listed.
- price: price string EXACTLY as printed next to the item (e.g. "60", "60฿", "100 บาท"); "" if no price is visible.

Return JSON in EXACTLY this shape, no extra keys:
{{ "items": [ {{ "thai": "...", "proteinOptions": [...], "price": "..." }} ] }}

Hard rules:
- Up to {MAX_EXTRACTED_ITEMS} items. Do NOT cut the list short — Thai street menus often have 20+ items.
- If the image is not a menu at all, return {{ "items": [] }}.
- Do NOT include category headings like "อาหารตามสั่ง" or "เมนูแนะนำ" as items.
"""

STAGE2_SYSTEM = (
    "You are a Thai food allergen analyst helping foreign travelers. Given a list "
    "of Thai dish names, produce a structured allergen / caution analysis for "
    "each dish using your knowledge of typical Thai street food recipes. Output "
    "STRICT JSON only — no prose, no markdown fences."
)


def build_stage2_user_prompt(items: list[ExtractedItem]) -> str:
    listing = "\n".join(
        f"{i + 1}. thai={item.thai!r} proteinOptions={item.proteinOptions} price={item.price!r}"
        for i, item in enumerate(items)
    )
    return f"""Below is a list of {len(items)} Thai dishes transcribed from a street-food menu.
For EACH dish (in order, same length, do NOT skip), produce an analysis object:

- english: literal English translation of THIS Thai name (do not invent a different dish).
  If the dish has protein options, mention them in parentheses, e.g. "Holy basil stir-fry (beef / pork / chicken / squid)".
- confidence: "High" if the dish name is well-known and you are confident about typical ingredients;
  "Medium" if you are reasonably sure; "Low" if the name is unusual or you are guessing.
- likelyContains: ingredient keys from this CLOSED set (omit any not relevant):
  {ALLOWED_INGREDIENTS}
- cautionNotes: 1-3 short English notes about hidden ingredients or cross-contact risks
  for THIS specific dish. Be concrete (e.g. "Curry paste typically contains shrimp paste").
- askVendor: ONE short, polite English sentence the traveler can ask the vendor about this dish.

Return JSON in EXACTLY this shape:
{{ "analyses": [ {{ "english": "...", "confidence": "...", "likelyContains": [...],
                   "cautionNotes": [...], "askVendor": "..." }} ] }}

Critical rules:
- Output exactly {len(items)} analyses, in the same order as the input list.
- Never invent ingredient keys outside the allowed set.
- Base your analysis on the Thai text given — do NOT replace with a more famous dish.

INPUT:
{listing}
"""


# ---------------------------------------------------------------------------
# OpenRouter helper
# ---------------------------------------------------------------------------

async def _call_openrouter(
    *,
    model: str,
    messages: list[dict],
    timeout: float = 60.0,
) -> str:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="OPENROUTER_API_KEY is not configured on the server.")

    payload = {
        "model": model,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "temperature": 0.0,
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "kindee menu scan",
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
            resp = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
    except httpx.HTTPError as exc:
        logger.exception("OpenRouter request failed (model=%s)", model)
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {exc}") from exc

    if resp.status_code >= 400:
        logger.error("OpenRouter %s returned %s: %s", model, resp.status_code, resp.text[:500])
        raise HTTPException(
            status_code=502,
            detail=f"OpenRouter error {resp.status_code}: {resp.text[:200]}",
        )

    body = resp.json()
    try:
        return body["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError) as exc:
        logger.error("Unexpected OpenRouter response shape (model=%s): %s", model, body)
        raise HTTPException(status_code=502, detail="Unexpected response from model.") from exc


# ---------------------------------------------------------------------------
# Pipeline stages
# ---------------------------------------------------------------------------

async def stage1_extract(image_bytes: bytes, mime: str) -> tuple[list[ExtractedItem], str]:
    data_url = f"data:{mime};base64,{base64.b64encode(image_bytes).decode('ascii')}"
    messages = [
        {"role": "system", "content": STAGE1_SYSTEM},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": STAGE1_USER},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        },
    ]
    raw = await _call_openrouter(model=OPENROUTER_VISION_MODEL, messages=messages)
    parsed = _parse_model_json(raw) or {}
    items: list[ExtractedItem] = []
    for entry in (parsed.get("items") or [])[:MAX_EXTRACTED_ITEMS]:
        try:
            item = ExtractedItem.model_validate(entry)
        except ValidationError:
            continue
        if item.thai.strip():
            items.append(item)
    return items, raw


async def stage2_analyze(items: list[ExtractedItem]) -> tuple[list[AnalyzedItem], str]:
    if not items:
        return [], ""
    messages = [
        {"role": "system", "content": STAGE2_SYSTEM},
        {"role": "user", "content": build_stage2_user_prompt(items)},
    ]
    raw = await _call_openrouter(model=OPENROUTER_TEXT_MODEL, messages=messages)
    parsed = _parse_model_json(raw) or {}
    analyses: list[AnalyzedItem] = []
    for entry in parsed.get("analyses") or []:
        try:
            analyses.append(AnalyzedItem.model_validate(entry))
        except ValidationError:
            # keep alignment by inserting a placeholder so indices match
            analyses.append(AnalyzedItem(english="", confidence="Low"))
    # Pad / truncate so we always have one analysis per extracted item
    while len(analyses) < len(items):
        analyses.append(AnalyzedItem(english="", confidence="Low"))
    return analyses[: len(items)], raw


def merge_to_rows(items: list[ExtractedItem], analyses: list[AnalyzedItem]) -> list[ServerMenuRow]:
    rows: list[ServerMenuRow] = []
    for item, analysis in zip(items, analyses):
        english = analysis.english.strip() or item.thai
        notes = list(analysis.cautionNotes or [])
        if item.proteinOptions:
            notes.insert(0, "Protein options: " + " / ".join(item.proteinOptions))
        rows.append(
            ServerMenuRow(
                thai=item.thai,
                english=english,
                price=item.price,
                confidence=analysis.confidence,
                likelyContains=list(analysis.likelyContains or []),
                cautionNotes=notes[:4],
                askVendor=analysis.askVendor or "Could you tell me what's in this dish?",
            )
        )
    return rows


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="kindee menu scan", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "vision_model": OPENROUTER_VISION_MODEL,
        "text_model": OPENROUTER_TEXT_MODEL,
        "openrouter_configured": bool(OPENROUTER_API_KEY),
    }


@app.post("/api/scan-menu", response_model=ScanResponse)
async def scan_menu(file: UploadFile = File(...)) -> ScanResponse:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="OPENROUTER_API_KEY is not configured on the server.")

    if not file.content_type or not file.content_type.startswith(ALLOWED_MIME_PREFIX):
        raise HTTPException(status_code=415, detail=f"Expected image/*, got {file.content_type!r}.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"Image is larger than {MAX_UPLOAD_BYTES // (1024*1024)} MB.")

    started = datetime.now()

    items, stage1_raw = await stage1_extract(raw, file.content_type)
    logger.info(
        "stage1 done | model=%s | items=%d | bytes=%d | filename=%s",
        OPENROUTER_VISION_MODEL, len(items), len(raw), file.filename,
    )

    analyses, stage2_raw = await stage2_analyze(items)
    logger.info("stage2 done | model=%s | analyses=%d", OPENROUTER_TEXT_MODEL, len(analyses))

    rows = merge_to_rows(items, analyses)
    elapsed = (datetime.now() - started).total_seconds()
    logger.info("scan-menu OK | rows=%d | elapsed=%.1fs", len(rows), elapsed)

    _persist_debug_dump(
        filename=file.filename or "upload",
        image_bytes=raw,
        mime=file.content_type or "image/jpeg",
        stage1_raw=stage1_raw,
        stage2_raw=stage2_raw,
        rows=rows,
    )

    return ScanResponse(rows=rows)


# ---------------------------------------------------------------------------
# Debug + JSON salvage helpers
# ---------------------------------------------------------------------------

DEBUG_DIR = os.path.join(os.path.dirname(__file__), "debug")


def _persist_debug_dump(
    *,
    filename: str,
    image_bytes: bytes,
    mime: str,
    stage1_raw: str,
    stage2_raw: str,
    rows: list[ServerMenuRow],
) -> None:
    """Save the uploaded image + raw model responses + final rows for inspection."""
    try:
        os.makedirs(DEBUG_DIR, exist_ok=True)
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        ext = (mime.split("/", 1)[-1] or "bin").split(";", 1)[0] or "bin"
        safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename)[:60] or "upload"
        base = f"{stamp}_{safe_name}"
        with open(os.path.join(DEBUG_DIR, f"{base}.{ext}"), "wb") as fh:
            fh.write(image_bytes)
        with open(os.path.join(DEBUG_DIR, f"{base}.raw.txt"), "w", encoding="utf-8") as fh:
            fh.write(
                f"vision_model={OPENROUTER_VISION_MODEL}\n"
                f"text_model={OPENROUTER_TEXT_MODEL}\n"
                f"mime={mime}\nbytes={len(image_bytes)}\n"
                f"final_rows={len(rows)}\n\n"
                f"--- STAGE 1 (vision OCR) ---\n{stage1_raw}\n\n"
                f"--- STAGE 2 (text analysis) ---\n{stage2_raw}\n\n"
                f"--- FINAL ROWS ---\n"
            )
            fh.write(json.dumps([r.model_dump() for r in rows], ensure_ascii=False, indent=2))
    except Exception:  # never let debug logging break the request
        logger.exception("Failed to persist debug dump")


def _parse_model_json(content: str) -> dict | None:
    """Try strict JSON first, fall back to extracting the first {...} block."""
    if not content:
        return None
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
