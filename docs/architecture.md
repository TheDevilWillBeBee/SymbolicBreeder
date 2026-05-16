# Architecture

## Overview

Symbolic Breeder has a classic client-server architecture. The React frontend handles rendering, user interaction, and live program execution. The Python backend owns session persistence, LLM orchestration, and the modality context system.

```
┌──────────────────────────────────────────────────────────┐
│                     React Frontend                        │
│                                                           │
│  ModalitySelector — pick Strudel, Shader, OpenSCAD, or SVG│
│  ProgramGrid — grid of ProgramCards                       │
│  ProgramCard — renders preview + select/play/customize    │
│    ├── StrudelRenderer  (modality plugin)                 │
│    ├── ShaderRenderer   (modality plugin)                 │
│    ├── OpenSCADRenderer (modality plugin)                 │
│    └── SVGRenderer      (modality plugin)                 │
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
│  POST /api/gallery/share    (auth required)                │
│  GET  /api/gallery/programs                               │
│  POST /api/gallery/programs/:id/like  (auth required)     │
│  POST /api/auth/register                                  │
│  POST /api/auth/login                                     │
│  GET  /api/auth/me          (auth required)               │
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
│ shared_programs  │   │    openscad/manifest.yaml + .md files   │
│ program_reactions│   │  Prompt assembly (system/seed/evolve)   │
└──────────────────┘   │  Providers: Anthropic, OpenAI,          │
                       │             Gemini, Qwen                │
                       └────────────────────────────────────────┘
```

---

## Backend

### FastAPI Application

`app/main.py` bootstraps the FastAPI app and registers CORS + routers. The app is created via an app factory so it can run both locally and as a Vercel Python serverless function.

Schema creation is migration-driven (Alembic), not startup-driven.

### Data Model

SQLAlchemy ORM models, defined in `app/models/db.py`:

**User** — identity table for authentication and personalization.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `external_id` | string | Provider identity subject; unique (`local:<uuid>` for email/password users) |
| `username` | string(40) | Unique; shown on shared items and in the UI |
| `email` | string | Optional; unique |
| `display_name` | string | Optional |
| `password_hash` | string | bcrypt hash; nullable (for future OAuth-only users) |
| `is_verified` | boolean | Default `false`; unverified users cannot like gallery items |
| `created_at` / `updated_at` | datetime | Audit timestamps |

**Session** — groups all programs created in one breeding run.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `name` | string | Optional label |
| `modality` | string | `"strudel"`, `"shader"`, `"openscad"`, or `"svg"` |
| `context_profile` | string | `"simple"`, `"intermediate"`, or `"advanced"` (nullable, default `"intermediate"`) |
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

