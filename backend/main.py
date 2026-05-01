"""kindee menu-scan backend.

POST /api/scan-menu  — multipart upload of a menu photo
                       returns { rows: MenuCautionRow[] }
GET  /health         — sanity check
"""
from __future__ import annotations

import base64
import json
import logging
import os
import re
from typing import Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-3-27b-it").strip()
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
ALLOWED_MIME_PREFIX = "image/"

logger = logging.getLogger("kindee.scan")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


class ServerMenuRow(BaseModel):
    thai: str
    english: str
    price: str = ""
    confidence: ConfidenceLevel
    likelyContains: list[IngredientKey] = Field(default_factory=list)
    cautionNotes: list[str] = Field(default_factory=list)
    askVendor: str = ""


class ScanResponse(BaseModel):
    rows: list[ServerMenuRow]


SYSTEM_PROMPT = (
    "You are a careful Thai street food menu analyzer helping foreign travelers "
    "with food allergies and dietary restrictions. You output STRICT JSON only — "
    "no prose, no markdown fences."
)

USER_PROMPT = f"""Analyze the photographed menu. For EACH visible menu item, return:
- thai: Thai name as printed on the menu (or your best transliteration if printed in Roman script)
- english: short English name / translation (your best guess if not printed)
- price: price string as printed (e.g. "60 THB", "60-80฿"), or "" if unknown
- confidence: one of "Low", "Medium", "High" — how sure you are this menu item exists in the image
- likelyContains: array of ingredient keys, ONLY from this allowed list:
  {ALLOWED_INGREDIENTS}
  Pick keys that are likely present in a typical Thai street version of the dish.
- cautionNotes: 1-3 short English notes about hidden ingredients or cross-contact risks
- askVendor: ONE short English sentence the traveler can ask the vendor

Return JSON in EXACTLY this shape, no extra keys, no commentary:
{{ "rows": [ {{ "thai": "...", "english": "...", "price": "...", "confidence": "...",
              "likelyContains": [...], "cautionNotes": [...], "askVendor": "..." }} ] }}

Rules:
- If the image is not a menu (selfie, landscape, blurry text, etc.), return {{ "rows": [] }}.
- Up to 12 items max. Skip items you cannot read clearly.
- Never invent ingredient keys outside the allowed list.
"""


app = FastAPI(title="kindee menu scan", version="0.1.0")

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
        "model": OPENROUTER_MODEL,
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

    data_url = f"data:{file.content_type};base64,{base64.b64encode(raw).decode('ascii')}"

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": USER_PROMPT},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "kindee menu scan",
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
            resp = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
    except httpx.HTTPError as exc:
        logger.exception("OpenRouter request failed")
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {exc}") from exc

    if resp.status_code >= 400:
        logger.error("OpenRouter returned %s: %s", resp.status_code, resp.text[:500])
        raise HTTPException(
            status_code=502,
            detail=f"OpenRouter error {resp.status_code}: {resp.text[:200]}",
        )

    body = resp.json()
    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        logger.error("Unexpected OpenRouter response shape: %s", body)
        raise HTTPException(status_code=502, detail="Unexpected response from model.") from exc

    parsed = _parse_model_json(content)
    if parsed is None:
        logger.warning("Could not parse model JSON: %s", content[:500])
        return ScanResponse(rows=[])

    try:
        return ScanResponse(rows=parsed.get("rows", []))
    except ValidationError:
        logger.exception("Model returned JSON that failed validation: %s", parsed)
        # Best-effort: keep only rows that individually validate
        salvaged: list[ServerMenuRow] = []
        for row in parsed.get("rows", []) or []:
            try:
                salvaged.append(ServerMenuRow.model_validate(row))
            except ValidationError:
                continue
        return ScanResponse(rows=salvaged)


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
