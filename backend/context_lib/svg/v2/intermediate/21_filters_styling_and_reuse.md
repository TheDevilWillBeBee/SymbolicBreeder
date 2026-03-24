# Filters, Styling, and Reuse

## SVG Filters — Basics

Filters apply pixel-level effects to SVG elements. Defined in `<defs>` with `<filter>`, applied with `filter="url(#id)"`.

**Key filter primitives**:

- `feGaussianBlur` — blurs the input. `stdDeviation` controls blur radius. Use for shadows, glows, soft backgrounds.
- `feOffset` — shifts the input by `dx`, `dy`. Combined with blur, creates drop shadows.
- `feFlood` — fills a region with a solid color. Used as input for composite operations.
- `feMerge` — layers multiple filter results. Each `feMergeNode` references a result by name.

**The filter pipeline**: Each `fe*` element takes an `in` input and produces a `result` output. Chain them by referencing previous results:
- `in="SourceGraphic"` — the original element
- `in="SourceAlpha"` — the alpha channel of the original
- Custom names via `result="myBlur"` and `in="myBlur"`

**Drop shadow pattern**: Offset the source alpha, blur it, flood with shadow color, composite, then merge with original.

**Glow pattern**: Blur the source graphic, then merge the blurred version behind the original.

## Inline CSS with `<style>`

CSS can be embedded inside SVG in a `<style>` element:

- Place `<style>` inside `<defs>` or as a direct child of `<svg>`
- Target elements by class, ID, or element type
- CSS properties map to SVG attributes: `fill`, `stroke`, `opacity`, `font-family`, etc.
- Pseudo-classes like `:nth-child()` work for pattern-based styling
- CSS custom properties (`--var`) work inside SVG for theming

**When to use CSS vs attributes**: CSS is better for styling many elements consistently. Attributes are better for one-off positioning and geometry.

## `<symbol>` and `<use>` for Reuse

`<symbol>` defines a reusable graphic template:
- Has its own `viewBox` — content scales independently
- Not rendered until referenced by `<use>`
- Like a component or stamp

`<use>` instantiates a symbol or any element with an `id`:
- `href="#symbolId"` references the template
- `x`, `y`, `width`, `height` position and size the instance
- Each instance can have its own transform
- Cascading styles (fill, stroke) can be overridden on the `<use>` element for simple color variations

**Reuse pattern**: Define a motif once in `<defs>`, stamp it at multiple positions with different transforms. This keeps file size small and composition consistent.

## Combining Techniques

Strong intermediate SVG compositions combine these tools:

- Gradient fills + clip paths = shaped color transitions
- Patterns + masks = textured areas with soft boundaries
- Filters + groups = entire layers with shadow or glow
- Symbols + transforms = repeated motifs with variation

The key is restraint: each technique should serve the composition's intent, not demonstrate capability.
