# Advanced Context — Feedback, Simulation, and Robustness

This level covers buffer-based shaders, advanced finishing, performance, and useful debug cues.
It is especially relevant for one-shot generation because the model should know what tends to stay stable.

## 1) Channel Packing as State Design

Treat channels as state slots.

Examples:
- `r` = density or occupancy
- `g` = trail / age / chemical B
- `b` = velocity helper / temperature / mask
- `a` = usually keep `1.0` unless alpha itself is state

Read current state:

```glsl
vec4 s = texture(iChannel0, uv);
```

Write new state:

```glsl
fragColor = vec4(newR, newG, newB, 1.0);
```

## 2) Decay and Accumulation

Fade previous content:

```glsl
vec3 prev = texture(iChannel0, uv).rgb * 0.985;
```

Add new impulse:

```glsl
vec3 outCol = max(prev, impulseColor * impulseMask);
```

Or additive with soft compression:

```glsl
vec3 outCol = prev + impulseColor * impulseMask;
outCol = tanh(outCol);
```

## 3) Stable Neighbor Sampling

Cardinal laplacian:

```glsl
vec4 c = texture(iChannel0, uv);
vec4 n = texture(iChannel0, uv + vec2(0.0, px.y));
vec4 s = texture(iChannel0, uv - vec2(0.0, px.y));
vec4 e = texture(iChannel0, uv + vec2(px.x, 0.0));
vec4 w = texture(iChannel0, uv - vec2(px.x, 0.0));
vec4 lap = (n + s + e + w) - 4.0 * c;
```

Weighted 8-neighbor version:

```glsl
vec2 o = px;
float sum = 0.0;
sum += 0.05 * texture(iChannel0, uv + vec2(-o.x, -o.y)).r;
sum += 0.20 * texture(iChannel0, uv + vec2( 0.0, -o.y)).r;
sum += 0.05 * texture(iChannel0, uv + vec2( o.x, -o.y)).r;
sum += 0.20 * texture(iChannel0, uv + vec2(-o.x,  0.0)).r;
sum += 0.20 * texture(iChannel0, uv + vec2( o.x,  0.0)).r;
sum += 0.05 * texture(iChannel0, uv + vec2(-o.x,  o.y)).r;
sum += 0.20 * texture(iChannel0, uv + vec2( 0.0,  o.y)).r;
sum += 0.05 * texture(iChannel0, uv + vec2( o.x,  o.y)).r;
```

## 4) Reaction-Diffusion Style Update

Generic two-channel reaction-diffusion step:

```glsl
vec2 ab = texture(iChannel0, uv).rg;
float A = ab.r;
float B = ab.g;
```

```glsl
float lapA = 0.0;
float lapB = 0.0;
/* fill lapA / lapB from weighted neighbor samples */
```

```glsl
float feed = 0.037;
float kill = 0.060;
float dA = 0.21;
float dB = 0.105;
float react = A * B * B;

float nextA = A + dA * lapA - react + feed * (1.0 - A);
float nextB = B + dB * lapB + react - (kill + feed) * B;

nextA = clamp(nextA, 0.0, 1.0);
nextB = clamp(nextB, 0.0, 1.0);
```

## 5) Advection and Flow-Like Motion

Offset sample by a procedural velocity:

```glsl
vec2 vel = 0.003 * vec2(
    sin(uv.y * 20.0 + iTime),
    cos(uv.x * 17.0 - 0.8 * iTime)
);
vec3 advected = texture(iChannel0, uv - vel).rgb;
```

Combine advection and decay:

```glsl
vec3 state = advected * 0.99;
```

## 6) Automata and Rule Variation

Binary occupancy from a channel:

```glsl
float alive = step(0.5, texture(iChannel0, uv).r);
```

Rule lookup through logic:

```glsl
float born = step(2.5, sum) * step(sum, 3.5);
float survive = alive * step(1.5, sum) * step(sum, 3.5);
float next = max(born * (1.0 - alive), survive);
```

Bitwise rule tricks can be used, but only if they clearly improve the idea.
Do not use bitwise features just because they exist.

## 7) Derivatives for Better Edges and Detail Control

Derivative-based line width:

```glsl
float line = 1.0 - smoothstep(w - fwidth(x), w + fwidth(x), abs(x));
```

Adaptive contour lines from a scalar field:

```glsl
float v = fieldValue * 12.0;
float contour = 1.0 - smoothstep(0.45, 0.5, abs(fract(v) - 0.5) / fwidth(v));
```

## 8) Dithering and Banding Reduction

Cheap per-pixel dither:

```glsl
float dither = (hash21(fragCoord) - 0.5) / 255.0;
col += dither;
```

Useful after heavy gradients, fog, or quantization.

## 9) Performance Triage

Prefer these reductions in order:
1. lower octave count
2. reduce ray steps
3. simplify shadows/AO
4. reduce warp nesting
5. evaluate expensive detail only near the focal subject

Gated detail by importance:

```glsl
float focus = smoothstep(1.2, 0.2, length(p));
detail *= focus;
```

Distance-based material simplification:

```glsl
float farFade = smoothstep(4.0, 20.0, t);
roughness = mix(roughness, 0.8, farFade);
```

## 10) Robustness Tips for One-Shot Generation

Guard denominators:

```glsl
float safeInv(float x) { return 1.0 / max(abs(x), 1e-4); }
```

Clamp accumulated terms:

```glsl
value = clamp(value, 0.0, 1.0);
```

Exit long loops early when contribution becomes negligible:

```glsl
if (trans < 0.01) break;
```

Prefer a few clear operators over a deeply tangled expression graph.

## 11) Minimal Debug Visualizations That Are Still Useful

Visualize a scalar field directly:

```glsl
vec3 debug = vec3(fieldValue);
```

Visualize normals:

```glsl
vec3 debug = 0.5 + 0.5 * n;
```

Visualize step count or travel distance:

```glsl
vec3 debug = palette(float(steps) / 64.0);
```

Visualize channel packing:

```glsl
vec3 debug = texture(iChannel0, uv).rgb;
```

These debug views are optional in generation context, but they help the model understand how to reason about fields and state.

## 12) When Buffers Are Worth It

Use buffers when:
- memory is the whole point
- accumulation changes the aesthetic fundamentally
- trails or simulation create the identity of the work

Avoid buffers when a memoryless field can do the job.
Stateful shaders are powerful but easier to destabilize under mutation.
