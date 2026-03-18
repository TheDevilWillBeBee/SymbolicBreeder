# Simple Context — Color, Motion, and Composition

This level focuses on finishing.
Many shaders fail not because the geometry is weak, but because color, contrast, and timing are weak.

## 1) Palette Snippets

Classic cosine palette:

```glsl
vec3 palette(float t) {
    return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}
```

Two-color gradient with shaped blend:

```glsl
vec3 ramp(float t, vec3 a, vec3 b) {
    t = smoothstep(0.0, 1.0, t);
    return mix(a, b, t);
}
```

Tri-band color split:

```glsl
vec3 triRamp(float t, vec3 a, vec3 b, vec3 c) {
    return (t < 0.5)
        ? mix(a, b, smoothstep(0.0, 0.5, t))
        : mix(b, c, smoothstep(0.5, 1.0, t));
}
```

Palette from angle or distance:

```glsl
vec3 col = palette(0.2 * a / 3.14159 + 0.1 * r + 0.05 * iTime);
```

## 2) Contrast and Tone

Sharpen a mask:

```glsl
m = pow(m, 0.7);
```

Soften a harsh signal:

```glsl
m = smoothstep(0.2, 0.8, m);
```

Posterize:

```glsl
vec3 posterize(vec3 c, float steps) {
    return floor(c * steps) / steps;
}
```

Soft highlight compression:

```glsl
col = tanh(col * 1.2);
```

Darken toward the edges:

```glsl
col *= smoothstep(1.0, 0.15, length(p));
```

## 3) Useful Color Relationships

Warm against cool:

```glsl
vec3 warm = vec3(1.0, 0.55, 0.2);
vec3 cool = vec3(0.1, 0.45, 1.0);
```

Background and accent separation:

```glsl
vec3 bg = vec3(0.02, 0.03, 0.05);
vec3 accent = palette(signal);
vec3 col = mix(bg, accent, mask);
```

Emission on top of a dark base:

```glsl
col = base * 0.2 + emission * 1.4;
col = tanh(col);
```

## 4) Motion Should Have Hierarchy

Primary motion defines the piece:

```glsl
float primary = iTime * 0.3;
```

Secondary motion adds life:

```glsl
float secondary = 0.2 * sin(iTime * 1.7);
```

Tertiary motion adds micro-variation:

```glsl
float tertiary = 0.03 * sin(iTime * 7.0 + r * 12.0);
```

Do not animate every parameter equally.
Usually one dominant motion and one or two weaker modulations are enough.

## 5) Simple Fake Depth

Radial light cue:

```glsl
float light = smoothstep(0.8, 0.0, length(p - lightPos));
```

Lambert-like cue from a 2D normal estimate:

```glsl
vec2 g = vec2(dFdx(height), dFdy(height));
vec3 n = normalize(vec3(-g, 1.0));
float ndl = max(dot(n, normalize(vec3(0.4, 0.5, 0.8))), 0.0);
```

Rim-like emphasis:

```glsl
float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
```

## 6) Composition Tricks

Keep a focal region cleaner than the periphery:

```glsl
float focal = smoothstep(0.8, 0.0, length(p - focalPos));
detail *= mix(0.4, 1.0, focal);
```

Use empty space intentionally:

```glsl
float sparse = smoothstep(0.15, 0.5, abs(p.x));
```

Separate foreground from background with different frequency bands:

```glsl
float fg = sin(p.x * 25.0);
float bg = sin(p.x * 4.0);
```

## 7) Small Finishing Recipes

Soft halo around a feature:

```glsl
float halo = exp(-12.0 * abs(d));
```

Color edge independent of fill:

```glsl
vec3 col = fill * bodyColor + edge * edgeColor;
```

Pulse an emission channel without changing silhouette:

```glsl
float beat = 0.7 + 0.3 * sin(iTime * 2.0);
col += beat * glowColor * glow;
```

Use angle for hue and radius for value:

```glsl
vec3 col = palette(0.1 * a + 0.4);
col *= smoothstep(0.9, 0.1, r);
```

## 8) When to Stop

Good simple shaders usually stop when:
- one spatial idea is clear
- one motion idea is clear
- color supports the form
- the frame reads well at a glance

Do not add noise or complexity just because it is available.
Simple context is strongest when the shader feels deliberate, readable, and alive.
