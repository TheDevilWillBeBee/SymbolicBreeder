# Symbolic Breeder

A generalized evolutionary programming tool where you guide LLM-powered mutation of programs that produce live outputs.

Select programs you like, optionally add guidance text, and press **Evolve** — the LLM produces a new generation of variations. Repeat until something interesting emerges.

## Modalities

| Modality | Output | Technology |
|---|---|---|
| **Strudel** | Live-coded music | [strudel.cc](https://strudel.cc) web component |
| **WebGL Shader** | Animated visuals | WebGL / GLSL fragment shaders |
| **OpenSCAD** | Parametric 3D models | [OpenSCAD](https://openscad.org) language |
| **SVG** | Vector graphics & logos | Inline SVG with SMIL/CSS animation |

More modalities (p5.js, Tone.js, etc.) can be added without touching core logic — see [docs/modality-plugin-guide.md](docs/modality-plugin-guide.md).

## How It Works

1. **Select a modality** (Strudel, Shader, OpenSCAD, or SVG) on the splash screen
2. A session is created and the backend seeds **generation 0** via LLM (or mock)
3. Programs appear as interactive cards in the grid
4. **Select** one or more cards you find interesting
5. Optionally type **guidance** ("more percussion", "warmer colors")
6. Press **Evolve** — the backend sends the selected programs + guidance to the LLM which returns a new generation of variations
7. Use **Customize** on any card to edit its code directly and preview the result live
8. Customized programs can be marked as parents for the next generation
9. Repeat until you reach something you love

Multiple LLM providers are supported (Anthropic, OpenAI, Google Gemini, Qwen). Users can select their preferred provider and model in the UI, or the server can use pre-configured API keys.

The **context system** supports three complexity profiles — simple, intermediate, and advanced — with inheritance. Prompts are stored in per-modality `prompts/prompt_bundle.yaml` files, not in Python code. The **gallery** stores per-generation metadata (guidance text, LLM model, and context profile) in each lineage entry, so viewers can see exactly how a program was evolved.

## Documentation

| Document | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Prerequisites, installation, running locally, deploying to Vercel |
| [Architecture](docs/architecture.md) | System design, data flow, component map |
| [API Reference](docs/api-reference.md) | REST API endpoints and request/response shapes |
| [Modality Plugin Guide](docs/modality-plugin-guide.md) | How to add a new modality (backend + frontend) |
| [Frontend Guide](docs/frontend-guide.md) | Frontend component architecture and state management |
| [Database Management](docs/database-management.md) | Migrations and database operations |

## Project Structure

```
SymbolicBreeder/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, router registration
│   │   ├── database.py         # PostgreSQL engine + session factory
│   │   ├── models/
│   │   │   ├── db.py           # User, Session, Program, SharedProgram, Reaction ORM models
│   │   │   └── schemas.py      # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── sessions.py     # POST/GET /api/sessions
│   │   │   ├── evolve.py       # POST /api/evolve
│   │   │   ├── gallery.py      # POST/GET /api/gallery (sharing & browsing)
│   │   │   └── providers.py    # GET /api/providers (available LLM providers)
│   │   └── services/
│   │       ├── context.py      # Per-modality context loader
│   │       ├── evolution.py    # Orchestrates seed/evolve logic
│   │       ├── llm.py          # LLM orchestration + mock fallback
│   │       └── providers/      # Multi-provider LLM support (Anthropic, OpenAI, Gemini, Qwen)
│   ├── context/
│   │   ├── strudel/            # Strudel tutorials + examples
│   │   ├── shader/             # GLSL tutorials + examples
│   │   ├── openscad/           # OpenSCAD tutorials + examples
│   │   └── svg/                # SVG tutorials + strategies
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
    │   │   ├── shader/          # WebGL shader plugin
    │   │   ├── openscad/        # OpenSCAD 3D model plugin
    │   │   └── svg/             # SVG vector graphics plugin
    │   ├── components/          # React UI components
    │   ├── hooks/               # useEvolution, useShaderRenderer
    │   ├── store/               # Zustand stores (session, nav, gallery, log)
    │   └── api/                 # Fetch wrapper
    └── package.json
```

## Inspiration

Symbolic Breeder is inspired by [PicBreeder](https://picbreeder.org), the landmark experiment in collaborative open-ended evolution by Kenneth Stanley and colleagues. Where PicBreeder evolves *Compositional Pattern-Producing Networks* (CPPNs) with hand-crafted mutation operators, Symbolic Breeder evolves **programs** using large language models as the variation engine — enabling mutation, crossover, and reinterpretation of code in expressive programming paradigms like Strudel (music), GLSL shaders (visuals), OpenSCAD (3D models), and SVG (vector graphics).

As Kenneth Stanley argues, open-ended processes driven by novelty rather than a fixed objective are essential for genuine discovery. There is no "target" shader or "goal" melody here — you explore freely, and the most interesting discoveries are the ones nobody planned for.

## Planned Features

We welcome contributions! Here are some directions we'd love to explore:

- **Free hosted LLM** — provide a default model so users can try the tool without supplying their own API key
- **UI/UX improvements** — better mobile experience, richer card interactions, drag-and-drop lineage exploration
- **Prompt engineering** — improve LLM prompts for higher-quality mutations and more diverse outputs
- **New modalities** — p5.js sketches, Tone.js synths, or any other live-renderable program format (see [modality plugin guide](docs/modality-plugin-guide.md))
- **Collaborative breeding** — real-time multi-user sessions where participants vote on selections together
- **Lineage analytics** — visualize evolutionary trajectories, track which mutations produced the most interesting results
- **Export & embed** — download shaders as videos, export Strudel patterns as audio files, embed programs on other sites

See the [GitHub Issues](https://github.com/TheDevilWillBeBee/SymbolicBreeder/issues) for more ideas and discussion.

## Credits

Created by [Ehsan Pajouheshgar](https://pajouheshgar.github.io). The idea emerged from conversations with Ali Golmakani.

Built with the help of coding agents, primarily [Claude Code](https://claude.ai) and [ChatGPT Codex](https://openai.com/index/introducing-codex/).

## License

MIT
