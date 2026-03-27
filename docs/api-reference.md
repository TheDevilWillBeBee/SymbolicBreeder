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
| `context_profile` | string | No | Context complexity level: `"simple"`, `"intermediate"` (default), or `"advanced"` |

**Example**

```json
{
  "modality": "shader",
  "name": "Sunday experiments",
  "provider": "openai",
  "model": "gpt-4o",
  "context_profile": "advanced"
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
| `context_profile` | string | No | Context complexity level: `"simple"`, `"intermediate"` (default), or `"advanced"` |

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

## Authentication

All auth endpoints return JWT tokens. Include the token as `Authorization: Bearer <token>` in subsequent requests that require authentication.

### `POST /api/auth/register`

Creates a new user account.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | Yes | 3-40 chars, alphanumeric + underscore/hyphen |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | 8-128 characters |

**Response `201`**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "a3f1c2d4-...",
    "username": "alice",
    "email": "alice@example.com",
    "is_verified": false,
    "created_at": "2026-03-27T10:00:00Z"
  }
}
```

**Response `409`** — username or email already taken.

---

### `POST /api/auth/login`

Authenticates with email or username + password.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `login` | string | Yes | Email address or username |
| `password` | string | Yes | Account password |

**Response `200`** — same shape as register response.

**Response `401`** — invalid credentials.

---

### `GET /api/auth/me`

Returns the current authenticated user. Requires `Authorization: Bearer <token>` header.

**Response `200`**

```json
{
  "id": "a3f1c2d4-...",
  "username": "alice",
  "email": "alice@example.com",
  "is_verified": false,
  "created_at": "2026-03-27T10:00:00Z"
}
```

**Response `401`** — missing or invalid token.

---

## Gallery

### `POST /api/gallery/share`

Shares a program to the public gallery. **Requires authentication.**

The `sharer_name` is derived from the authenticated user's username.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `program_id` | string | No | UUID of the original program |
| `code` | string | Yes | Program source code |
| `modality` | string | Yes | `"strudel"`, `"shader"`, `"openscad"`, or `"svg"` |
| `lineage` | array | No | Ancestry chain of parent programs (see `LineageProgramSchema` below) |
| `llm_model` | string | No | Model used to generate the program |

**`LineageProgramSchema`** — each entry in the `lineage` array:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | UUID of the program |
| `code` | string | Yes | Program source code |
| `generation` | int | Yes | Generation number |
| `parent_ids` | array | No | Parent program UUIDs |
| `guidance` | string | No | User guidance text used for this generation |
| `llm_model` | string | No | Provider/model used (e.g. `"anthropic/claude-sonnet-4-20250514"`) |
| `context_profile` | string | No | Context complexity level: `"simple"`, `"intermediate"`, or `"advanced"` |

**Response `200`**

```json
{
  "id": "d4e5f6a7-...",
  "program_id": "b7e2a1f9-...",
  "sharer_name": "alice",
  "sharer_user_id": "a3f1c2d4-...",
  "modality": "shader",
  "code": "void mainImage(...) { ... }",
  "lineage": [
    {
      "id": "f1a2b3c4-...",
      "code": "...",
      "generation": 0,
      "parent_ids": [],
      "guidance": null,
      "llm_model": "anthropic/claude-sonnet-4-20250514",
      "context_profile": "intermediate"
    }
  ],
  "llm_model": "claude-sonnet-4-20250514",
  "like_count": 0,
  "liked_by_me": false,
  "created_at": "2026-03-16T10:00:00Z"
}
```

**Response `401`** — not authenticated.
```

---

### `GET /api/gallery/programs`

Lists shared programs, paginated and filtered by modality. Optionally accepts an `Authorization` header to populate `liked_by_me` per item.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `modality` | string | `"shader"` | Filter by modality |
| `sort_by` | string | `"newest"` | Sort order: `"newest"` or `"most_liked"` |
| `user_id` | string | — | Filter to a specific user's shared items |
| `page` | int | `1` | Page number (1-indexed) |
| `per_page` | int | `20` | Items per page (max 100) |

When `sort_by=most_liked`, items with equal like counts are sorted newest first.

**Response `200`**

```json
{
  "items": [
    {
      "id": "...",
      "sharer_name": "alice",
      "sharer_user_id": "...",
      "modality": "shader",
      "code": "...",
      "lineage": [],
      "llm_model": "...",
      "like_count": 5,
      "liked_by_me": true,
      "created_at": "..."
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

---

### `GET /api/gallery/programs/{program_id}`

Retrieves a single shared program. Optionally accepts an `Authorization` header for `liked_by_me`.

**Response `200`** — same shape as individual items in the list response.

**Response `404`**

```json
{ "detail": "Shared program not found" }
```

---

### `POST /api/gallery/programs/{shared_program_id}/like`

Toggles a like on a shared program. **Requires a verified account.** Calling this endpoint when the user has already liked the item will unlike it.

**Response `200`**

```json
{
  "shared_program_id": "d4e5f6a7-...",
  "liked": true,
  "like_count": 6
}
```

**Response `401`** — not authenticated.
**Response `403`** — account not verified.
**Response `404`** — shared program not found.

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
