# Advanced Context — Raymarching, Volumetrics, and Procedural PBR

This level is for high-end shaders.
Use it when 3D structure, camera motion, material response, or volumetric depth are central to the piece.

## 1) Camera Construction Without Meshes

Build a camera basis from eye, target, and roll:

```glsl
mat3 cameraBasis(vec3 ro, vec3 ta, float roll) {
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(sin(roll), cos(roll), 0.0)));
    vec3 vv = cross(uu, ww);
    return mat3(uu, vv, ww);
}
```

Build a ray direction:

```glsl
vec3 rd = normalize(cameraBasis(ro, ta, 0.0) * vec3(p, 1.6));
```

Orbit camera:

```glsl
vec3 ro = vec3(3.0 * cos(iTime * 0.2), 1.2, 3.0 * sin(iTime * 0.2));
vec3 ta = vec3(0.0, 0.0, 0.0);
```

## 2) 3D SDF Primitives

Sphere:

```glsl
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}
```

Box:

```glsl
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
```

Torus:

```glsl
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}
```

Capsule:

```glsl
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}
```

Plane:

```glsl
float sdPlane(vec3 p, vec3 n, float h) {
    return dot(p, n) + h;
}
```

## 3) Advanced Space Operators

Repetition:

```glsl
vec3 opRepeat(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
}
```

Twist around Y:

```glsl
vec3 opTwistY(vec3 p, float k) {
    float a = k * p.y;
    mat2 m = rot(a);
    p.xz = m * p.xz;
    return p;
}
```

Cheap bend:

```glsl
vec3 opBendX(vec3 p, float k) {
    mat2 m = rot(k * p.x);
    p.yz = m * p.yz;
    return p;
}
```

## 4) Raymarch Loop Skeleton

```glsl
float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 96; ++i) {
        vec3 p = ro + rd * t;
        float d = mapScene(p);
        if (d < 0.001) break;
        t += d;
        if (t > 40.0) break;
    }
    return t;
}
```

Use fewer steps for graphic scenes and more for thin geometry or volumetrics.

## 5) Surface Normal Estimation

```glsl
vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        mapScene(p + e.xyy) - mapScene(p - e.xyy),
        mapScene(p + e.yxy) - mapScene(p - e.yxy),
        mapScene(p + e.yyx) - mapScene(p - e.yyx)
    ));
}
```

## 6) Ambient Occlusion and Soft Shadow Cues

Ambient occlusion from repeated scene samples:

```glsl
float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float w = 1.0;
    for (int i = 1; i <= 5; ++i) {
        float h = 0.02 * float(i);
        float d = mapScene(p + n * h);
        occ += (h - d) * w;
        w *= 0.7;
    }
    return clamp(1.0 - 2.5 * occ, 0.0, 1.0);
}
```

Soft shadow toward a point or directional ray:

```glsl
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 48; ++i) {
        float h = mapScene(ro + rd * t);
        res = min(res, k * h / t);
        t += clamp(h, 0.01, 0.2);
        if (h < 0.001 || t > maxt) break;
    }
    return clamp(res, 0.0, 1.0);
}
```

## 7) Procedural Material Parameters

In this system there are no texture images.
Material maps must come from position, fields, SDF properties, cell IDs, curvature cues, or procedural noise.

Base color from world position:

```glsl
vec3 baseColor = palette(0.15 * p.y + 0.2 * fbm(p.xz * 1.5));
```

Metallic from structural masks:

```glsl
float metallic = smoothstep(0.55, 0.7, ridged(p.xz * 2.0));
```

Roughness from micro-variation:

```glsl
float roughness = clamp(0.08 + 0.8 * fbm(p.xz * 6.0), 0.04, 0.95);
```

Ambient occlusion can be reused as a material modulator:

```glsl
baseColor *= mix(0.8, 1.0, ao);
```

## 8) Procedural Normal Mapping Without Tangent Space Textures

Perturb the SDF normal by sampling a procedural height around the hit point.

```glsl
float microHeight(vec3 p) {
    return fbm(p.xz * 12.0 + 0.2 * p.y);
}
```

