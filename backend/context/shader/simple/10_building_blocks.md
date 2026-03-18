# Simple Context — Building Blocks

This level teaches the smallest useful ideas that compose into many different shaders.
Use these snippets as atoms, not as full programs.

## 1) Shaping a Scalar

Threshold a value:

```glsl
float m = step(0.5, x);
```

Soft threshold:

```glsl
float m = smoothstep(0.3, 0.7, x);
```

Symmetric pulse around a center:

```glsl
float pulse(float x, float center, float width) {
    return 1.0 - smoothstep(width, width + fwidth(x), abs(x - center));
}
```

Triangle wave:

```glsl
float tri(float x) {
    return abs(fract(x) - 0.5) * 2.0;
}
```

Saw wave:

```glsl
float saw(float x) {
    return fract(x);
}
```

Rounded square-ish response:

```glsl
float softAbs(float x, float k) {
    return sqrt(x * x + k);
}
```

## 2) Coordinates Are the First Creative Decision

Translate:

```glsl
p -= vec2(0.2, -0.1);
```

Scale:

```glsl
p *= 2.0;
```

Rotate:

```glsl
p *= rot(0.4);
```

Animate the domain instead of the color:

```glsl
p *= rot(iTime * 0.3);
p += 0.1 * vec2(cos(iTime), sin(iTime * 1.3));
```

Mirror for bilateral symmetry:

```glsl
p.x = abs(p.x);
```

Mirror both axes for quadrant symmetry:

```glsl
p = abs(p);
```

Tile the plane:

```glsl
vec2 cell = fract(p * 4.0) - 0.5;
vec2 cellId = floor(p * 4.0);
```

## 3) Fundamental Shape Fields

Circle SDF:

```glsl
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}
```

Box SDF:

```glsl
float sdBox(vec2 p, vec2 b) {
    vec2 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
```

Segment distance:

```glsl
float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}
```

Ring from a radius:

```glsl
float ring(float r, float radius, float width) {
    return 1.0 - smoothstep(width, width + fwidth(r), abs(r - radius));
}
```

## 4) Turn Fields into Fill, Stroke, Glow

Fill from distance:

```glsl
float fill = smoothstep(0.0, -fwidth(d), d);
```

Stroke from absolute distance:

```glsl
float stroke = 1.0 - smoothstep(0.0, fwidth(d) + 0.003, abs(d) - 0.003);
```

Soft glow:

```glsl
float glow = 0.02 / (abs(d) + 0.02);
```

Use different channels for different roles:

```glsl
vec3 layer = fill * baseColor + stroke * edgeColor + glow * glowColor;
```

## 5) Simple Repetition and Patterning

Vertical stripes:

```glsl
float stripes = 0.5 + 0.5 * sin(p.x * 20.0);
```

Checker cells:

```glsl
vec2 g = floor(p * 8.0);
float checker = mod(g.x + g.y, 2.0);
```

Radial spokes:

```glsl
float spokes = 0.5 + 0.5 * cos(a * 12.0);
```

Concentric rings:

```glsl
float bands = 0.5 + 0.5 * cos(r * 30.0);
```

Grid lines:

```glsl
vec2 q = abs(fract(p * 6.0) - 0.5);
float grid = 1.0 - smoothstep(0.45, 0.5, max(q.x, q.y) * 2.0);
```

## 6) Motion Patterns

Orbiting point:

```glsl
vec2 c = 0.35 * vec2(cos(iTime), sin(iTime * 1.4));
```

Scrolling pattern:

```glsl
vec2 q = p + vec2(iTime * 0.2, 0.0);
```

Breathing scale:

```glsl
float s = 1.0 + 0.15 * sin(iTime * 1.7);
p *= s;
```

Independent phases for richer motion:

```glsl
float x = sin(iTime * 0.9 + 0.3);
float y = cos(iTime * 1.4 + 1.2);
```

## 7) Layering Simple Ideas

Blend two masks:

```glsl
float m = max(m1, m2);
```

Use one field to modulate another:

```glsl
float shaped = stripes * fill;
```

Use a mask to choose between two colors:

```glsl
vec3 col = mix(colorA, colorB, m);
```

Add background falloff:

```glsl
float vignette = smoothstep(1.2, 0.2, length(p));
col *= vignette;
```

## 8) When Simple Techniques Work Best

Use these building blocks when you want:
- graphic clarity
- readable silhouette
- bold geometry
- quick seed diversity
- strong family resemblance under mutation

Prefer simple fields and transforms before moving to noise or raymarching.
Many memorable shaders are just a few fields, shaped carefully, moving in a deliberate domain.
