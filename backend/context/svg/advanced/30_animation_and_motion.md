# Animation and Motion

## SMIL Animation — `<animate>`

The `<animate>` element animates a single attribute over time:

- `attributeName` — which attribute to animate (e.g., `r`, `cx`, `opacity`, `fill`)
- `from`, `to` — start and end values
- `values` — semicolon-separated keyframe list (overrides from/to)
- `dur` — duration (e.g., `2s`, `500ms`)
- `repeatCount` — number of repetitions; `indefinite` for forever
- `fill` — `freeze` holds final value; `remove` (default) resets

Place `<animate>` as a child of the element to animate.

## `<animateTransform>`

Animates the `transform` attribute:

- `type` — which transform: `translate`, `rotate`, `scale`, `skewX`, `skewY`
- Rotation: `from="0 cx cy"` `to="360 cx cy"` spins around a point
- Scale: `from="1"` `to="1.5"` creates a pulsing effect
- Same timing attributes as `<animate>`
- `additive="sum"` allows combining with existing transforms

## `<animateMotion>`

Moves an element along a path:

- `path` attribute takes SVG path data (same `d` syntax as `<path>`)
- `dur`, `repeatCount` work the same
- `rotate="auto"` orients the element tangent to the path
- `rotate="auto-reverse"` faces backwards along the path
- Useful for orbiting, following curves, tracing outlines

## CSS Animation in SVG

`@keyframes` work inside `<style>` blocks in SVG:

- Target SVG properties: `transform`, `opacity`, `fill`, `stroke`, `stroke-dashoffset`
- CSS `transform-origin` controls rotation/scale center
- `animation-timing-function` for easing: `ease-in-out`, `linear`, `cubic-bezier()`
- `animation-iteration-count: infinite` for looping
- `animation-delay` for staggered effects

**CSS vs SMIL trade-offs**: CSS animations are more familiar and support easing functions naturally. SMIL can animate SVG-specific attributes (like path `d` data) that CSS cannot. Both work with inline SVG rendering.

## Timing and Sequencing

**Staggered animations**: Apply increasing `animation-delay` or SMIL `begin` values to create cascading effects. Elements appearing one after another creates rhythm.

**Synchronized timing**: Use matching `dur` values across related elements. A rotation and a color change at the same speed feel connected.

**Phase offsets**: Same animation, different starting points. Creates wave-like motion across repeated elements.

## Morphing Techniques

**Stroke dash animation**: Set `stroke-dasharray` equal to path length, animate `stroke-dashoffset` from full length to 0. Creates a "drawing" effect.

**Attribute interpolation**: SMIL `<animate>` can interpolate between color values, positions, sizes. Use `values` with multiple keyframes for complex motion.

**Transform sequences**: Chain multiple `<animateTransform>` with `additive="sum"` and different timings for complex compound motion (e.g., orbit + spin + scale).

## Motion Design Principles

- **Purpose**: Animation should reinforce the design's message, not distract
- **Subtlety**: Small, slow movements often read better than fast, large ones
- **Hierarchy**: The most important element can have the most prominent animation
- **Rhythm**: Repeating animations create visual rhythm — vary the tempo across elements
- **Rest**: Not everything needs to move — static elements provide anchoring contrast
