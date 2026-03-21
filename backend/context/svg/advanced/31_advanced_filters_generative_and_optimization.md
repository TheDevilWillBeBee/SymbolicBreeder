# Advanced Filters, Generative Techniques, and Optimization

## Advanced Filter Primitives

**`feTurbulence`**: Generates Perlin or fractal noise:
- `type="turbulence"` or `type="fractalNoise"`
- `baseFrequency` controls scale (lower = larger features)
- `numOctaves` adds detail layers
- `seed` changes the random pattern
- Output is a noise texture — useful as input to other filters

**`feDisplacementMap`**: Distorts one image using another as a displacement field:
- `in` — the image to distort
- `in2` — the displacement map (often feTurbulence output)
- `scale` — distortion strength
- `xChannelSelector`, `yChannelSelector` — which color channel drives x/y displacement
- Creates organic, warped, fluid effects

**`feBlend`**: Blends two inputs using standard blend modes:
- `mode`: `normal`, `multiply`, `screen`, `darken`, `lighten`, `overlay`
- Combines layers with photographic-style blending

**`feComposite`**: Combines two inputs using set operations:
- `operator`: `over`, `in`, `out`, `atop`, `xor`, `arithmetic`
- `arithmetic` mode with `k1`–`k4` coefficients allows custom blending formulas
- Essential for masking, cutouts, and precise layer composition

**`feColorMatrix`**: Transforms colors via a matrix:
- `type="saturate"` with `values` — desaturation
- `type="hueRotate"` — shift all hues
- `type="matrix"` — full 5×4 color transformation matrix

**`feMorphology`**: Erodes or dilates shapes:
- `operator="erode"` or `"dilate"`
- `radius` controls the amount
- Useful for creating outlines, thickening/thinning strokes

## Complex Filter Chains

Chain primitives to create rich effects:
- Turbulence → displacement → blur = organic glow
- Source alpha → morphology (dilate) → flood → composite = colored outline
- Turbulence → color matrix → blend with source = textured surface

Each step feeds into the next via `result`/`in` naming. Think of it as a node graph.

## Generative Techniques

**Mathematical patterns**: SVG elements can be placed algorithmically. When the LLM generates SVG, it can compute positions, sizes, and colors based on mathematical relationships:
- Polar placement: elements at `(r·cos(θ), r·sin(θ))` for circular arrangements
- Fibonacci spirals: golden angle spacing for organic distributions
- Recursive subdivision: halving/thirding spaces for fractal-like layouts

**Tessellation**: Fill a region with interlocking shapes using `<pattern>` with careful tile design. Hexagonal, triangular, or custom tile shapes.

**Parametric variation**: Repeated elements with systematically varying attributes (size, hue, rotation) create gradients of form.

## Nested SVGs

An `<svg>` element can contain another `<svg>`:
- The inner SVG has its own `viewBox` and coordinate system
- Acts as a viewport/window into a sub-composition
- Useful for embedding complex sub-graphics at specific positions
- `overflow="hidden"` on inner SVG clips to its bounds

## Blend Modes in SVG

The `mix-blend-mode` CSS property (or `style` attribute) controls how an element blends with what's beneath it:
- Same modes as CSS: `multiply`, `screen`, `overlay`, `difference`, etc.
- `isolation: isolate` on a group prevents blending from leaking outside
- Combine with opacity for subtle color interaction effects

## Optimization

- Minimize element count — prefer one clever `<path>` over many `<rect>` elements
- Reuse with `<symbol>` and `<use>` instead of duplicating geometry
- Simplify paths — fewer control points, smoother curves
- Limit filter complexity — each filter primitive adds rendering cost
- Avoid deeply nested groups when flat structure works
- Remove unused `<defs>` entries

## Accessibility Considerations

- Add `<title>` as the first child of `<svg>` for a text description
- Add `role="img"` on the root `<svg>` element
- Use `aria-label` for brief descriptions
- Ensure sufficient color contrast for important visual elements
- Don't rely solely on color to convey meaning
