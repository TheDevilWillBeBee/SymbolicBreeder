# Frontend Guide

## Tech Stack

| Tool | Version | Role |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 5 | Dev server + build tool |
| Zustand | 4 | Client state management |
| Monaco Editor (`@monaco-editor/react`) | — | Code editor in CustomizeModal |

---

## Directory Structure

```
frontend/src/
├── App.tsx                  # Root layout, session initialization
├── main.tsx                 # React entry point
├── types.ts                 # All shared TypeScript interfaces
├── modalityRegistry.ts      # Plugin registry (key → ModalityPlugin)
│
├── api/
│   └── client.ts            # Typed fetch wrapper around /api endpoints
│
├── modalities/
│   ├── strudel/
│   │   └── index.ts         # Strudel ModalityPlugin implementation
│   └── shader/
│       └── index.ts         # Shader ModalityPlugin implementation
│
├── components/
│   ├── ModalitySelector.tsx # Splash screen — pick Strudel or Shader
│   ├── ProgramGrid.tsx      # Responsive grid of ProgramCards
│   ├── ProgramCard.tsx      # Individual card: live preview + controls
│   ├── GuidanceInput.tsx    # Free-text hint + Evolve button
│   ├── GenerationNav.tsx    # Browse generation history
│   ├── CustomizeModal.tsx   # Code editor + live preview pane
│   ├── LoadingOverlay.tsx   # Full-screen loading state
│   └── CodeModal.tsx        # View-only code display
│
├── hooks/
│   ├── useEvolution.ts      # createSession() + evolve() + mock fallback
│   └── useShaderRenderer.ts # WebGL lifecycle for a shader canvas
│
└── store/
    └── sessionStore.ts      # Zustand store — all client state
```

---

## State Management

All client state lives in a single Zustand store (`store/sessionStore.ts`). Components read from the store with selector hooks and call actions directly.

### Store shape

```typescript
interface SessionState {
  session: Session | null;
  modality: string | null;
  generations: Program[][];
  currentGeneration: number;
  selectedProgramIds: Set<string>;
  playingProgramId: string | null;
  guidance: string;
  isEvolving: boolean;
  isLoading: boolean;
  customizedPrograms: Record<string, string>;  // programId → overridden code

  // Actions
  setSession(session: Session): void;
  setModality(modality: string): void;
  addGeneration(programs: Program[]): void;
  setCurrentGeneration(gen: number): void;
  toggleProgramSelection(programId: string): void;
  clearSelection(): void;
  setPlayingProgramId(programId: string | null): void;
  setGuidance(text: string): void;
  setIsEvolving(v: boolean): void;
  setIsLoading(v: boolean): void;
  setCustomizedCode(programId: string, code: string): void;
  reset(): void;
}
```

### Key state transitions

| Trigger | State change |
|---|---|
| User selects a modality | `modality` set, `createSession()` called |
| Session created | `session` set, `addGeneration(gen0programs)` called |
| User clicks a card | `toggleProgramSelection(id)` |
| User presses Evolve | `isLoading = true`, api call, `addGeneration()`, `isLoading = false` |
| User opens Customize | Modal shown; `setCustomizedCode()` on "Use as Parent" |
| User navigates generations | `setCurrentGeneration(n)` |

---

## Components

### `App.tsx`

Root component. Renders `ModalitySelector` when `modality` is null, otherwise renders the full breeding UI (`ProgramGrid`, `GuidanceInput`, `GenerationNav`, `LoadingOverlay`).

### `ModalitySelector`

Displayed on first load. Shows an interactive tile for each registered modality from `modalityRegistry`. Selecting a tile calls `createSession(modality)` from `useEvolution`.

**Props:** none — reads `modalityRegistry` directly.

### `ProgramGrid`

Responsive grid (2 columns mobile, 3 desktop) of `ProgramCard` components for the current generation.

**Props:**
- `programs: Program[]` — programs to render
- `plugin: ModalityPlugin` — the active modality plugin

### `ProgramCard`

Renders a single program. Calls `plugin.render(code, containerRef.current)` on mount and cleans up on unmount. Handles:

- Live rendering via the modality plugin
- Selection state (accent ring when selected)
- Play / Stop (Strudel) or continuous animation (Shader)
- **Customize** button → opens `CustomizeModal`
- **View code** button → opens `CodeModal`
- Inline compiler error display (Shader)
- `IntersectionObserver` to pause animations when off-screen

**Props:**
- `program: Program`
- `plugin: ModalityPlugin`
- `isSelected: boolean`
- `onSelect: (id: string) => void`

### `GuidanceInput`

A text input for optional evolution guidance and the **Evolve** button. The button is disabled when no cards are selected or `isLoading` is true. Shows the current generation counter in the button label.

**Props:** none — reads from and writes to the store directly.

### `GenerationNav`

