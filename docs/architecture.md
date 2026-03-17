# Architecture

## Overview

Symbolic Breeder has a classic client-server architecture. The React frontend handles rendering, user interaction, and live program execution. The Python backend owns session persistence, LLM orchestration, and the modality context system.

```
┌──────────────────────────────────────────────────────────┐
│                     React Frontend                        │
│                                                           │
│  ModalitySelector — pick Strudel or Shader               │
│  ProgramGrid — grid of ProgramCards                       │
│  ProgramCard — renders preview + select/play/customize    │
│    ├── StrudelRenderer  (modality plugin)                 │
│    └── ShaderRenderer   (modality plugin)                 │
│  GuidanceInput + Evolve button                            │
│  GenerationNav — browse generation history                │
│  CustomizeModal — code editor + live preview              │
│  LoadingOverlay — shown during LLM generation             │
│  useEvolution hook — session/evolve API + mock fallback   │
│  Zustand store — session, generations, selection, etc.    │
└───────────────────────┬──────────────────────────────────┘
                        │ REST / JSON
┌───────────────────────▼──────────────────────────────────┐
│              Python Backend (FastAPI)                     │
│                                                           │
│  POST /api/sessions   { modality, name?, prompt? }        │
│  GET  /api/sessions/:id                                   │
│  GET  /api/programs/:id                                   │
│  POST /api/evolve     { modality, parents, guidance? }    │
│  GET  /api/providers                                      │
│  POST /api/gallery/share                                  │
│  GET  /api/gallery/programs                               │
│  GET  /api/health                                         │
└──────────────┬────────────────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────────────┐   ┌──────────▼─────────────────────────────┐
│ PostgreSQL       │   │  LLM Service (multi-provider)            │
│ users            │   │  ModalityContextRegistry                │
│ sessions         │   │    strudel/manifest.yaml + .md files    │
│ programs         │   │    shader/manifest.yaml  + .md files    │
│ shared_programs  │   │  Prompt assembly (system/seed/evolve)   │
│ program_reactions│   │  Providers: Anthropic, OpenAI,          │
└──────────────────┘   │             Gemini, Qwen                │
                       └────────────────────────────────────────┘
```

---

## Backend

### FastAPI Application

`app/main.py` bootstraps the FastAPI app and registers CORS + routers. The app is created via an app factory so it can run both locally and as a Vercel Python serverless function.

Schema creation is migration-driven (Alembic), not startup-driven.

### Data Model

SQLAlchemy ORM models, defined in `app/models/db.py`:

**User** — future-proof identity table for login and personalization.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `external_id` | string | Provider identity subject; unique |
| `email` | string | Optional; unique |
| `display_name` | string | Optional |
| `created_at` / `updated_at` | datetime | Audit timestamps |

**Session** — groups all programs created in one breeding run.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `name` | string | Optional label |
| `modality` | string | `"strudel"` or `"shader"` |
| `owner_user_id` | string | Optional FK → User |
| `created_at` | datetime | Auto-set on creation |

**Program** — a single piece of code produced by seeding or evolution.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `code` | text | The full program source |
| `modality` | string | Matches its session |
| `generation` | int | 0 = seed, 1+ = evolved |
| `parent_ids` | JSON | List of parent Program UUIDs |
| `session_id` | string | FK → Session |
| `creator_user_id` | string | Optional FK → User |
| `created_at` | datetime | Auto-set on creation |

**ProgramReaction** — stores like/dislike-style per-user reactions.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `user_id` | string | FK → User |
| `program_id` | string | FK → Program |
| `reaction` | int | Constrained to `-1` or `1` |
| `created_at` / `updated_at` | datetime | Audit timestamps |

Unique constraint: `(user_id, program_id)` ensures one reaction per user per program.

