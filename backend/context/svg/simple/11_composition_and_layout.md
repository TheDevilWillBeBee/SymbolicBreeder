# Composition and Layout

## Visual Hierarchy

Every strong SVG composition has a clear hierarchy:

- **Primary element**: The main subject — largest, most contrasted, most central
- **Secondary elements**: Supporting shapes that frame or complement the primary
- **Background/negative space**: The empty or subtle areas that give the composition room to breathe

Techniques for establishing hierarchy:
- Size contrast — make the focal element significantly larger
- Color contrast — use the strongest or most saturated color for the focal point
- Position — place the focal element at or near the center (or at a deliberate off-center position)
- Detail density — the focal area can have more detail than the surrounding areas

## Spatial Arrangement

**Centering**: On a `viewBox="0 0 200 200"` canvas, the center is `(100, 100)`. Use `transform="translate(100,100)"` on a group, then position children relative to `(0,0)`.

**Symmetry types**:
- Bilateral: mirror across one axis (left/right or top/bottom)
- Radial: rotate copies around a center point
- Asymmetric: deliberate imbalance with visual weight distributed intentionally

**Grid and modular layout**: Divide the canvas into a grid for structured placement. Consistent spacing creates rhythm.

**Overlap and layering**: Later elements in SVG source render on top. Use this for depth — background elements first, foreground last.

## Whitespace and Breathing Room

- Don't fill every pixel — negative space is a design element
- Leave margins between the composition and the viewBox edges
- Space between elements creates visual grouping (Gestalt proximity principle)
- Tight spacing = related; loose spacing = separate

## Alignment Techniques

Without a layout engine, alignment is manual:
- Use consistent x or y values for aligned rows/columns
- Use `text-anchor="middle"` for horizontally centered text
- Use `transform="translate(cx, cy)"` to center groups
- Compute positions arithmetically: evenly spaced items at `x = start + i * step`

## Typography in Logo Design

Text in SVG logos follows different rules than body text:
- Choose `font-family` carefully — sans-serif families are safest for cross-platform rendering
- `font-weight` contrast (bold primary + light secondary) creates hierarchy
- Letter-spacing via `letter-spacing` attribute controls density
- Text can follow a path with `<textPath>` for curved or shaped text
- Consider converting critical text to paths for guaranteed rendering (but this adds complexity)

## Design Principles for Logo-Like SVGs

**Simplicity**: The best logos work at tiny sizes. Fewer elements with strong contrast.

**Distinctiveness**: A unique silhouette is more memorable than intricate detail.

**Balance**: Visual weight should feel distributed intentionally, whether symmetric or asymmetric.

**Scalability**: Since SVG is vector, the design works at any size — but test the mental model: would this read clearly as a favicon?

**Color restraint**: Strong logos often use 2–4 colors maximum. A monochrome version should still work.

## Layering Order

SVG renders in document order — earlier elements are behind later ones:
1. Background shapes or fills
2. Secondary/decorative elements
3. Primary subject
4. Foreground accents, text, or overlays

Use `<g>` groups to organize these layers logically.
