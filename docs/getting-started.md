# Getting Started

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build tooling |
| npm | 9+ | Bundled with Node |
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
| `fastapi` | HTTP framework |
| `uvicorn[standard]` | ASGI server |
| `sqlalchemy` | ORM + SQLite adapter |
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
DATABASE_URL=sqlite:///./symbolic_breeder.db   # Default shown
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

## Building for Production

### Backend

The backend is a standard Python package. For production, run with a process manager (e.g. `gunicorn` with `uvicorn` workers) behind a reverse proxy.

```bash
pip install gunicorn
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
```

Set `ANTHROPIC_API_KEY` and adjust `DATABASE_URL` as appropriate for your environment.

### Frontend

```bash
cd frontend
npm run build
```

Static files are emitted to `frontend/dist/`. Serve them from any static file host (nginx, Caddy, S3 + CloudFront, Vercel, etc.).

If the frontend is served from a different origin than the backend, set `VITE_API_URL` to the full backend URL at build time:

```bash
VITE_API_URL=https://api.yourhost.com npm run build
```

---

## Database

SQLite is used by default. The database file `symbolic_breeder.db` is created automatically in the `backend/` directory when the server first starts. No migration tooling is needed for SQLite — tables are created via `Base.metadata.create_all()` at startup.

For production with PostgreSQL, set `DATABASE_URL` to a Postgres connection string:

```
DATABASE_URL=postgresql+psycopg2://user:password@host:5432/symbolic_breeder
```

Install the driver: `pip install psycopg2-binary`.

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
