# kindee — Function Reference

Comprehensive reference of every function and React component used in the
project, with parameters and return values.

- [Backend (`backend/main.py`)](#backend-backendmainpy)
  - Pydantic models
  - HTTP endpoints
  - Pipeline helpers
  - Internal utilities
- [Frontend (`app/page.tsx`)](#frontend-apppagetsx)
  - i18n helpers
  - Risk / scoring
  - Phrase generators
  - Menu-row enrichment
  - React components
- [Frontend types](#frontend-types)

---

## Backend (`backend/main.py`)

FastAPI service that takes a menu photo and runs a 2-stage agent pipeline:
**Stage 1** (vision OCR) extracts every visible menu item; **Stage 2** (text-only)
analyzes each item for allergens / cautions. The frontend gets a flat list of
`ServerMenuRow` ready to render.

### Pydantic models

| Model | Fields | Used by |
|---|---|---|
| `ExtractedItem` | `thai: str`, `proteinOptions: list[str] = []`, `price: str = ""` | stage 1 output |
| `ExtractResponse` | `items: list[ExtractedItem]` | stage 1 LLM JSON shape |
| `AnalyzedItem` | `english: str`, `confidence: "Low" \| "Medium" \| "High" = "Medium"`, `likelyContains: list[IngredientKey] = []`, `cautionNotes: list[str] = []`, `askVendor: str = ""` | stage 2 output |
| `AnalyzeResponse` | `analyses: list[AnalyzedItem]` | stage 2 LLM JSON shape |
| `ServerMenuRow` | `thai`, `english`, `price`, `confidence`, `likelyContains`, `cautionNotes`, `askVendor` | response sent to frontend |
| `ScanResponse` | `rows: list[ServerMenuRow]` | `POST /api/scan-menu` envelope |

`IngredientKey` is the closed enum of allowed keys: `fishSauce, shrimpPaste, peanuts, egg, oysterSauce, driedShrimp, boneBroth, soySauce, wheatNoodles, pork, coconutMilk, sesameSeeds`.

### HTTP endpoints

#### `GET /health`

```python
async def health() -> dict
```

**Returns:** `{ ok, vision_model, text_model, openrouter_configured }`. Used to
verify the service is running and an OpenRouter key is loaded.

#### `POST /api/scan-menu`

```python
async def scan_menu(
    file: UploadFile = File(...),
    language: str = Form(DEFAULT_LANG),  # "EN" | "TH" | "JP" | "CN" | "KR" | "AR"
) -> ScanResponse
```

**Parameters**

| Name | Type | Source | Notes |
|---|---|---|---|
| `file` | `UploadFile` | multipart `file=` | Image only (`image/*`); max 8 MB. |
| `language` | `str` | multipart `language=` | Lang code; controls the language of `english`, `cautionNotes`, `askVendor`. Default `"EN"`. |

**Returns:** `ScanResponse { rows: [...] }`.

**Errors**

| Status | When |
|---|---|
| 400 | Empty file. |
| 413 | File > `MAX_UPLOAD_BYTES` (8 MB). |
| 415 | Content type not `image/*`. |
| 502 | OpenRouter error or unparseable response. |
| 503 | `OPENROUTER_API_KEY` is missing. |

### Pipeline helpers

#### `stage1_extract(image_bytes, mime)`

```python
async def stage1_extract(
    image_bytes: bytes,
    mime: str,
) -> tuple[list[ExtractedItem], str]
```

**Parameters**

- `image_bytes` — raw image bytes from the upload.
- `mime` — MIME string (`"image/jpeg"` etc.) used to build a base64 data URL.

**Returns:** `(items, raw)` — list of validated `ExtractedItem`s (capped at
`MAX_EXTRACTED_ITEMS = 40`) and the raw model content for debugging.

**What it does:** sends one multimodal call to `OPENROUTER_VISION_MODEL` with
`STAGE1_SYSTEM` + `STAGE1_USER` + the image, then parses the JSON. Items with
empty `thai` are dropped.

#### `stage2_analyze(items, language)`

```python
async def stage2_analyze(
    items: list[ExtractedItem],
    language: str,
) -> tuple[list[AnalyzedItem], str]
```

**Parameters**

- `items` — output of stage 1.
- `language` — target language for `english`, `cautionNotes`, `askVendor`.

**Returns:** `(analyses, raw)` — list of `AnalyzedItem` (length always equals
`len(items)`; missing analyses are padded with placeholders).

**What it does:** one text-only call to `OPENROUTER_TEXT_MODEL` with the dish
list as input. No image is sent.

#### `merge_to_rows(items, analyses, language)`

```python
def merge_to_rows(
    items: list[ExtractedItem],
    analyses: list[AnalyzedItem],
    language: str,
) -> list[ServerMenuRow]
```

**Parameters**

- `items` — stage 1 output.
- `analyses` — stage 2 output (same length as `items`).
- `language` — used to pick a localized fallback `askVendor` string.

**Returns:** list of `ServerMenuRow`. Stage 1's `proteinOptions` is prepended
into `cautionNotes[0]` as `"Protein options: beef / pork / ..."` so the
frontend can extract it (the protein-options names themselves are kept in
English so the parser is stable across languages).

#### `build_stage2_user_prompt(items, language)`

```python
def build_stage2_user_prompt(items: list[ExtractedItem], language: str) -> str
```

Builds the user prompt for stage 2. Lists every dish numerically and instructs
the model to write `english` / `cautionNotes` / `askVendor` in `language`.

### Internal utilities

#### `_call_openrouter(model, messages, timeout=60.0)`

```python
async def _call_openrouter(
    *,
    model: str,
    messages: list[dict],
    timeout: float = 60.0,
) -> str
```

OpenAI-compatible call to `OPENROUTER_BASE_URL/chat/completions` with
`response_format: {"type": "json_object"}` and `temperature: 0.0`. Returns the
raw `message.content` string. Raises `HTTPException(503)` if the API key is
missing or `502` on OpenRouter / shape errors.

#### `_persist_debug_dump(filename, image_bytes, mime, stage1_raw, stage2_raw, rows)`

Saves the uploaded image and a `.raw.txt` next to it under `backend/debug/`
with both stage outputs and the final rows JSON. Never raises — failures are
swallowed and logged. The folder is gitignored.

#### `_parse_model_json(content)`

```python
def _parse_model_json(content: str) -> dict | None
```

Safe JSON parser. Tries `json.loads` directly, then falls back to extracting
the first `{...}` block via regex. Returns `None` if neither works.

### Module constants

| Constant | Default | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | `""` (env) | Required; service refuses to scan without it. |
| `OPENROUTER_MODEL` | `google/gemma-3-27b-it` (env) | Default model used when the more specific vars are unset. |
| `OPENROUTER_VISION_MODEL` | `OPENROUTER_MODEL` (env) | Stage 1 model. |
| `OPENROUTER_TEXT_MODEL` | `OPENROUTER_MODEL` (env) | Stage 2 model. |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` (env) | |
| `CORS_ORIGINS` | `http://localhost:3000` (env) | Comma-separated. |
| `LANG_NAMES` | EN/TH/JP/CN/KR/AR | Maps short codes to full names for the prompt. |
| `FALLBACK_ASK_VENDOR` | per-language string dict | Used when the LLM omits `askVendor`. |
| `MAX_UPLOAD_BYTES` | `8 * 1024 * 1024` | Hard upload cap. |
| `MAX_EXTRACTED_ITEMS` | `40` | Stage 1 trims past this. |

---

## Frontend (`app/page.tsx`)

Single-file Next.js client. All helpers and components live in this file. The
top-level `App()` component owns app-wide state (profile, screen, scan rows,
vendor question index) and threads it down via props.

### i18n helpers

#### `tx(lang, key)`

```ts
function tx(lang: Lang, key: CopyKey): string
```

Reads `copy[lang][key]`, falls back to `copy.EN[key]`, finally to the key
string itself. **Always use this** for new strings — adding a key only to
EN/TH/JP/CN still works for KR/AR thanks to the EN fallback.

#### `allergenLabel(allergen, lang)`

```ts
function allergenLabel(allergen: Allergen, lang: Lang): string
```

Returns the localized label for an allergen (e.g. `"Peanut"` / `"ถั่วลิสง"` /
`"ピーナッツ"` / `"花生"`). Falls back to EN.

#### `dietLabel(diet, lang)`

```ts
function dietLabel(diet: Diet, lang: Lang): string
```

Same as above but for diets (`"Vegan"`, `"ฮาลาล"`, etc.).

#### `labelForFlag(flag, lang="EN")`

```ts
function labelForFlag(flag: string, lang: Lang = "EN"): string
```

Generic — accepts either an allergen or a diet flag string and returns its
localized label. Used inside risk reasons because reasons mix the two.

### Risk / scoring

#### `scoreDish(dish, profile)`

```ts
function scoreDish(dish: Dish, profile: Profile): AnalysisResult
```

Used in canonical-dish flow (`analyzeDish`). Computes risk by intersecting
`dish.commonlyContains[].flags` with the profile's allergens/diets.
Auto-escalates to High when ≥2 matches OR any of `peanut`/`shellfish`/`fish`
is hit. Returns `{ dish, risk, riskReasons, confidence }`.

#### `scoreMenuRow(row, profile, lang="EN")`

```ts
function scoreMenuRow(
  row: MenuCautionRow,
  profile: Profile,
  lang: Lang = "EN",
): {
  risk: Risk;
  reasons: string[];
  allergenMatches: { flag: Allergen; ingredient: string }[];
  dietMatches: { flag: Diet; ingredient: string }[];
}
```

The scan-result variant. Splits matches into allergen vs diet buckets so the
caller can render them with different colors. Severity tier:

- Severe allergen (`peanut`, `shellfish`, `fish`, `treeNuts`) **or** ≥2 allergens → **High**
- 1 mild allergen → **Medium**
- Diet conflict only → **Medium**
- Has caution notes → **Medium**
- Otherwise → **Low**

`reasons` are localized via `REASON_TEMPLATES[lang]`.

### Dish lookup

#### `findDish(query)`

```ts
function findDish(query: string): Dish
```

Lenient substring search across `english/thai/romanized/category`. **Falls
back to `dishes[0]`** (Pad Thai) when nothing matches — kept for the typed /
voice search input where some result is better than no result.

#### `findDishStrict(query)`

```ts
function findDishStrict(query: string): Dish | undefined
```

Strict bidirectional substring match — the query embeds a canonical field, or
vice versa. Returns `undefined` when there's no real match. Used by
`enrichScanRow` so an unknown scanned dish doesn't masquerade as Pad Thai.

### Phrase generators

#### `buildThaiPhrase(profile, dish)`

```ts
function buildThaiPhrase(profile: Profile, dish: Dish): string
```

Builds the Thai phrase for the **vendor** (always Thai regardless of user
language). Multi-line, with bullet lists:

```
สวัสดีค่ะ 🙏

ฉันแพ้:
• ถั่วลิสง
• กุ้ง ปู หอย

ฉันทาน: ฮาลาล

เมนู ผัดกะเพรา มีส่วนผสมเหล่านี้ไหมคะ?
• น้ำมันหอย
• น้ำปลา

และใช้อุปกรณ์/กระทะ/น้ำมันร่วมกับเมนูที่มีส่วนผสมเหล่านี้ไหมคะ?
```

#### `romanizePhrase(profile, dish, lang="EN")`

```ts
function romanizePhrase(profile: Profile, dish: Dish, lang: Lang = "EN"): string
```

Mirrors `buildThaiPhrase` but in the **user's** language using
`PHRASE_LABELS[lang]`. Used as the gloss under the Thai phrase so the user can
verify what they're handing to the vendor.

#### `buildProteinHint(proteinOptions, profile, lang="EN")`

```ts
function buildProteinHint(
  proteinOptions: string[] | undefined,
  profile: Profile,
  lang: Lang = "EN",
): { safe: string[]; avoid: string[]; note: string } | undefined
```

Given a dish's protein options (e.g. `["beef","pork","chicken","fish"]`), splits
them into `safe` and `avoid` based on the profile, then builds a localized note
("Choose chicken or beef. Avoid pork & fish."). Returns `undefined` when every
option is safe — nothing to highlight.

#### `proteinLabel(key, lang)`

```ts
function proteinLabel(key: string, lang: Lang): string
```

Localized noun for a protein key (`pork → หมู / 豚肉 / 猪肉`).

### Menu-row enrichment

#### `mapServerRow(row, index)`

```ts
function mapServerRow(row: ServerMenuRow, index: number): MenuCautionRow | null
```

Server → frontend shape conversion. Maps the closed-set ingredient keys to
`Ingredient` objects from `ingredientBank`, parses the
`"Protein options: a / b / c"` prefix back out of `cautionNotes[0]` into a
structured `proteinOptions: string[]` field, and assigns a stable id.

Returns `null` when the row has neither `thai` nor `english`.

#### `slugify(value)`

```ts
function slugify(value: string): string
```

Lowercase + non-alphanumeric → `-`, trimmed and capped at 32 chars. Used to
generate row ids.

#### `syntheticDishFromRow(row)`

```ts
function syntheticDishFromRow(row: MenuCautionRow): Dish
```

Wraps a `MenuCautionRow` in a `Dish`-shaped object so existing `Dish`-only
helpers (`buildThaiPhrase`, `romanizePhrase`, `scoreDish`) work without
special-casing. Used as the fallback when `findDishStrict` doesn't match.

#### `enrichScanRow(row, profile)`

```ts
function enrichScanRow(row: MenuCautionRow, profile: Profile): EnrichedScanRow
```

Pure transformer that does everything `MenuCautionTable` needs to render one
row: scores risk, computes protein hint, finds a matched canonical dish,
generates Thai + user-language ask-vendor strings, and flags `uncertain` when
confidence is Low.

#### `sortEnrichedRows(rows)`

```ts
function sortEnrichedRows(rows: EnrichedScanRow[]): EnrichedScanRow[]
```

Stable sort by `RISK_ORDER` so High shows first.

### React components

| Component | Key props | What it renders |
|---|---|---|
| `App()` | none | Root. Owns `profile`, `screen`, `result`, `vendorQuestionIndex`. Handles speech recognition + TTS. |
| `HomeScreen({ profile, mode, setMode, query, setQuery, listening, startVoice, analyzeDish, analyzeText, suggestions, profileName, profileLoadState, setProfile })` | many | Scan hub: profile editor card + tabbed Menu / Type panes + popular-dish list. |
| `ResultScreen({ profile, result, t, onOpenPhrase, onSpeak })` | `result: AnalysisResult` | Per-dish risk page: badge + ingredient cards + hidden asks + cross-contact + phrase-card / audio buttons. |
| `PhraseScreen({ dish, phrase, profile, romanizedPhrase, speakThai, t, vendorQuestionIndex, setVendorQuestionIndex })` | `dish: Dish`, `phrase: string` | Vendor-facing card. Header makes `dish.thai` the dominant title. Body has Avoid / May-contain blocks + cross-contact ask + Play audio + Vendor reply tracker. |
| `MenuCautionTable({ analyzeDish, profile, rows })` | `rows: MenuCautionRow[]` | Sorted table of enriched rows; summary badges + ingredient chips colored by hit type + protein hint + Thai phrase per row. |
| `MenuCautionTableRow({ row, lang, onReview })` | `row: EnrichedScanRow` | One table row. |
| `VendorAnswer({ icon, label, sub, tone, onClick })` | `tone: "yes" \| "no"` | Big green ✓ or red ✗ button used in the vendor reply tracker. |
| `AppChip({ active, onClick, children, className? })` | toggle chip | Profile chip. |
| `SectionTitle({ eyebrow, title })` | display | Small uppercase eyebrow + bold title. |
| `InfoBlock({ title, children })` | display | Section wrapper used inside ResultScreen. |

### Module constants & maps (worth knowing)

| Name | Shape | Notes |
|---|---|---|
| `copy` | `Record<Lang, Record<CopyKey, string>>` | Master i18n dict. EN is source of truth; KR/AR may be partial — `tx()` falls back. |
| `allergenLabels` | `Record<Allergen, { icon, labels: Partial<Record<Lang, string>> }>` | Multi-lang allergen names. |
| `dietLabels` | same shape | Multi-lang diet names. |
| `ingredientBank` | `Record<string, { key, label, icon, flags }>` | Source of truth for ingredient → allergen/diet flag mapping. |
| `dishes` | `Dish[]` | Canonical dish DB used by the typed/voice flow and by `findDishStrict`. |
| `INGREDIENT_TH` | `Record<string,string>` | English ingredient label → Thai (used in Thai phrase). |
| `PHRASE_LABELS` | `Record<Lang, {...}>` | Per-lang glosses for the romanized phrase. |
| `PROTEIN_FLAGS` | `Record<string, Array<Allergen \| Diet>>` | Which allergens/diets each protein conflicts with. |
| `PROTEIN_LABELS_I18N` | `Record<string, Record<Lang, string>>` | Multi-lang protein names. |
| `REASON_TEMPLATES` | `Record<Lang, { conflict, fallback }>` | Risk-reason sentences per language. |
| `RISK_STYLE` / `riskStyles` / `riskIcon` | per-Risk maps | UI styling for risk badges. |
| `SEVERE_ALLERGENS` | `Allergen[]` | Single-match auto-High triggers (`peanut, shellfish, fish, treeNuts`). |
| `RISK_ORDER` | `Record<Risk, number>` | Sort order: High=0, Medium=1, Unknown=2, Low=3. |
| `VENDOR_QUESTIONS` | `{ thai, en }[]` | Hardcoded questions cycled through in the vendor reply tracker. |

---

## Frontend types

| Type | Definition |
|---|---|
| `Allergen` | `"peanut" \| "treeNuts" \| "shellfish" \| "fish" \| "egg" \| "soy" \| "milk" \| "gluten" \| "sesame"` |
| `Diet` | `"vegan" \| "vegetarian" \| "halal" \| "glutenFree"` |
| `Risk` | `"Low" \| "Medium" \| "High" \| "Unknown"` |
| `Confidence` | `"Low" \| "Medium" \| "High"` |
| `Mode` | `"photo" \| "voice" \| "type"` (voice no longer used in UI) |
| `Screen` | `"home" \| "result" \| "phrase"` |
| `Lang` | `"EN" \| "TH" \| "JP" \| "CN" \| "KR" \| "AR"` |
| `Profile` | `{ allergens: Allergen[]; diets: Diet[]; highContrast: boolean; language: Lang }` |
| `Ingredient` | `{ key: string; label: string; icon: string; flags: Array<Allergen \| Diet> }` |
| `Dish` | `{ id, thai, english, romanized, category, baseRisk, confidence, commonlyContains, hiddenAsks, crossContact, saferAlternativeIds }` |
| `MenuCautionRow` | scan-result row (see `mapServerRow`) — `{ id, thai, english, price, confidence, likelyContains, cautionNotes, askVendor, matchedDishId?, proteinOptions? }` |
| `EnrichedScanRow` | `MenuCautionRow & { risk, uncertain, allergenMatches, dietMatches, proteinHint?, matchedDish?, askVendorTH, askVendorUserLang }` |
| `AnalysisResult` | `{ dish, risk, riskReasons, confidence }` (output of `scoreDish`) |
| `ProteinHint` | `{ safe: string[]; avoid: string[]; note: string }` |
| `ServerMenuRow` | mirrors backend's pydantic `ServerMenuRow` |
