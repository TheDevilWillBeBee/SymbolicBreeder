# Intermediate Context — SDF, Lighting, and Procedural Materials

This level teaches richer form.
You still do not need full 3D raymarching to get material and lighting cues.

## 1) More Shape Primitives

Rounded box:

```glsl
float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) - r + min(max(q.x, q.y), 0.0);
}
```

Capsule in 2D:

```glsl
float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}
```

Regular polygon approximation:

```glsl
float sdNgon(vec2 p, float n, float radius) {
    float a = atan(p.y, p.x);
    float r = 6.28318 / n;
    return cos(floor(0.5 + a / r) * r - a) * length(p) - radius;
}
```

## 2) Boolean and Smooth Combinators

Hard union:

```glsl
float opUnion(float a, float b) { return min(a, b); }
```

Intersection:

```glsl
float opIntersection(float a, float b) { return max(a, b); }
```

Subtraction:

```glsl
float opSub(float a, float b) { return max(a, -b); }
```

Smooth union:

```glsl
float opSmoothUnion(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}
```

## 3) Use the Same Field for Multiple Roles

Fill:

```glsl
float fill = smoothstep(0.0, -fwidth(d), d);
```

Inset border:

```glsl
float border = 1.0 - smoothstep(0.0, 0.003 + fwidth(d), abs(d + 0.01));
```

Outer glow:

```glsl
float glow = exp(-18.0 * max(d, 0.0));
```

Bevel cue from distance:

```glsl
float bevel = smoothstep(0.03, -0.03, d);
```

One field can drive silhouette, edge, glow, and even roughness or hue.

## 4) Gradients and Normals from Fields

2D field normal estimate:

```glsl
vec2 e = vec2(0.001, 0.0);
vec2 grad = vec2(
    field(p + e.xy) - field(p - e.xy),
    field(p + e.yx) - field(p - e.yx)
);
vec3 n = normalize(vec3(grad, 1.0));
```

Height-field normal from procedural height:

```glsl
float h = height(p);
float hx = height(p + vec2(0.002, 0.0));
float hy = height(p + vec2(0.0, 0.002));
vec3 n = normalize(vec3(h - hx, h - hy, 0.02));
```

## 5) Lighting Building Blocks

Directional light:

```glsl
vec3 l = normalize(vec3(0.4, 0.5, 0.8));
float ndl = max(dot(n, l), 0.0);
```

Point light with falloff:

```glsl
vec3 lp = vec3(0.3, 0.2, 0.6);
vec3 toL = lp - pos;
float dist2 = dot(toL, toL);
vec3 l = toL / sqrt(dist2);
float atten = 1.0 / (1.0 + 4.0 * dist2);
```

Half vector for specular:

```glsl
vec3 h = normalize(l + v);
float ndh = max(dot(n, h), 0.0);
```

Phong-ish highlight:

```glsl
float spec = pow(max(dot(reflect(-l, n), v), 0.0), 32.0);
```

Blinn-ish highlight:

```glsl
float spec = pow(ndh, 48.0);
```

## 6) Rim and Fresnel-Like Cues

Simple rim light:

```glsl
float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
```

Schlick-style fresnel cue:

```glsl
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
```

Use rim or fresnel when you want:
- a stronger silhouette
- material separation
- glossy or translucent feel
- dramatic backlight

## 7) Procedural Material Terms

Base color from position or IDs:

```glsl
vec3 baseColor = palette(0.2 * length(p) + 0.1 * iTime);
```

Roughness from noise:

```glsl
float roughness = clamp(0.2 + 0.6 * fbm(p * 3.0), 0.04, 0.95);
```

Metallic mask from bands or cells:

```glsl
float metallic = step(0.7, fbm(p * 2.0));
```

Ambient occlusion cue from cavity:

```glsl
float cavity = exp(-20.0 * abs(d));
float ao = 1.0 - 0.4 * cavity;
```

## 8) Procedural Bump / Normal Detail

Perturb a normal with a small height function:

```glsl
float bump(vec2 p) { return fbm(p * 8.0); }
```

```glsl
vec2 g = vec2(
    bump(p + vec2(0.002, 0.0)) - bump(p - vec2(0.002, 0.0)),
    bump(p + vec2(0.0, 0.002)) - bump(p - vec2(0.0, 0.002))
);
n = normalize(n + vec3(g * 0.6, 0.0));
```

Use bump detail after silhouette is already good.
Do not use bump to rescue a weak composition.

## 9) Materialized Shading Composition

A common intermediate composition order:

```glsl
vec3 diffuse = baseColor * ndl;
vec3 specular = vec3(spec);
vec3 col = diffuse + 0.2 * baseColor + specular;
col *= ao;
col += rim * 0.15;
col = tanh(col);
```

## 10) When to Use Intermediate Lighting Instead of Full Raymarching

Stay in this level when:
- the image is mostly 2D graphic design
- depth can be implied from height or field gradients
- you want fast, stable, readable results
- you want material richness without expensive scene marching

Move to full raymarching only when spatial depth, camera motion, or 3D occlusion truly matter.
