# Getting Started

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build tooling |
| npm | 9+ | Bundled with Node |
| PostgreSQL | 15+ | Required for backend state |
| Anthropic API key | — | Optional — mock mode works without one |

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
| `anthropic` | Anthropic Python SDK |
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
ANTHROPIC_API_KEY=sk-ant-...          # Optional — omit for mock mode
LLM_MODEL=claude-sonnet-4-20250514    # Default shown
DATABASE_URL=postgresql+psycopg://user:password@host:5432/symbolic_breeder
CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

> **Mock mode**: if `ANTHROPIC_API_KEY` is absent or empty, every LLM call returns pre-written programs from the built-in mock pool. The full UI flow works — seeding, evolving, customizing — just without real AI output. This is useful for offline development and demos.

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

---

## Deploying on Vercel

This repository is configured for single-platform deployment on Vercel:
- `frontend/` builds to static assets
- `api/[...path].py` exposes the FastAPI backend as a Vercel Python function
- `vercel.json` wires `/api/*` requests to the Python function

### Required Vercel Environment Variables

- `DATABASE_URL` (or Vercel-provided `POSTGRES_*` variables)
- `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` (optional, for server-side key mode)
- `CORS_ALLOW_ORIGINS` (comma-separated production origins)

### Migration Step (Required)

Run migrations against the production database before serving traffic:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

Recommended: run this in CI/CD before promoting a deployment.

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

### Adding a new modality

See [modality-plugin-guide.md](modality-plugin-guide.md) for the full walkthrough. The short version:

1. Create `backend/context/<modality_key>/manifest.yaml` and populate `.md` files
2. Implement `ModalityPlugin` in `frontend/src/modalities/<key>/index.ts`
3. Register it in `frontend/src/modalityRegistry.ts`

No changes to backend Python logic or existing frontend components are required.