**SharedProgram** — a program shared to the public gallery.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `program_id` | string | Optional FK → Program |
| `sharer_name` | string | Display name of sharer |
| `modality` | string | `"strudel"` or `"shader"` |
| `code` | text | Program source code |
| `lineage` | JSON | Ancestry chain of parent programs |
| `llm_model` | string | Model used to generate the program |
| `created_at` | datetime | Auto-set on creation |

### Routers

**`routers/sessions.py`** — Handles session lifecycle:
- `POST /api/sessions` — creates a session and immediately seeds generation 0 via the LLM service
- `GET /api/sessions/:id` — retrieves a session with its programs

**`routers/evolve.py`** — Handles evolution:
- `POST /api/evolve` — takes parent programs + optional guidance text, calls the LLM, persists and returns the new generation

**`routers/gallery.py`** — Handles the public gallery:
- `POST /api/gallery/share` — share a program to the gallery
- `GET /api/gallery/programs` — list shared programs (paginated, filterable by modality)
- `GET /api/gallery/programs/:id` — retrieve a single shared program

**`routers/providers.py`** — Exposes available LLM providers:
- `GET /api/providers` — returns the list of supported providers and their models, plus whether server-side API keys are configured

### LLM Service (`services/llm.py` + `services/providers/`)

Supports multiple LLM providers through a pluggable provider system in `services/providers/`:

| Provider | Key | SDK | Env Variable |
|---|---|---|---|
| Anthropic | `anthropic` | `anthropic` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai` | `openai` | `OPENAI_API_KEY` |
| Google Gemini | `gemini` | `google-genai` | `GOOGLE_API_KEY` |
| Qwen | `qwen` | `dashscope` | `DASHSCOPE_API_KEY` |

Each provider implements a common `LLMProvider` interface. The provider and model are selected per-request by the frontend. If no API keys are configured, mock mode returns pre-written programs from a built-in pool.

The `DEFAULT_MODEL` is read from the `LLM_MODEL` environment variable, defaulting to `claude-sonnet-4-20250514`.

### Modality Context System (`services/context.py`)

The context system injects relevant documentation and examples into LLM prompts. Each modality has its own folder under `backend/context/`:

```
backend/context/
├── strudel/
│   ├── manifest.yaml
│   ├── tutorials/
│   │   ├── language_reference.md
│   │   ├── mini_notation.md
│   │   ├── audio_effects.md
│   │   └── pattern_effects.md
│   └── examples/
│       ├── community_examples.md
│       └── simple_patterns.md
└── shader/
    ├── manifest.yaml
    ├── tutorials/
    │   ├── glsl_reference.md
    │   ├── shadertoy_conventions.md
    │   └── animation_patterns.md
    └── examples/
        ├── example_shaders.md
        └── simple_patterns.md
```

`manifest.yaml` lists every source file and declares which prompt sections it is injected into:

```yaml
sources:
  - id: language_reference
    enabled: true
    category: tutorial
    path: tutorials/language_reference.md
    inject_into: [ system ]   # always in system prompt

  - id: community_examples
    enabled: true
    category: examples
    path: examples/community_examples.md
    inject_into: [ seed, evolve ]   # only in seed/evolve prompts
```

Three context functions are exported:
- `get_system_context(modality)` — sources tagged `system`
- `get_seed_context(modality)` — sources tagged `seed`
- `get_evolve_context(modality)` — sources tagged `evolve`

All files are cached in memory after the first load. Adding a new modality requires only a new folder + `manifest.yaml` — no Python changes.

---

## Frontend

### State Management

Zustand is used for a single global store (`store/sessionStore.ts`). Key state:

| Field | Type | Purpose |
|---|---|---|
| `session` | `Session \| null` | Active session metadata |
| `modality` | `string \| null` | Active modality key |
| `generations` | `Program[][]` | All generations, indexed by generation number |
| `currentGeneration` | `number` | Which generation is displayed |
| `selectedProgramIds` | `Set<string>` | Cards selected as parents |
| `playingProgramId` | `string \| null` | Which Strudel card is playing audio |
| `isLoading` | `boolean` | True during any LLM call |
| `isEvolving` | `boolean` | True during an evolve call specifically |
| `customizedPrograms` | `Record<string, string>` | User-edited code overrides (programId → code) |

### Modality Plugin Interface

Defined in `src/types.ts`:

```typescript
interface ModalityPlugin {
  key: string;           // "strudel" | "shader"
  label: string;         // display name
  language: string;      // Monaco syntax language ("javascript" | "glsl")
  description: string;   // shown on ModalitySelector tile

