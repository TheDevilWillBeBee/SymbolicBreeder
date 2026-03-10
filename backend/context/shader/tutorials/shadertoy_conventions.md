# Shadertoy Conventions

## mainImage Function

Every shader program consists of a single function:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord)
```

- `fragCoord` — pixel coordinates (0,0 is bottom-left, iResolution is top-right)
- `fragColor` — output color as RGBA (set this to your desired pixel color)

## Coordinate Systems

### Screen UV (0 to 1)
```glsl
vec2 uv = fragCoord / iResolution.xy;
// uv.x: 0 (left) to 1 (right)
// uv.y: 0 (bottom) to 1 (top)
```

### Centered UV (-0.5 to 0.5, aspect-corrected)
```glsl
vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
// Origin at screen center
// Aspect ratio preserved (circles are circular)
// Recommended for most visual effects
```

### Centered UV (no aspect correction)
```glsl
vec2 uv = fragCoord / iResolution.xy - 0.5;
```

## Available Uniforms

In this system, the following uniforms are pre-declared:

```glsl
uniform vec2  iResolution;  // Canvas width and height in pixels
uniform float uSin;         // sin(2π·t/5) — oscillates -1 to 1 over 5 seconds
uniform float uCos;         // cos(2π·t/5) — oscillates -1 to 1 over 5 seconds
```

- `iResolution` — use for normalizing coordinates
- `uSin` and `uCos` — use for smooth 5-second looping animation
- These are the ONLY available uniforms. Do NOT declare your own.
- Do NOT use `iTime`, `iMouse`, `iChannel0`, or other Shadertoy-specific uniforms.

## Output

Always write to `fragColor` with alpha = 1.0:
```glsl
fragColor = vec4(red, green, blue, 1.0);
```

Each color channel should be in the range 0.0 to 1.0.

## Minimal Example

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv.x, uv.y, 0.5 + 0.5 * uSin, 1.0);
}
```

This shows a gradient that shifts blue channel with the animation cycle.
