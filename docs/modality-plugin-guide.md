# Modality Plugin Guide

A **modality** is a self-contained plugin that defines how programs are rendered, previewed, and what LLM context is used to generate them. Symbolic Breeder ships with four modalities — **Strudel** (live music), **Shader** (animated WebGL visuals), **OpenSCAD** (parametric 3D models), and **SVG** (vector graphics & logos). This guide walks through adding a new one. The SVG modality is a good reference for a simple visual plugin since it requires no special runtime — just `innerHTML` rendering.

---

## What a Modality Defines

| Concern | Where |
|---|---|
| How programs are **rendered** live in cards | Frontend `ModalityPlugin.render()` |
| How programs are **previewed** in the editor modal | Frontend `ModalityPlugin.previewInModal()` |
| What **syntax highlighting** language to use | Frontend `ModalityPlugin.language` |
| What **LLM context** documents are injected | Backend `context/<key>/` folder |
| What **seed and evolve prompts** look like | Backend `services/llm.py` `_MODALITY_PROMPTS` |
| What **mock programs** are returned offline | Backend `services/llm.py` mock pools |

---

## Step 1 — Backend: Context Folder

Create a new folder under `backend/context/`:

```
backend/context/
└── mymodality/
    ├── manifest.yaml
    ├── tutorials/
    │   └── language_reference.md
    └── examples/
        └── seed_examples.md
```

### `manifest.yaml`

The manifest controls which files are loaded and which prompt sections they are injected into.

```yaml
# backend/context/mymodality/manifest.yaml

sources:

  - id: language_reference
    enabled: true
    category: tutorial
    path: tutorials/language_reference.md
    description: "Core language syntax and functions"
    inject_into: [ system ]           # always included in system prompt

  - id: seed_examples
    enabled: true
    category: examples
    path: examples/seed_examples.md
    description: "Example programs for seeding generation 0"
    inject_into: [ seed, evolve ]     # included when seeding and evolving
```

**`inject_into` values:**

| Value | When used |
|---|---|
| `system` | Every LLM call — use for language reference, rules, constraints |
| `seed` | `POST /api/sessions` (generation 0 seeding) |
| `evolve` | `POST /api/evolve` (all subsequent generations) |

### Tutorial and Example Files

Write Markdown files that teach the LLM everything it needs to know about your language:

- **Tutorial files** (`inject_into: [system]`): core syntax, available functions, constraints, what not to do, output format requirements.
- **Example files** (`inject_into: [seed, evolve]`): 6–12 short, diverse, runnable programs that demonstrate different styles. Quality here has the biggest impact on LLM output quality.

Keep example programs short. Short programs mutate more reliably.

The context system caches file contents in memory after the first load — no restart needed during development (unless you change the manifest).

---

## Step 2 — Backend: Prompts and Mock Pool

Open `backend/app/services/llm.py` and add your modality to two dictionaries.

### `_MODALITY_PROMPTS`

```python
_MODALITY_PROMPTS: dict[str, dict[str, str]] = {
    # ... existing entries ...
    "mymodality": {
        "role": (
            "You are a MyModality programmer. You write programs using the MyModality "
            "language. You output ONLY valid MyModality code wrapped in ```mymodality``` fences.\n\n"
            "IMPORTANT RULES:\n"
            "- Each program must be self-contained and runnable\n"
            "- Keep programs concise (target 5-20 lines)\n"
        ),
        "fence": "mymodality",
        "reference_header": "MyModality Language Reference",
        "seed_prompt": (
            "Generate {n} diverse MyModality programs in different styles."
        ),
        "evolve_prompt": (
            "Generate {n} new MyModality programs that are variations of the parents."
        ),
        "variety_suffix": (
            "\n\nOutput ONLY ```mymodality``` code blocks, no explanations."
        ),
    },
}
```

### Mock seeds and pool

```python
MOCK_MYMODALITY_SEEDS = [
    'my_program_code_1()',
    'my_program_code_2()',
    # Add 4-6 representative seed programs
]

MOCK_MYMODALITY_POOL = [
    'variant_1()',
    'variant_2()',
    # Add 8-14 evolution pool programs
]

# Register in the lookup dicts
MOCK_SEEDS: Record[str, list[str]] = {
    "strudel": MOCK_STRUDEL_SEEDS,
    "shader": MOCK_SHADER_SEEDS,
    "mymodality": MOCK_MYMODALITY_SEEDS,    # ← add this
}

MOCK_POOLS: Record[str, list[str]] = {
    "strudel": MOCK_STRUDEL_POOL,
    "shader": MOCK_SHADER_POOL,
    "mymodality": MOCK_MYMODALITY_POOL,    # ← add this
}
```

