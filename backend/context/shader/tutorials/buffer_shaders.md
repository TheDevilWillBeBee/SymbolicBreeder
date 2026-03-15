# Ping-Pong Buffer Shaders

## Overview

Some effects need memory — they depend on the previous frame's output. Examples include:
- Cellular automata (Game of Life, Langton's ant)
- Reaction-diffusion systems (Gray-Scott, Belousov-Zhabotinsky)
- Fluid simulations
- Trail and fade effects
- Accumulation buffers

These are called **buffer shaders** or **ping-pong shaders** because they alternate between two textures: reading from one, writing to the other, then swapping.

## When to Use Buffers

**Use buffers when:** the effect genuinely needs the previous frame's pixels to compute the next frame (neighbor sampling, decay, accumulation).

**Do NOT use buffers when:** the effect can be computed from `iTime` and `fragCoord` alone. Most effects (noise, FBM, SDF, raymarching, fractals, domain warping) are memoryless and do not need buffers.

## Available Uniforms (Buffer Mode)

When your code uses `iChannel0`, these additional uniforms are automatically available:

```glsl
uniform sampler2D iChannel0;  // Previous frame's output texture
uniform int iFrame;              // Frame counter (starts at 0)
```

The standard uniforms `iResolution` and `iTime` are also available as usual.

## Reading the Previous Frame

Use `texture(iChannel0, uv)` where `uv` is in **0-1 normalized** coordinates:

```glsl
vec2 uv = fragCoord / iResolution.xy;  // 0-1 range
vec4 prev = texture(iChannel0, uv);
```

**IMPORTANT:** Always use `fragCoord / iResolution.xy` for texture lookups, NOT centered coordinates like `(fragCoord - 0.5 * iResolution.xy) / iResolution.y`. Texture coordinates must be in the 0-1 range.

## Buffer Initialization

Buffers start as black (`vec4(0.0)`). For effects that need non-trivial initial state (random seeds, placed patterns), use `iFrame == 0` at the top of `mainImage`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    if (iFrame == 0) {
        // Initialization: seed random state, place patterns, etc.
        fragColor = vec4(hash(fragCoord), 0.0, 0.0, 1.0);
        return;
    }
    // Normal simulation step using iChannel0
    vec4 prev = texture(iChannel0, uv);
    // ...
}
```

All initialization must be inline in `mainImage` — do **not** define a separate `initImage` function.

## Common Pattern: Neighbor Sampling

For cellular automata and diffusion, sample the 8 neighbors:

```glsl
vec2 px = 1.0 / iResolution.xy;  // pixel size in UV space
vec2 uv = fragCoord / iResolution.xy;

// Sample all 8 neighbors
float sum = 0.0;
for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
        if (x == 0 && y == 0) continue;
        sum += texture(iChannel0, uv + vec2(float(x), float(y)) * px).r;
    }
}
```

## Common Pattern: Decay / Trails

Read the previous frame and multiply by a factor slightly less than 1.0:

```glsl
vec3 prev = texture(iChannel0, uv).rgb * 0.97;  // 3% decay per frame
vec3 newContent = /* draw something */;
fragColor = vec4(max(prev, newContent), 1.0);
```

## Common Pattern: Laplacian (for Diffusion)

Compute a discrete Laplacian using the 4 cardinal neighbors:

```glsl
vec2 px = 1.0 / iResolution.xy;
vec2 uv = fragCoord / iResolution.xy;
vec4 c  = texture(iChannel0, uv);
vec4 n  = texture(iChannel0, uv + vec2(0.0, px.y));
vec4 s  = texture(iChannel0, uv - vec2(0.0, px.y));
vec4 e  = texture(iChannel0, uv + vec2(px.x, 0.0));
vec4 w  = texture(iChannel0, uv - vec2(px.x, 0.0));
vec4 laplacian = (n + s + e + w) - 4.0 * c;
```

## Pitfalls

1. **Wrong UV coordinates:** `texture(iChannel0, uv)` requires `uv` in 0-1 range. Using centered/aspect-corrected coordinates will produce wrong results.
2. **Forgetting initialization:** Without `iFrame == 0` handling, the buffer starts black. For effects that need non-trivial initial state (like seeded cells), add an `if (iFrame == 0)` block at the top of `mainImage`.
3. **Precision:** Buffer textures use 8 bits per channel. For effects that accumulate small changes, values may quantize. Keep state values in a reasonable range (0-1).
