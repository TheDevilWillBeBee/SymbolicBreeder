# SVG Runtime Contract

This file defines the non-negotiable contract for generated SVGs in this system.
Every other context file assumes these rules.

## Output Contract

Write standalone inline SVG markup. Each output must be a single `<svg>` element with all content nested inside.

Required root attributes:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
```

- Always include `xmlns="http://www.w3.org/2000/svg"`
- Always include a `viewBox` attribute — this defines the coordinate system
- Do **not** set fixed `width`/`height` on the root `<svg>` — the renderer scales it to fit
- Prefer `viewBox="0 0 200 200"` as the default canvas unless the composition needs a different aspect ratio

## Structural Rules

- Output ONLY valid SVG markup wrapped in ```svg fences
- One SVG composition per code block
- Each code block must be a complete, self-contained `<svg>` element
- Do not use `<script>` tags or JavaScript — they will be stripped
- Do not use event handler attributes (`onclick`, `onload`, `onmouseover`, etc.) — they will be stripped
- Do not reference external resources (images, fonts via URL, linked stylesheets)
- Do not use `<foreignObject>` — keep everything in native SVG elements
- Do not output explanations, bullets, comments about lineage, or prose outside code blocks

## Allowed Elements

Structural: `<svg>`, `<g>`, `<defs>`, `<symbol>`, `<use>`

Shapes: `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<polyline>`, `<polygon>`, `<path>`

Text: `<text>`, `<tspan>`, `<textPath>`

Paint: `<linearGradient>`, `<radialGradient>`, `<stop>`, `<pattern>`

Clipping/Masking: `<clipPath>`, `<mask>`

Filters: `<filter>` and all `fe*` primitives

Animation: `<animate>`, `<animateTransform>`, `<animateMotion>`, `<set>`

Styling: `<style>` (inline CSS only, no @import)

## Coordinate Mindset

Think in viewBox coordinates. The viewBox defines an abstract canvas:
- `viewBox="0 0 200 200"` gives a 200×200 unit square
- Place elements using these coordinates
- The renderer handles scaling to any display size

Center of a 200×200 canvas is `(100, 100)`.

## Color and Style

- Use `fill` and `stroke` attributes or CSS properties
- Hex colors (`#ff6600`), named colors (`coral`), `rgb()`, `hsl()` are all valid
- Use `opacity`, `fill-opacity`, `stroke-opacity` for transparency
- Use `stroke-width`, `stroke-linecap`, `stroke-linejoin` for line quality

## Composition Style

Build SVGs with clear visual intent:
1. Choose a canvas size and coordinate system
2. Establish a visual hierarchy (foreground, midground, background)
3. Use grouping (`<g>`) to organize related elements
4. Apply transforms at the group level for clean composition
5. Use `<defs>` for reusable definitions (gradients, patterns, filters, symbols)
6. Keep the element count reasonable — prefer elegant geometry over brute-force repetition

## Practical Guardrails

- Close all tags properly — SVG is XML
- Quote all attribute values
- Use `transform` attribute for positioning and rotation, not absolute coordinates when possible
- Test mental model: will this look intentional at any size?
- Avoid overlapping text without clear visual purpose
- Alpha/opacity should be intentional, not accidental