  render(code: string, container: HTMLElement): () => void;
  previewInModal(code: string, container: HTMLElement): () => void;
  validate?(code: string): string | null;
}
```

`render` and `previewInModal` both return a **cleanup function** the caller must invoke on unmount.

All plugins are registered in `src/modalityRegistry.ts`:

```typescript
export const modalityRegistry: Record<string, ModalityPlugin> = {
  strudel: strudelPlugin,
  shader: shaderPlugin,
};
```

### Strudel Plugin (`modalities/strudel/index.ts`)

Drives a single shared hidden `<strudel-editor>` web component. Only one program can play at a time. `render` plays the code; the cleanup function stops it.

### Shader Plugin (`modalities/shader/index.ts`)

Creates a `<canvas>` element per card. Every card gets its own WebGL context — contexts are never shared between cards.

**Fragment shader wrapper** (applied around the user's `mainImage` function):

```glsl
precision mediump float;

uniform vec2  iResolution;
uniform float iTime;

// ---- user code ----
// (helper functions, then mainImage)
// -------------------

void main() {
  vec4 col = vec4(0.0);
  mainImage(col, gl_FragCoord.xy);
  gl_FragColor = col;
}
```

**Vertex shader** (static):

```glsl
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
```

The `iTime` uniform is driven by `requestAnimationFrame` using `performance.now()`:
- `iTime = performance.now() / 1000` (elapsed seconds)

Cards use `IntersectionObserver` to pause the animation loop when scrolled off-screen.

GLSL compile errors are caught and displayed as an inline overlay on the card.

### Evolution Hook (`hooks/useEvolution.ts`)

`useEvolution` provides two async functions to the rest of the app:

- **`createSession(modality)`** — calls `POST /api/sessions`, receives the session object and generation 0 programs, populates the store
- **`evolve(guidance?)`** — reads selected programs (using `customizedPrograms` overrides where present) from the store, calls `POST /api/evolve`, appends the new generation

Both set `isLoading = true` before the call and `false` on completion (success or error). If `VITE_API_URL` is unset and the backend is unreachable, the hook falls back to the mock pools automatically.

---

## Data Flow: Evolve Cycle

```
User selects cards + types guidance
         │
         ▼
useEvolution.evolve()
  setIsLoading(true)
         │
         ▼
POST /api/evolve
  { modality, parents: [{id, code}], guidance, session_id }
         │
         ▼
Backend: routers/evolve.py
  → services/evolution.py
      → services/context.py  (load evolve context for modality)
      → services/llm.py      (assemble prompt, call Anthropic)
  → parse code from LLM response
  → persist new Program rows
  → return { programs: [...], generation: N }
         │
         ▼
useEvolution receives response
  store.addGeneration(programs)
  setIsLoading(false)
         │
         ▼
ProgramGrid re-renders new cards
```

---

## Extensibility

Adding a new modality requires:

**Backend** — create `backend/context/<key>/manifest.yaml` and populate `.md` files. The context registry auto-discovers it by folder name.

**Frontend** — implement `ModalityPlugin` in `src/modalities/<key>/index.ts`, add one line to `src/modalityRegistry.ts`, and add a tile to `ModalitySelector.tsx`.

No changes needed to `ProgramGrid`, `ProgramCard`, `CustomizeModal`, `useEvolution`, the store, or any backend service code.
