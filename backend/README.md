# kindee menu-scan backend

FastAPI service that takes a menu photo and returns structured caution rows
by calling Google Gemma 3 27B (vision) via OpenRouter.

## Setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# edit .env and paste your OPENROUTER_API_KEY
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

- Swagger docs: http://localhost:8000/docs
- Health:       http://localhost:8000/health

## Endpoints

### `POST /api/scan-menu`
multipart/form-data, field `file` = an image (JPEG/PNG/WebP), max 8 MB.

Response:
```json
{
  "rows": [
    {
      "thai": "ผัดกะเพราหมู",
      "english": "Pork holy basil stir-fry",
      "price": "60 THB",
      "confidence": "High",
      "likelyContains": ["oysterSauce", "fishSauce", "soySauce", "egg", "pork"],
      "cautionNotes": ["Oyster sauce contains shellfish", "Often topped with a fried egg"],
      "askVendor": "Can you make it without oyster sauce and fish sauce?"
    }
  ]
}
```

`likelyContains` keys are constrained to the canonical ingredient list shared
with the frontend's `ingredientBank` so the UI can render badges/icons.

### `GET /health`
Returns `{ ok, model, openrouter_configured }`.

## Notes
- POC only: no auth, no rate limiting, no caching.
- Browser hits this server directly — CORS is opened for `CORS_ORIGINS`
  (default `http://localhost:3000`).