Horizontal breadcrumb showing all generation numbers. Clicking a number calls `setCurrentGeneration(n)`.

**Props:** none — reads from store.

### `LoadingOverlay`

Full-screen semi-transparent overlay with a spinner and status message. Rendered when `isLoading` is true. Blocks all pointer events underneath.

Status messages:
- Generation 0: `"Seeding generation 0…"`
- Generation N: `"Evolving generation N…"`

**Props:** none — reads `isLoading` and `currentGeneration` from store.

### `CustomizeModal`

Opened by the Customize button on any card. Layout:

- **Left/top pane**: Monaco Editor with syntax highlighting set to `plugin.language`
- **Right/bottom pane**: Live preview area — `plugin.previewInModal()` renders here when Preview is pressed
- **▶ Preview** button: calls `previewInModal(code, previewContainerRef.current)`, cleans up previous preview first
- **Use as Parent** button: calls `store.setCustomizedCode(program.id, editorValue)` then closes the modal
- **Close / Cancel**: closes without saving; cleanup function called

Changes are purely local until "Use as Parent" is confirmed. No API calls are made during customization.

**Props:**
- `program: Program`
- `plugin: ModalityPlugin`
- `onClose: () => void`

### `CodeModal`

View-only modal that displays the raw program code with syntax highlighting. No editing capability.

**Props:**
- `program: Program`
- `language: string`
- `onClose: () => void`

---

## Hooks

### `useEvolution`

The main API integration hook. Exports two async functions:

```typescript
const { createSession, evolve } = useEvolution();
```

**`createSession(modality: string)`**
1. Sets `isLoading = true`
2. Calls `POST /api/sessions`
3. On success: sets `session` and calls `addGeneration(programs)`
4. On error: logs; falls back to mock if API unreachable
5. Sets `isLoading = false`

**`evolve(guidance?: string)`**
1. Reads `selectedProgramIds` from store
2. Builds parent objects, substituting `customizedPrograms` overrides where present
3. Sets `isLoading = true`
4. Calls `POST /api/evolve`
5. On success: calls `addGeneration(programs)`, clears selection
6. Sets `isLoading = false`

### `useShaderRenderer`

Manages the WebGL lifecycle for a single shader canvas. Called by the Shader plugin's `render()` and `previewInModal()` implementations.

```typescript
const cleanup = useShaderRenderer(code, canvasElement);
```

Internally:
1. Compiles the vertex shader (static boilerplate)
2. Wraps user code in the fragment shader template and compiles
3. On compile error: stores the error string; caller displays it
4. Sets up a fullscreen quad geometry
5. Starts `requestAnimationFrame` loop, updating `iTime` each frame
6. Returns a cleanup fn for cancelling the loop and losing the context

---

## API Client (`api/client.ts`)

Thin typed wrapper around `fetch`. Reads `VITE_API_URL` for the base URL (defaults to empty string, relying on Vite's dev proxy).

```typescript
// Usage examples
const { session, programs } = await api.createSession({ modality: 'shader' });
const { programs, generation } = await api.evolve({ modality, parents, guidance });
```

---

## Types (`types.ts`)

All shared interfaces are defined here. Key types:

```typescript
interface Program {
  id: string;
  code: string;
  modality: string;
  generation: number;
  parentIds: string[];
  sessionId: string;
  createdAt: string;
}

interface Session {
  id: string;
  name: string;
  modality: string;
  createdAt: string;
}

interface ModalityPlugin {
  key: string;
  label: string;
  language: string;
  description: string;
  render(code: string, container: HTMLElement): () => void;
  previewInModal(code: string, container: HTMLElement): () => void;
  validate?(code: string): string | null;
}
```

---

## Shader WebGL Details

### Uniforms

| Uniform | Type | Value |
|---|---|---|
| `iResolution` | `vec2` | Canvas width × height in pixels |
| `iTime` | `float` | Elapsed time in seconds (`performance.now() / 1000`) |

### User code contract

LLM-generated shader programs must define a `mainImage` function and may include helper functions above it:

```glsl
// Optional helper functions (noise, sdf, palette, rotation, etc.)

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  // ... user code ...
}
```

The frontend wraps this in a full vertex + fragment shader before compiling.

### Performance

- Each card creates its own `WebGLRenderingContext` — contexts are never shared
- `IntersectionObserver` is used to cancel the `requestAnimationFrame` loop for cards scrolled off-screen, and restart it when they re-enter the viewport
- On card unmount: `cancelAnimationFrame()` + `gl.getExtension('WEBGL_lose_context').loseContext()`

---

## Adding a New Modality

See [modality-plugin-guide.md](modality-plugin-guide.md) for the full walkthrough. The frontend portion is:

1. Create `src/modalities/<key>/index.ts` implementing `ModalityPlugin`
2. Add one line to `src/modalityRegistry.ts`
3. Ensure `ModalitySelector` shows a tile for the new key

No other components need to change.
