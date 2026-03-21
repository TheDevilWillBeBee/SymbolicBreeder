# Shapes, Structure, and Transforms

## Basic Shape Elements

SVG provides six primitive shape elements. Each has geometry attributes that define its form.

**Rectangle**: `x`, `y`, `width`, `height`, optional `rx`/`ry` for rounded corners.

**Circle**: `cx`, `cy`, `r` — center position and radius.

**Ellipse**: `cx`, `cy`, `rx`, `ry` — center position and two radii.

**Line**: `x1`, `y1`, `x2`, `y2` — start and end points. Lines have no fill, only stroke.

**Polyline**: `points` — a sequence of x,y pairs. Open shape (not auto-closed).

**Polygon**: `points` — same as polyline but the path is automatically closed.

## The viewBox

The `viewBox` attribute defines the internal coordinate system: `viewBox="minX minY width height"`.

- It decouples the SVG's coordinate space from its display size
- An SVG with `viewBox="0 0 100 100"` treats the canvas as 100×100 units regardless of pixel size
- Use `preserveAspectRatio` to control scaling behavior — default `xMidYMid meet` centers and preserves aspect ratio

## Grouping with `<g>`

The `<g>` element groups child elements. It has no visual output of its own but:
- Applies `transform`, `fill`, `stroke`, `opacity` to all children
- Creates logical structure (a "wing", a "face", a "border")
- Enables moving or transforming complex shapes as a unit

## Transforms

The `transform` attribute applies geometric transformations:

- `translate(tx, ty)` — move in x and y
- `rotate(angle)` — rotate around the origin; `rotate(angle, cx, cy)` rotates around a point
- `scale(sx, sy)` — scale; uniform with one value, non-uniform with two
- `skewX(angle)`, `skewY(angle)` — shear

Transforms compose left-to-right: `transform="translate(100,100) rotate(45) scale(0.5)"` first scales, then rotates, then translates (applied in reverse order to the geometry).

## Fill and Stroke

Every shape can have `fill` (interior color) and `stroke` (outline color):

- `fill="none"` makes the shape transparent inside
- `stroke="none"` removes the outline (default for most elements)
- `stroke-width` controls outline thickness
- `stroke-linecap`: `butt`, `round`, `square` — how line ends look
- `stroke-linejoin`: `miter`, `round`, `bevel` — how corners join
- `stroke-dasharray` creates dashed/dotted lines — values define dash and gap lengths

## Text Basics

The `<text>` element renders text at a position:

- `x`, `y` set the baseline position
- `font-family`, `font-size`, `font-weight` control typography
- `text-anchor`: `start`, `middle`, `end` — horizontal alignment relative to x
- `dominant-baseline`: `auto`, `middle`, `hanging` — vertical alignment
- `<tspan>` allows inline spans with different styling within a `<text>`

## The `<defs>` Element

`<defs>` holds reusable definitions that are not rendered directly:
- Gradients, patterns, filters, clip paths, masks, symbols
- Referenced via `id` and used with `url(#id)` or `xlink:href="#id"`
- Keeps the SVG organized: define once, use many times

## The `<path>` Element — Basics

`<path>` is the most versatile shape element. Its `d` attribute contains drawing commands:

- `M x y` — move to (start a new subpath)
- `L x y` — line to
- `H x` — horizontal line to
- `V y` — vertical line to
- `Z` — close path (line back to start)

Lowercase versions (`m`, `l`, `h`, `v`) use relative coordinates.

These basic commands can create any polygon or line figure. Curves (bezier, arc) are covered at intermediate level.
