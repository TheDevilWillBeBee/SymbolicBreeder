# Shader Runtime Contract and Core Notation

This file defines the non-negotiable contract for generated shaders in this system.
Every other context file assumes these rules.

## Output Contract

Write fragment shader code using the `mainImage` convention and optional helper functions above it.

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord)
```

Allowed uniforms:

```glsl
uniform vec2  iResolution;
uniform float iTime;
```

Buffer mode only:

```glsl
uniform sampler2D iChannel0;
uniform int iFrame;
```

Do **not** declare custom uniforms, attributes, varyings, textures, or extra channels.
Do **not** write your own `main()` function.
Do **not** depend on images or external meshes.
Alpha should end as `1.0`.

## Write Small Helpers, Then Compose Them

The preferred style is helper functions plus a clear `mainImage`.
Tiny helpers are strongly encouraged.

```glsl
float saturate(float x) { return clamp(x, 0.0, 1.0); }

float remap(float x, float a, float b, float c, float d) {
    return mix(c, d, (x - a) / (b - a));
}
```

```glsl
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}
```

## Core Coordinate Spaces

Screen UV in the 0–1 range:

```glsl
vec2 uv = fragCoord / iResolution.xy;
```

Centered, aspect-correct coordinates for most visual design:

```glsl
vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
```

Pixel size in normalized UV coordinates:

```glsl
vec2 px = 1.0 / iResolution.xy;
```

Polar coordinates:

```glsl
float r = length(p);
float a = atan(p.y, p.x);
```

## Scalar-Field Mindset

Think in scalar fields first, color second.
Many shaders become easier when you first compute masks, distances, densities, IDs, or light terms.

Distance-to-shape style field:

```glsl
float d = length(p) - 0.35;
```

Soft mask from a field:

```glsl
float mask = smoothstep(0.01, -0.01, d);
```

Thin outline from a field:

```glsl
float outline = 1.0 - smoothstep(0.0, 0.01, abs(d));
```

## Anti-Aliased Thresholding

Hard `step()` is sometimes useful, but edge quality often improves with derivatives.

```glsl
float aaStep(float threshold, float value) {
    float w = fwidth(value);
    return smoothstep(threshold - w, threshold + w, value);
}
```

Anti-aliased line or band around zero:

```glsl
float aaBand(float value, float halfWidth) {
    float w = fwidth(value);
    return 1.0 - smoothstep(halfWidth - w, halfWidth + w, abs(value));
}
```

## Minimal Hash and Palette Building Blocks

Compact pseudo-random scalar:

```glsl
float hash11(float x) {
    return fract(sin(x * 127.1) * 43758.5453123);
}
```

Compact 2D hash:

```glsl
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
```

Cosine palette:

```glsl
vec3 palette(float t) {
    return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}
```

## Layering Rules

Use masks and light terms to decide how layers interact.

Soft interpolation:

```glsl
vec3 col = mix(bg, fg, mask);
```

Add glow or emission:

```glsl
col += glowColor * glowAmount;
```

Accumulate brightest contribution:

```glsl
col = max(col, newLayer);
```

Tone control after accumulation:

```glsl
col = tanh(col);
```

## Buffer Contract

Use buffer mode only when the next frame depends on the previous frame.
That usually means trails, reaction-diffusion, automata, advection, decay, or accumulation.

Read the previous frame in normalized UV space:

```glsl
vec2 uv = fragCoord / iResolution.xy;
vec4 prev = texture(iChannel0, uv);
```

Initialize non-trivial state inline:

```glsl
if (iFrame == 0) {
    float seed = hash21(fragCoord);
    fragColor = vec4(seed, 0.0, 0.0, 1.0);
    return;
}
```

Neighbor sampling pattern:

```glsl
vec2 px = 1.0 / iResolution.xy;
float sum = 0.0;
for (int j = -1; j <= 1; ++j) {
    for (int i = -1; i <= 1; ++i) {
        if (i == 0 && j == 0) continue;
        sum += texture(iChannel0, uv + vec2(float(i), float(j)) * px).r;
    }
}
```

## Practical Guardrails

Use decimal points in float literals:

```glsl
float k = 1.0;
```

Avoid unstable divisions:

```glsl
float inv = 1.0 / max(x, 1e-4);
```

Clamp physically meaningful terms:

```glsl
float ndl = max(dot(n, l), 0.0);
```

## Preferred Mental Stack

1. choose a coordinate space  
2. build one or more scalar fields  
3. shape or threshold those fields  
4. animate the domain, not just the color  
5. light or color the result  
6. finish with contrast and tone control  
7. only use buffers if memory is essential