**SharedProgram** — a program shared to the public gallery.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `program_id` | string | Optional FK → Program |
| `sharer_name` | string | Display name of sharer (derived from authenticated user's username) |
| `sharer_user_id` | string | FK → User; the authenticated user who shared this program |
| `modality` | string | `"strudel"`, `"shader"`, `"openscad"`, or `"svg"` |
| `code` | text | Program source code |
| `lineage` | JSON | Ancestry chain of parent programs. Each entry includes optional per-generation metadata: `guidance` (user prompt text), `llmModel` (provider/model used), and `contextProfile` (simple/intermediate/advanced) |
| `llm_model` | string | Model used to generate the program (top-level, for the final generation) |
| `like_count` | int | Denormalized count of likes (default 0); atomically updated on like/unlike |
| `created_at` | datetime | Auto-set on creation |

**ProgramReaction** — stores per-user likes on shared gallery programs.

| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `user_id` | string | FK → User |
| `shared_program_id` | string | FK → SharedProgram |
| `reaction` | int | Constrained to `-1` or `1` |
| `created_at` / `updated_at` | datetime | Audit timestamps |

Unique constraint: `(user_id, shared_program_id)` ensures one reaction per user per shared program.

### Routers

**`routers/sessions.py`** — Handles session lifecycle:
- `POST /api/sessions` — creates a session and immediately seeds generation 0 via the LLM service
- `GET /api/sessions/:id` — retrieves a session with its programs

**`routers/evolve.py`** — Handles evolution:
- `POST /api/evolve` — takes parent programs + optional guidance text, calls the LLM, persists and returns the new generation

**`routers/auth.py`** — Handles user authentication:
- `POST /api/auth/register` — create a new account (username, email, password)
- `POST /api/auth/login` — authenticate with email/username + password, returns JWT
- `GET /api/auth/me` — retrieve current user info (requires JWT)

**`routers/gallery.py`** — Handles the public gallery:
- `POST /api/gallery/share` — share a program to the gallery (requires authentication)
- `GET /api/gallery/programs` — list shared programs (paginated, filterable by modality, sortable by newest or most liked)
- `GET /api/gallery/programs/:id` — retrieve a single shared program
- `POST /api/gallery/programs/:id/like` — toggle like on a shared program (requires verified account)

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

### Authentication (`auth.py`)

The auth system uses JWT (JSON Web Tokens) with bcrypt password hashing.

**Dependencies:** `passlib[bcrypt]` for password hashing, `PyJWT` for token management.

**Configuration** (environment variables):
- `JWT_SECRET_KEY` — required; the app will not start without it
- `JWT_ALGORITHM` — defaults to `HS256`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` — defaults to `1440` (24 hours)

**FastAPI dependencies** (defined in `auth.py`):
- `get_current_user` — extracts Bearer token from `Authorization` header, decodes JWT, returns User or 401
- `get_optional_user` — same but returns `None` on missing token (still 401 on invalid token); used for public endpoints that optionally personalize responses (e.g., `liked_by_me` on gallery items)
- `get_verified_user` — wraps `get_current_user`, returns 403 if `is_verified` is `False`

**Auth flow:**
1. User registers via `POST /auth/register` with username, email, password
2. Password is hashed with bcrypt and stored in `users.password_hash`
3. A JWT is returned containing `{"sub": user_id, "exp": expiry}`
4. Frontend stores the token in `localStorage` and attaches it as `Authorization: Bearer <token>` on all requests
5. `POST /auth/login` accepts email or username + password

**Access tiers:**
| Tier | Dependency | Used by |
|---|---|---|
| Public | none | Gallery browsing, breeding, evolution |
| Authenticated | `get_current_user` | Sharing to gallery |
| Verified | `get_verified_user` | Liking gallery items |

### Modality Context System (`services/context.py`)

The context system injects technique-focused documentation into LLM prompts. Each modality has its own folder under `backend/context/` with a v2 manifest that defines **complexity profiles** (simple, intermediate, advanced). The system teaches the LLM *how* to compose via reusable snippets and heuristics rather than providing full examples to copy.

```
backend/context/
├── shader/
│   ├── manifest.yaml              # v2 manifest with profiles
│   ├── prompts/
│   │   └── prompt_bundle.yaml     # role, seed, evolve, variety prompts
│   ├── shared/
│   │   └── 00_runtime_contract.md # always included
│   ├── simple/
│   │   ├── 10_building_blocks.md
│   │   └── 11_color_motion_and_composition.md
│   ├── intermediate/
│   │   ├── 20_patterns_noise_and_warping.md
│   │   └── 21_sdf_lighting_and_materials.md
│   ├── advanced/
│   │   ├── 30_raymarching_volumetrics_and_procedural_pbr.md
│   │   └── 31_feedback_simulation_and_robustness.md
│   └── strategies/
│       └── 90_shader_evolution_playbook.md
├── strudel/
│   └── (same structure)
└── openscad/
    └── (same structure)
```

#### Manifest v2 Format

```yaml
version: 2
modality: shader
default_profile: intermediate

profiles:
  simple:
    description: "Essential shader craft..."
    includes: [runtime_contract, simple_building_blocks, simple_color_motion, evolution_playbook]
  intermediate:
    extends: simple
    includes: [intermediate_patterns_noise, intermediate_sdf_lighting]
  advanced:
    extends: intermediate
    includes: [advanced_raymarching_pbr, advanced_feedback_perf]

sources:
  - id: runtime_contract
    enabled: true
    level: shared
    path: shared/00_runtime_contract.md
    inject_into: [ system ]
    # ...

prompt_bundle:
  path: prompts/prompt_bundle.yaml
```

Profiles inherit via `extends` — `advanced` includes everything from `intermediate`, which includes everything from `simple`.

#### Prompt Bundles

LLM prompts (role, seed_prompt, evolve_prompt, variety_suffix) are stored in `prompts/prompt_bundle.yaml`, not in Python code. Prompts stay fixed across profiles — only the injected context changes with complexity level.

#### Context API

```python
get_system_context(modality, profile="intermediate")  # context for system prompt
get_prompt_config(modality)                            # prompt bundle dict
get_context_version(modality)                          # manifest version number
```

All files are cached in memory after the first load. Adding a new modality requires only a new folder + `manifest.yaml` — no Python changes.

#### Token Estimation

Run `python backend/scripts/estimate_tokens.py` to see token counts per modality × profile.

---

## Frontend

### State Management

Zustand is used for multiple focused stores. Key stores:

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

**`store/authStore.ts`** — authentication state:

| Field | Type | Purpose |
|---|---|---|
| `user` | `AuthUser \| null` | Current authenticated user |
| `token` | `string \| null` | JWT token (also in localStorage) |
| `pendingShare` | `PendingShare \| null` | Share data deferred until login |

Key actions: `login`, `register`, `logout`, `checkAuth` (validates stored token on app mount), `setPendingShare`.

**`store/galleryStore.ts`** — gallery state:

| Field | Type | Purpose |
|---|---|---|
| `programs` | `SharedProgram[]` | Current page of gallery items |
| `sortBy` | `'newest' \| 'most_liked'` | Sort order |
| `modality` | string | Active modality tab |

Key actions: `fetchPrograms`, `setSortBy`, `updateLike`.

### Modality Plugin Interface

Defined in `src/types.ts`:

```typescript
interface ModalityPlugin {
  key: string;           // "strudel" | "shader" | "openscad" | "svg"
  label: string;         // display name
  language: string;      // Monaco syntax language ("javascript" | "glsl" | "c")
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
  openscad: openscadPlugin,
  svg: svgPlugin,
};
```

### Strudel Plugin (`modalities/strudel/index.ts`)

Drives a single shared hidden `<strudel-editor>` web component. Only one program can play at a time. `render` plays the code; the cleanup function stops it.

### SVG Plugin (`modalities/svg/index.ts`)

Renders inline SVG markup via `innerHTML` into a wrapper div. Scripts and event handlers are stripped for security. Supports static SVG and declarative animations (SMIL `<animate>` and CSS `@keyframes`). Snapshot rendering uses SVG→Blob→Image→Canvas pipeline.

### Shader Plugin (`modalities/shader/index.ts`)

Creates a `<canvas>` element per card. Every card gets its own WebGL context — contexts are never shared between cards.

### OpenSCAD Plugin (`modalities/openscad/index.ts`)

Renders parametric 3D model code as syntax-highlighted previews in cards (similar to Strudel). OpenSCAD produces static geometry, so there is no animation timeline or audio playback. The preview modal displays the code with a visual indicator. Users can copy code to the OpenSCAD desktop app or online playground for full 3D rendering.

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
  { modality, parents: [{id, code}], guidance, session_id, context_profile }
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

---

## Future Work: Authentication & User System

The current auth implementation covers Phase 1. The following features are planned for subsequent phases:

### Phase 2: Email Verification

- Send a verification email with a one-time code or link after registration
- The `is_verified` flag already exists on the User model (defaults to `false`)
- Unverified users can browse and share but cannot like gallery items
- Options: integrate with a transactional email service (SendGrid, AWS SES, Resend) or use a lightweight SMTP setup

### Phase 2: OAuth Providers (Google, GitHub)

- The User model already has an `external_id` field designed for this (`local:<uuid>` for password users, `google:<id>` or `github:<id>` for OAuth)
- Implementation would add:
  - `GET /api/auth/google` — redirect to Google OAuth consent
  - `GET /api/auth/google/callback` — exchange code for tokens, create/link user
  - Same pattern for GitHub and other providers
- Frontend would add OAuth buttons to the AuthModal alongside the email/password form
- Users who sign up via OAuth would have `password_hash = NULL` and authenticate only via their provider

### Phase 2: Account Management

- Password reset flow (forgot password → email link → new password)
- Username/email change
- Account deletion
- Profile settings page
