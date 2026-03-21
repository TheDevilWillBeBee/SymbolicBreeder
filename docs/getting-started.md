# Getting Started

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build tooling |
| npm | 9+ | Bundled with Node |
| PostgreSQL | 15+ | Required for backend state |
| LLM API key | — | Optional — mock mode works without one |

---

## Installation

Clone the repository and set up both the backend and frontend.

### 1. Clone

```bash
git clone <repository-url>
cd SymbolicBreeder
```

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install the package and its dependencies
pip install -e .
```

Dependencies installed:

| Package | Purpose |
|---|---|
| `alembic` | Database migrations |
| `fastapi` | HTTP framework |
| `uvicorn[standard]` | ASGI server |
| `sqlalchemy` | ORM |
| `psycopg[binary]` | PostgreSQL driver |
| `pydantic` | Request/response validation |
| `anthropic` | Anthropic SDK |
| `openai` | OpenAI SDK |
| `google-genai` | Google Gemini SDK |
| `dashscope` | Qwen (Alibaba) SDK |
| `pyyaml` | Context manifest parsing |

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

---

## Environment Variables

### Backend

Create a `.env` file in `backend/` or export variables in your shell before starting the server.

```bash
# backend/.env  (or export in shell)
DATABASE_URL=postgresql+psycopg://user:password@host:5432/symbolic_breeder

# LLM provider keys (all optional — omit all for mock mode)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
DASHSCOPE_API_KEY=sk-...

LLM_MODEL=claude-sonnet-4-20250514    # Default model
CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

| Variable | Default | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | — | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | — | No | Anthropic API key |
| `OPENAI_API_KEY` | — | No | OpenAI API key |
| `GOOGLE_API_KEY` | — | No | Google Gemini API key |
| `DASHSCOPE_API_KEY` | — | No | Qwen API key (Alibaba) |
| `LLM_MODEL` | `claude-sonnet-4-20250514` | No | Default model identifier |
| `CORS_ALLOW_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | No | Comma-separated CORS origins |

> **Mock mode**: if no LLM API keys are set, every LLM call returns pre-written programs from the built-in mock pool. The full UI flow works — seeding, evolving, customizing — just without real AI output. This is useful for offline development and demos.

### Frontend

```bash
# frontend/.env.local  (optional)
VITE_API_URL=    # Leave empty to use the Vite proxy (default, recommended for dev)
                 # Set to http://localhost:8000 if running without the proxy
```

---

## Running in Development

Open two terminals.

**Terminal 1 — Backend**

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Server starts at `http://localhost:8000`. `--reload` restarts automatically on file changes.

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

Dev server starts at `http://localhost:3000`. All `/api/*` requests are proxied to `http://localhost:8000` by Vite's dev server configuration in `vite.config.ts`.

Open `http://localhost:3000` in your browser.

---

## Verifying the Setup

### Backend health check

```bash
curl http://localhost:8000/api/health
# → {"status": "ok"}
```

### API smoke test (seed a shader session)

```bash
curl -s -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"modality": "shader", "name": "test"}' | python -m json.tool
```

You should see a JSON response with a `session` object and a `programs` array containing six shader programs.

You can also test the OpenSCAD modality:

```bash
curl -s -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"modality": "openscad", "name": "test-3d"}' | python -m json.tool
```

---

## Local Testing Checklist

Run these in order to validate local behavior end-to-end:

1. Start backend (`uvicorn app.main:app --reload --port 8000`)
2. Start frontend (`npm run dev` in `frontend/`)
3. Health check: `curl http://localhost:8000/api/health`
4. Session creation smoke test:

```bash
curl -s -X POST http://localhost:8000/api/sessions \
    -H "Content-Type: application/json" \
    -d '{"modality":"shader","name":"local-smoke"}'
```

5. Open the app (`http://localhost:3000`) and verify:
   - create a session
   - evolve at least one generation
   - no backend errors in terminal

---

## Deploying on Vercel

This repository is configured for single-platform deployment on Vercel:
- `frontend/` builds to static assets (`frontend/dist`)
- `api/[...path].py` exposes the FastAPI backend as a Vercel Python function
- `vercel.json` wires `/api/*` requests to the Python function and everything else to the SPA

### 1. Vercel CLI

Use either `npx` (no global install) or a global install.

`npx` approach:

```bash
npx vercel@latest login
npx vercel@latest link
```

Global install approach:

```bash
npm install -g vercel
vercel login
vercel link
```

### 2. Environment Variables (Production)

Set these in Vercel Project Settings (Neon integration usually injects Postgres vars automatically):

| Variable | Notes |
|---|---|
| `DATABASE_URL` and/or `POSTGRES_*` | Required — database connection |
| `CORS_ALLOW_ORIGINS` | Comma-separated production origins |
| `ANTHROPIC_API_KEY` | Optional — Anthropic provider |
| `OPENAI_API_KEY` | Optional — OpenAI provider |
| `GOOGLE_API_KEY` | Optional — Google Gemini provider |
| `DASHSCOPE_API_KEY` | Optional — Qwen provider |

### 3. Initialize Database Schema (required)

The app uses Alembic migrations. Tables are not auto-created at runtime.

Pull production env vars locally:

```bash
npx vercel@latest env pull .env.vercel --environment=production
```

Run migrations against production DB:

```bash
cd backend
set -a
source ../.env.vercel
set +a
export DATABASE_URL="${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}"
alembic upgrade head
alembic current
```

### 4. Deploy

Deploy from Vercel dashboard or CLI:

```bash
npx vercel@latest --prod
```

---

## Vercel Testing Checklist

After deployment:

1. Health endpoint:

```bash
curl https://<your-vercel-domain>/api/health
```

2. Session API:

```bash
curl -s -X POST https://<your-vercel-domain>/api/sessions \
    -H "Content-Type: application/json" \
    -d '{"modality":"shader","name":"prod-smoke"}'
```

3. Frontend flow:
   - open deployed app
   - set provider/model/API key as needed
   - create session and evolve one generation

If you get `relation "sessions" does not exist`, migrations have not been applied to the production database yet.

---

## Database

PostgreSQL is required in all environments. SQLite fallback has been removed.

Schema changes are managed via Alembic migrations:

```bash
cd backend
alembic upgrade head
```

To create a new migration after model changes:

```bash
cd backend
alembic revision --autogenerate -m "describe_change"
```

See [database-management.md](database-management.md) for more details.

---

## Development Tips

### Running backend tests

```bash
cd backend
pip install -e ".[dev]"
pytest
```

### Type checking the frontend

```bash
cd frontend
npx tsc --noEmit
```

### Context profiles

The LLM context system uses three complexity levels: **simple**, **intermediate** (default), and **advanced**. Users select this in the LLM settings panel. Each level inherits from the previous one — advanced includes all intermediate and simple content.

To estimate token usage per profile, run:

```bash
python backend/scripts/estimate_tokens.py
```

Context files and prompts are in `backend/context/<modality>/`. Edit the `.md` files to change what the LLM knows. Prompts are in `prompts/prompt_bundle.yaml` — they stay fixed across profiles.

### Adding a new modality

See [modality-plugin-guide.md](modality-plugin-guide.md) for the full walkthrough. The short version:

1. Create `backend/context/<modality_key>/manifest.yaml` (v2 format) and populate `.md` files + `prompts/prompt_bundle.yaml`
2. Implement `ModalityPlugin` in `frontend/src/modalities/<key>/index.ts`
3. Register it in `frontend/src/modalityRegistry.ts`

No changes to backend Python logic or existing frontend components are required.
