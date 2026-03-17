# API Reference

Base URL: `http://localhost:8000` (development)

All endpoints are prefixed with `/api`. The backend accepts and returns JSON.

---

## Health

### `GET /api/health`

Confirms the server is running.

**Response**

```json
{ "status": "ok" }
```

---

## Sessions

### `POST /api/sessions`

Creates a new breeding session and immediately seeds generation 0 via the LLM (or mock if no API key is configured).

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `modality` | string | Yes | `"strudel"` or `"shader"` |
| `name` | string | No | Human-readable label for the session |
| `prompt` | string | No | Optional seed guidance passed to the LLM |
| `provider` | string | No | LLM provider key (default: `"anthropic"`) |
| `model` | string | No | Model identifier (default: `"claude-sonnet-4-20250514"`) |
| `base_url` | string | No | Custom API base URL override |

**Example**

```json
{
  "modality": "shader",
  "name": "Sunday experiments",
  "provider": "openai",
  "model": "gpt-4o"
}
```

**Response `200`**

```json
{
  "session": {
    "id": "a3f1c2d4-...",
    "name": "Sunday experiments",
    "modality": "shader",
    "createdAt": "2026-03-10T12:00:00Z"
  },
  "programs": [
    {
      "id": "b7e2a1f9-...",
      "code": "void mainImage(...) { ... }",
      "modality": "shader",
      "generation": 0,
      "parentIds": [],
      "sessionId": "a3f1c2d4-...",
      "createdAt": "2026-03-10T12:00:01Z"
    }
    // ... typically 6 programs
  ]
}
```

---

### `GET /api/sessions/{session_id}`

Retrieves a session and all its programs.

**Path parameter**

| Parameter | Description |
|---|---|
| `session_id` | UUID of the session |

**Response `200`**

```json
{
  "session": {
    "id": "a3f1c2d4-...",
    "name": "Sunday experiments",
    "modality": "shader",
    "createdAt": "2026-03-10T12:00:00Z"
  },
  "programs": [ /* all programs across all generations */ ]
}
```

**Response `404`**

```json
{ "detail": "Session not found" }
```

---

## Programs

### `GET /api/programs/{program_id}`

Retrieves a single program by ID.

**Path parameter**

| Parameter | Description |
|---|---|
| `program_id` | UUID of the program |

**Response `200`**

```json
{
  "id": "b7e2a1f9-...",
  "code": "void mainImage(...) { ... }",
  "modality": "shader",
  "generation": 1,
  "parentIds": ["a1b2c3d4-...", "e5f6a7b8-..."],
  "sessionId": "a3f1c2d4-...",
  "createdAt": "2026-03-10T12:05:00Z"
}
```

**Response `404`**

```json
{ "detail": "Program not found" }
```

---

## Evolution

### `POST /api/evolve`

Generates a new generation of programs by mutating/crossing the provided parents.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `modality` | string | Yes | `"strudel"` or `"shader"` |
| `parents` | array | Yes | Selected parent programs (at least one) |
| `parents[].id` | string | Yes | UUID of the parent program |
| `parents[].code` | string | Yes | Source code of the parent (may include user edits) |
| `guidance` | string | No | Free-text hint to shape the evolution direction |
| `population_size` | int | No | Number of programs to generate (default: 6) |
| `session_id` | string | No | Session UUID — used to associate the new programs |
| `provider` | string | No | LLM provider key (default: `"anthropic"`) |
| `model` | string | No | Model identifier (default: `"claude-sonnet-4-20250514"`) |

**Example**

```json
{
  "modality": "strudel",
  "parents": [
    {
      "id": "b7e2a1f9-...",
      "code": "s(\"bd sd:1 [bd bd] sd:2\")"
    }
  ],
  "guidance": "add more hi-hats and make it faster",
  "session_id": "a3f1c2d4-..."
}
```

**Response `200`**

```json
{
  "programs": [
    {
      "id": "c9d3e7f1-...",
      "code": "s(\"bd [hh hh] sd [hh*4]\").fast(1.5)",
      "modality": "strudel",
      "generation": 1,
      "parentIds": ["b7e2a1f9-..."],
      "sessionId": "a3f1c2d4-...",
      "createdAt": "2026-03-10T12:05:00Z"
    }
    // ... typically 6 programs
  ],
  "generation": 1
}
```

**Response `422`** — validation error (e.g. empty parents list)

```json
{
  "detail": [
    { "loc": ["body", "parents"], "msg": "ensure this value has at least 1 items", "type": "value_error.list.min_items" }
  ]
}
```

---

## Providers

### `GET /api/providers`

Returns available LLM providers, their supported models, and whether the server has any API keys configured.

**Response `200`**

```json
{
  "server_key_available": true,
  "providers": [
    {
      "key": "anthropic",
      "label": "Anthropic",
      "models": ["claude-opus-4-1", "claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"]
    },
    {
      "key": "openai",
      "label": "OpenAI",
      "models": ["gpt-4o", "gpt-4o-mini", "o3-mini"]
    },
    {
      "key": "gemini",
      "label": "Google Gemini",
      "models": ["gemini-2.5-pro", "gemini-2.5-flash"]
    },
    {
      "key": "qwen",
      "label": "Qwen",
      "models": ["qwen-max", "qwen-plus"]
    }
  ]
}
```

---

## Gallery

### `POST /api/gallery/share`

Shares a program to the public gallery.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `program_id` | string | No | UUID of the original program |
| `sharer_name` | string | Yes | Display name of the sharer |
| `code` | string | Yes | Program source code |
| `modality` | string | Yes | `"strudel"` or `"shader"` |
| `lineage` | array | No | Ancestry chain of parent programs |
| `llm_model` | string | No | Model used to generate the program |

**Response `200`**

```json
{
  "id": "d4e5f6a7-...",
  "program_id": "b7e2a1f9-...",
  "sharer_name": "Alice",
  "modality": "shader",
  "code": "void mainImage(...) { ... }",
  "lineage": [],
  "llm_model": "claude-sonnet-4-20250514",
  "created_at": "2026-03-16T10:00:00Z"
}
```

---

### `GET /api/gallery/programs`

Lists shared programs, paginated and filtered by modality.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `modality` | string | `"shader"` | Filter by modality |
| `page` | int | `1` | Page number (1-indexed) |
| `per_page` | int | `20` | Items per page (max 100) |

**Response `200`**

```json
{
  "items": [ /* SharedProgram objects */ ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

---

### `GET /api/gallery/programs/{program_id}`

Retrieves a single shared program.

**Response `200`** — same shape as the `POST /api/gallery/share` response.

**Response `404`**

```json
{ "detail": "Shared program not found" }
```

---

## Error Format

Validation errors follow FastAPI's default format (Pydantic). Logical errors (not found, etc.) return:

```json
{ "detail": "<message>" }
```

---

## Mock Mode

If no LLM API keys are configured (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `DASHSCOPE_API_KEY`), the evolve and session endpoints return programs sampled from a built-in mock pool. The request/response shapes are identical.

---

## Notes for Frontend Integration

- The frontend Vite dev server proxies all `/api` requests to `http://localhost:8000` — no CORS headers are needed during local development.
- The `parents[].code` field in the evolve request should always contain the **current code** for each parent. If the user has customized a program via `CustomizeModal`, send the customized code, not the original. The `customizedPrograms` map in the Zustand store tracks these overrides.
- `population_size` defaults to 6 on the backend. Pass a different value only if you want the grid to have a different fixed size.
