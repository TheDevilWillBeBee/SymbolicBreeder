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

## Local Testing Checklist

Run these in order to validate local behavior end-to-end:

1. Start backend (`uvicorn app.main:app --reload --port 8000`)
2. Start frontend (`npm run dev` in `frontend/`)
3. Health check:

```bash
curl http://localhost:8000/api/health
```

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

## Vercel Setup

This repository is configured to deploy both frontend and backend in one Vercel project:
- static frontend build output from `frontend/dist`
- Python function backend via `api/[...path].py`
- `/api/*` handled by the serverless function

### 1. Vercel CLI (if `vercel` command is missing)

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
- `DATABASE_URL` and/or `POSTGRES_*`
- `CORS_ALLOW_ORIGINS`
- `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` (optional)

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

Deploy from Vercel dashboard or CLI (`npx vercel@latest --prod`).

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

## Inspiration

Symbolic Breeder is inspired by [PicBreeder](https://picbreeder.org), the landmark experiment in collaborative open-ended evolution by Kenneth Stanley and colleagues. Where PicBreeder evolves *Compositional Pattern-Producing Networks* (CPPNs) with hand-crafted mutation operators, Symbolic Breeder evolves **programs** using large language models as the variation engine — enabling mutation, crossover, and reinterpretation of code in expressive programming paradigms like Strudel (music) and GLSL shaders (visuals).

As Kenneth Stanley argues, open-ended processes driven by novelty rather than a fixed objective are essential for genuine discovery. There is no "target" shader or "goal" melody here — you explore freely, and the most interesting discoveries are the ones nobody planned for.

## Planned Features

We welcome contributions! Here are some directions we'd love to explore:

- **Free hosted LLM** — provide a default model so users can try the tool without supplying their own API key
- **UI/UX improvements** — better mobile experience, richer card interactions, drag-and-drop lineage exploration
- **Prompt engineering** — improve LLM prompts for higher-quality mutations and more diverse outputs
- **New modalities** — p5.js sketches, SVG generative art, Tone.js synths, or any other live-renderable program format (see [modality plugin guide](docs/modality-plugin-guide.md))
- **Collaborative breeding** — real-time multi-user sessions where participants vote on selections together
- **Lineage analytics** — visualize evolutionary trajectories, track which mutations produced the most interesting results
- **Export & embed** — download shaders as videos, export Strudel patterns as audio files, embed programs on other sites

See the [GitHub Issues](https://github.com/TheDevilWillBeBee/SymbolicBreeder/issues) for more ideas and discussion.

## Credits

Created by [Ehsan Pajouheshgar](https://pajouheshgar.github.io). The idea emerged from conversations with Ali Golmakani.

Built with the help of coding agents, primarily [Claude Code](https://claude.ai) and [ChatGPT Codex](https://openai.com/index/introducing-codex/).

## License

MIT
