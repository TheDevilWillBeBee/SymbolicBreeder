# Symbolic Breeder

A generalized evolutionary programming tool where you guide LLM-powered mutation of programs that produce live outputs.

Select programs you like, optionally add guidance text, and press **Evolve** — the LLM produces a new generation of variations. Repeat until something interesting emerges.

## Modalities

| Modality | Output | Technology |
|---|---|---|
| **Strudel** | Live-coded music | [strudel.cc](https://strudel.cc) web component |
| **WebGL Shader** | Animated visuals | WebGL / GLSL fragment shaders |

More modalities (p5.js, Tone.js, SVG, etc.) can be added without touching core logic — see [docs/modality-plugin-guide.md](docs/modality-plugin-guide.md).

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (managed Vercel Postgres recommended)
- An Anthropic API key _(optional — a mock fallback works without one)_

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -e .

# Required: set a PostgreSQL connection URL
export DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname

# Apply schema migrations
alembic upgrade head

# Optional: set your API key
export ANTHROPIC_API_KEY=sk-ant-...

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Vite dev server proxies all `/api` requests to `http://localhost:8000` automatically.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | _(unset)_ | If unset, built-in mock programs are used for all modalities |
| `LLM_MODEL` | `claude-sonnet-4-20250514` | Anthropic model identifier |
| `DATABASE_URL` | _(required)_ | PostgreSQL connection string (Vercel Postgres or compatible) |
| `CORS_ALLOW_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated CORS origins |
| `VITE_API_URL` | `""` (same origin) | Frontend API base URL override |

## Documentation

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System design, data flow, component map |
| [docs/getting-started.md](docs/getting-started.md) | Full setup guide and development workflow |
| [docs/api-reference.md](docs/api-reference.md) | REST API endpoints and request/response shapes |
| [docs/modality-plugin-guide.md](docs/modality-plugin-guide.md) | How to add a new modality (backend + frontend) |
| [docs/frontend-guide.md](docs/frontend-guide.md) | Frontend component architecture and state management |

## Project Structure

```
SymbolicBreeder/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, router registration
│   │   ├── database.py         # PostgreSQL engine + session factory
│   │   ├── models/
│   │   │   ├── db.py           # User, Session, Program, Reaction ORM models
│   │   │   └── schemas.py      # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── sessions.py     # POST/GET /api/sessions
│   │   │   └── evolve.py       # POST /api/evolve
│   │   └── services/
│   │       ├── context.py      # Per-modality context loader
│   │       ├── evolution.py    # Orchestrates seed/evolve logic
│   │       └── llm.py          # Anthropic client + mock fallback
│   ├── context/
│   │   ├── strudel/            # Strudel tutorials + examples
│   │   └── shader/             # GLSL tutorials + examples
│   ├── alembic/                # Database migration scripts
│   └── pyproject.toml
├── api/
│   ├── [...path].py            # Vercel Python serverless entrypoint
│   └── requirements.txt        # Vercel function dependencies
├── vercel.json                 # Vercel build + routing config
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── types.ts             # Program, Session, ModalityPlugin interfaces
    │   ├── modalityRegistry.ts  # Central plugin registry
    │   ├── modalities/
    │   │   ├── strudel/         # Strudel plugin
    │   │   └── shader/          # WebGL shader plugin
    │   ├── components/          # React UI components
    │   ├── hooks/               # useEvolution, useShaderRenderer
    │   ├── store/               # Zustand session store
    │   └── api/                 # Fetch wrapper
    └── package.json
```

## How It Works

1. **Select a modality** (Strudel or Shader) on the splash screen
2. A session is created and the backend seeds **generation 0** via LLM (or mock)
3. Programs appear as interactive cards in the grid
4. **Select** one or more cards you find interesting
5. Optionally type **guidance** ("more percussion", "warmer colors")
6. Press **Evolve** — the backend sends the selected programs + guidance to the LLM which returns a new generation of variations
7. Use **Customize** on any card to edit its code directly and preview the result live
8. Customized programs can be marked as parents for the next generation
9. Repeat until you reach something you love

## License

MIT
