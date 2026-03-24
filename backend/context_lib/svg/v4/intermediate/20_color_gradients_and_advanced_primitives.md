# Color, Gradients, and Advanced Primitives

## Color Theory for SVG

**Color harmony approaches**:
- Complementary: colors opposite on the color wheel — high contrast
- Analogous: neighboring colors — harmonious, low tension
- Triadic: three evenly spaced colors — vibrant, balanced
- Monochromatic: one hue at varying lightness/saturation — cohesive

**HSL thinking**: `hsl(hue, saturation%, lightness%)` is more intuitive than hex for color manipulation. Shift hue for variety, adjust saturation for emphasis, adjust lightness for depth.

## Linear Gradients

Defined in `<defs>`, referenced via `fill="url(#id)"`:

- `x1`, `y1`, `x2`, `y2` define the gradient line direction (default left-to-right)
- `<stop>` elements define color transitions with `offset` (0–1 or 0%–100%) and `stop-color`
- `stop-opacity` controls per-stop transparency
- `gradientUnits="userSpaceOnUse"` uses viewBox coordinates instead of bounding-box-relative
- `gradientTransform` applies transforms to the gradient coordinate system

## Radial Gradients

- `cx`, `cy`, `r` define the outer circle
- `fx`, `fy` define the focal point (where the gradient appears to radiate from)
- Off-center focal points create directional lighting effects
- Same `<stop>` system as linear gradients

## Opacity Techniques

- `opacity` on any element affects the entire element including children
- `fill-opacity` and `stroke-opacity` affect only the fill or stroke
- Layering semi-transparent shapes creates depth and color mixing
- Use opacity for subtle backgrounds, shadows, and atmospheric effects

## Advanced Path Commands

Beyond basic `M`, `L`, `Z`, the `<path>` element supports curves:

**Cubic Bezier**: `C x1 y1, x2 y2, x y` — two control points and an endpoint. Creates smooth, expressive curves. `S` provides a smooth continuation.

**Quadratic Bezier**: `Q x1 y1, x y` — one control point. Simpler curves. `T` provides smooth continuation.

**Arc**: `A rx ry rotation large-arc-flag sweep-flag x y` — draws elliptical arcs. Useful for circular segments, pie shapes, rounded connectors.

Curves are the foundation of organic, flowing shapes. Combine straight segments and curves for character.

## ClipPath

`<clipPath>` restricts the visible area of an element to a shape:

- Define a shape inside `<clipPath>` in `<defs>`
- Apply with `clip-path="url(#id)"`
- The clip shape acts as a window — only the intersection is visible
- Useful for circular frames, shaped containers, reveal effects

## Masks

`<mask>` provides soft, gradient-based visibility control:

- White areas in the mask are fully visible; black areas are hidden; gray is partial
- Unlike clipPath, masks can have smooth gradients for fade effects
- Apply with `mask="url(#id)"`
- Powerful for vignettes, soft edges, spotlight effects

## Patterns

`<pattern>` creates repeating tile fills:

- Define a small tile in `<defs>` with `width`, `height`, and `patternUnits`
- `patternUnits="userSpaceOnUse"` tiles in viewBox coordinates
- The pattern content is any SVG elements
- Use for textures, grids, hatching, decorative backgrounds
- `patternTransform` rotates or scales the tile grid