```glsl
vec3 perturbNormal(vec3 p, vec3 n, float amt) {
    vec2 e = vec2(0.002, 0.0);
    float h  = microHeight(p);
    float hx = microHeight(p + vec3(e.x, 0.0, 0.0));
    float hy = microHeight(p + vec3(0.0, e.x, 0.0));
    float hz = microHeight(p + vec3(0.0, 0.0, e.x));
    vec3 g = vec3(hx - h, hy - h, hz - h) / e.x;
    return normalize(n - amt * g);
}
```

## 9) Fresnel and Reflection Helpers

Reflective direction:

```glsl
vec3 rr = reflect(-v, n);
```

Refraction cue:

```glsl
vec3 tr = refract(-v, n, 1.0 / 1.33);
```

Schlick fresnel:

```glsl
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
```

## 10) Microfacet PBR Building Blocks

GGX distribution:

```glsl
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float num = a2;
    float den = (NdotH2 * (a2 - 1.0) + 1.0);
    den = 3.14159 * den * den;
    return num / max(den, 1e-4);
}
```

Schlick-GGX geometry term:

```glsl
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    float num = NdotV;
    float den = NdotV * (1.0 - k) + k;
    return num / max(den, 1e-4);
}
```

Smith visibility:

```glsl
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float ggx1 = GeometrySchlickGGX(max(dot(N, V), 0.0), roughness);
    float ggx2 = GeometrySchlickGGX(max(dot(N, L), 0.0), roughness);
    return ggx1 * ggx2;
}
```

BRDF assembly for a single light:

```glsl
vec3 evalPBR(vec3 N, vec3 V, vec3 L, vec3 albedo, float metallic, float roughness, vec3 radiance) {
    vec3 H = normalize(V + L);

    float NDF = DistributionGGX(N, H, roughness);
    float G   = GeometrySmith(N, V, L, roughness);

    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 F  = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 num = NDF * G * F;
    float den = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
    vec3 spec = num / max(den, 1e-4);

    vec3 kS = F;
    vec3 kD = (1.0 - kS) * (1.0 - metallic);

    float NdotL = max(dot(N, L), 0.0);
    return (kD * albedo / 3.14159 + spec) * radiance * NdotL;
}
```

## 11) Analytic Light Sources and Environment

Directional light:

```glsl
vec3 L = normalize(vec3(0.6, 0.8, 0.3));
vec3 radiance = 3.0 * vec3(1.0, 0.95, 0.9);
```

Point light:

```glsl
vec3 toL = lightPos - p;
float dist2 = dot(toL, toL);
vec3 L = toL / sqrt(dist2);
vec3 radiance = lightColor / (1.0 + dist2);
```

Analytic sky-ground environment for reflections:

```glsl
vec3 envColor(vec3 rd) {
    float t = 0.5 + 0.5 * rd.y;
    vec3 sky = mix(vec3(0.12, 0.18, 0.3), vec3(0.5, 0.7, 1.0), t);
    vec3 ground = vec3(0.12, 0.09, 0.07);
    return mix(ground, sky, smoothstep(-0.05, 0.2, rd.y));
}
```

Use this instead of texture-based environment maps.

## 12) Volumetric Accumulation

Density field from noise:

```glsl
float density(vec3 p) {
    return smoothstep(0.45, 0.8, fbm(p.xz * 0.7 + p.y * 0.2));
}
```

Front-to-back accumulation:

```glsl
vec3 accum = vec3(0.0);
float trans = 1.0;
float t = 0.0;
for (int i = 0; i < 48; ++i) {
    vec3 p = ro + rd * t;
    float d = density(p);
    vec3 c = palette(0.1 * p.y + 0.2 * iTime);
    float a = 0.06 * d;
    accum += trans * a * c;
    trans *= (1.0 - a);
    if (trans < 0.01) break;
    t += 0.08;
}
```

Use volumetrics for fog shafts, nebulae, clouds, energy, or ethereal glow.

## 13) When to Use Procedural PBR

Use procedural PBR when:
- material response is part of the identity
- the piece benefits from glancing highlights and fresnel
- world-space motion and lighting matter
- you want metal, ceramic, plastic, stone, or wet surfaces without image textures

Do not use PBR by default.
Stylized shaders often read better with simpler lighting.
Advanced skill is knowing when not to turn everything into metal.
