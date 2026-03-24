# Intermediate Context — Patterns, Noise, and Warping

This level adds richer procedural structure.
The main idea is to distort or enrich the domain before you evaluate shapes, colors, or lighting.

## 1) Hashing Beyond the Basics

Vector hash:

```glsl
vec2 hash22(vec2 p) {
    float n = sin(dot(p, vec2(41.0, 289.0)));
    return fract(vec2(262144.0, 32768.0) * n);
}
```

Cell-local random value:

```glsl
vec2 id = floor(p);
vec2 st = fract(p);
float rnd = hash21(id);
```

Random angle from a cell ID:

```glsl
float ang = 6.28318 * hash21(id);
```

## 2) Value Noise Skeleton

```glsl
float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
```

Use it as:
- height
- density
- color driver
- mask distortion
- motion offset

## 3) Fractal Layering Variants

Standard fbm:

```glsl
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; ++i) {
        v += a * valueNoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}
```

Turbulence:

```glsl
float turbulence(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; ++i) {
        v += a * abs(valueNoise(p) * 2.0 - 1.0);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}
```

Ridged noise:

```glsl
float ridged(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; ++i) {
        float n = 1.0 - abs(valueNoise(p) * 2.0 - 1.0);
        v += a * n * n;
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}
```

## 4) Domain Warping

Single warp:

```glsl
vec2 warp = vec2(fbm(p + 1.7), fbm(p + 8.3));
p += 0.2 * warp;
```

Nested warp:

```glsl
vec2 q = vec2(fbm(p + vec2(1.0, 0.0)), fbm(p + vec2(0.0, 1.0)));
vec2 r = vec2(fbm(p + 2.0 * q + 3.1), fbm(p + 2.0 * q + 7.4));
p += 0.3 * r;
```

Directional warp for flow:

```glsl
p += 0.15 * vec2(sin(3.0 * p.y + iTime), cos(3.0 * p.x - 0.7 * iTime));
```

Use warping when you want:
- fluid motion
- organic contours
- broken symmetry
- richer silhouettes without adding many shapes

## 5) Cellular / Voronoi Structure

Distance to nearest cell point:

```glsl
float voronoi(vec2 p) {
    vec2 g = floor(p);
    vec2 f = fract(p);
    float md = 10.0;

    for (int j = -1; j <= 1; ++j) {
        for (int i = -1; i <= 1; ++i) {
            vec2 o = vec2(float(i), float(j));
            vec2 h = hash22(g + o);
            vec2 r = o + h - f;
            md = min(md, dot(r, r));
        }
    }
    return sqrt(md);
}
```

Cell ID driven color:

```glsl
vec2 gid = floor(p);
float cid = hash21(gid);
vec3 col = palette(cid);
```

Use cellular patterns for:
- cracked surfaces
- bubbles
- biological membranes
- tiled motifs with irregularity

## 6) Symmetry and Kaleidoscopic Operators

Mirror over axes:

```glsl
p = abs(p);
```

N-fold angular symmetry:

```glsl
float n = 6.0;
float sector = 6.28318 / n;
float a = atan(p.y, p.x);
a = abs(mod(a + 0.5 * sector, sector) - 0.5 * sector);
p = length(p) * vec2(cos(a), sin(a));
```

Radial replication is often stronger when combined with a slow rotation or domain warp.

## 7) Tile Variation and Local Rules

Rotate each cell differently:

```glsl
vec2 gid = floor(p);
vec2 st = fract(p) - 0.5;
float ang = floor(hash21(gid) * 4.0) * 1.5707963;
st *= rot(ang);
```

Per-cell scale or pulse:

```glsl
float s = mix(0.7, 1.3, hash21(gid));
st *= s;
```

Use local cell IDs to vary:
- orientation
- palette
- thickness
- animation phase
- shape type

## 8) Pattern Interference

Moire-like interference:

```glsl
float a = sin(p.x * 40.0);
float b = sin((p.x + p.y) * 39.2);
float m = a * b;
```

Beat pattern from close frequencies:

```glsl
float beat = sin(r * 18.0) + sin(r * 18.7);
```

These are useful for:
- op art
- synthetic vibration
- shimmer
- techno or sci-fi surfaces

## 9) When to Use What

Use **fbm** when you want broad natural structure.  
Use **turbulence** for smoke, veins, marble, and rough energy.  
Use **ridged noise** for crests, mountain-like structure, or crackle.  
Use **cellular** when you want discrete chambers or membranes.  
Use **warping** when the base pattern is too static or too easy to read.  
Use **symmetry** when you want iconic, ritual, floral, or kaleidoscopic reads.

The intermediate trick is to avoid adding noise everywhere.
Usually one base field and one domain transform are enough.