That's everything needed on the backend.

---

## Step 3 — Frontend: Implement `ModalityPlugin`

Create `frontend/src/modalities/mymodality/index.ts`:

```typescript
import type { ModalityPlugin } from '../../types';

export const myModalityPlugin: ModalityPlugin = {
  key: 'mymodality',
  label: 'My Modality',
  icon: '✦',                  // shown in the ModalitySelector tile
  language: 'javascript',     // Monaco syntax highlighting language
  description: 'Short description shown on the modality selector tile.',

  render(code: string, container: HTMLElement): () => void {
    // Mount your renderer into `container`.
    // This is called when a ProgramCard mounts or its code changes.

    const el = document.createElement('div');
    el.textContent = code;    // replace with real rendering
    container.appendChild(el);

    // Return a cleanup function called on unmount.
    return () => {
      container.removeChild(el);
    };
  },

  previewInModal(code: string, container: HTMLElement): () => void {
    // Called when the user presses Preview in CustomizeModal.
    // Same signature as render() — return a cleanup function.
    return this.render(code, container);
  },

  validate(code: string): string | null {
    // Optional. Return an error message string or null.
    // Called before submitting code as a parent.
    return null;
  },
};
```

### Full `ModalityPlugin` interface

```typescript
interface ModalityPlugin {
  key: string;
  label: string;
  icon: string;       // character shown in the modality tile
  language: string;
  description: string;

  // Renders live into a DOM container; returns cleanup fn
  render(code: string, container: HTMLElement): () => void;

  // Preview in CustomizeModal; returns cleanup fn
  previewInModal(code: string, container: HTMLElement): () => void;

  // Optional validation before parent submission
  validate?(code: string): string | null;
}
```

---

## Step 4 — Frontend: Register the Plugin

Open `frontend/src/modalityRegistry.ts` and add one line:

```typescript
import { strudelPlugin } from './modalities/strudel';
import { shaderPlugin } from './modalities/shader';
import { myModalityPlugin } from './modalities/mymodality';   // ← add

export const modalityRegistry: Record<string, ModalityPlugin> = {
  strudel: strudelPlugin,
  shader: shaderPlugin,
  mymodality: myModalityPlugin,   // ← add
};
```

---

## Step 5 — Frontend: Add a Selector Tile

Open `frontend/src/components/ModalitySelector.tsx` and add your modality to the list of displayed options. The component reads from `modalityRegistry`, so in many cases the tile appears automatically. Check the component's implementation and add an entry if it uses a hardcoded list.

---

## Checklist

- [ ] `backend/context/mymodality/manifest.yaml` — created
- [ ] Tutorial `.md` files with language reference
- [ ] Example `.md` files with 6–12 seed programs
- [ ] `_MODALITY_PROMPTS["mymodality"]` entry in `llm.py`
- [ ] `MOCK_SEEDS["mymodality"]` and `MOCK_POOLS["mymodality"]` in `llm.py`
- [ ] `frontend/src/modalities/mymodality/index.ts` — implements `ModalityPlugin`
- [ ] Registered in `frontend/src/modalityRegistry.ts`
- [ ] Tile visible in `ModalitySelector`

---

## Tips

- **Context quality > prompt engineering.** Well-written example `.md` files produce dramatically better LLM output than tweaking prompt wording.
- **Test in mock mode first.** Set `ANTHROPIC_API_KEY` blank and confirm the full UI flow works with mock programs before testing with real LLM output.
- **Keep render() idempotent.** `ProgramCard` may call `render()` again if the card re-mounts. Always clean up previous state in your cleanup function.
- **One WebGL context per canvas.** If your modality uses WebGL, never share a context between cards — browsers handle this poorly.
- **Shader plugin as reference.** `frontend/src/modalities/shader/index.ts` is the most complex existing plugin and a good reference for managing Canvas/WebGL lifecycle.
