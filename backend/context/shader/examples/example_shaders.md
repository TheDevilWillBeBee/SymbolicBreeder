# Example Shaders — Diverse Programs for Inspiration

A collection of visually striking GLSL fragment shaders using helper functions, for loops, and advanced techniques.

## FBM Noise Landscape

```glsl
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 4.0 + vec2(iTime * 0.1, 0.0);
    float n = fbm(p);
    vec3 col = mix(vec3(0.0, 0.05, 0.2), vec3(0.1, 0.7, 0.4), smoothstep(0.3, 0.5, n));
    col = mix(col, vec3(0.9, 0.95, 1.0), smoothstep(0.6, 0.75, n));
    col *= 0.8 + 0.2 * fbm(uv * 8.0 + iTime * 0.05);
    fragColor = vec4(col, 1.0);
}
```

## Raymarched Spheres

```glsl
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
    float d = sdSphere(p, 0.8);
    d = smin(d, sdSphere(p - vec3(sin(iTime) * 0.8, 0.0, cos(iTime) * 0.8), 0.5), 0.4);
    d = smin(d, sdSphere(p - vec3(0.0, sin(iTime * 1.3) * 0.6, 0.0), 0.4), 0.3);
    return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0, 0.0, -3.5);
    vec3 rd = normalize(vec3(uv, 1.0));
    float t = 0.0;
    for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if (d < 0.001) break;
        t += d;
        if (t > 20.0) break;
    }
    vec3 col = vec3(0.0);
    if (t < 20.0) {
        vec3 p = ro + rd * t;
        vec3 n = normalize(vec3(
            map(p + vec3(0.001, 0.0, 0.0)) - map(p - vec3(0.001, 0.0, 0.0)),
            map(p + vec3(0.0, 0.001, 0.0)) - map(p - vec3(0.0, 0.001, 0.0)),
            map(p + vec3(0.0, 0.0, 0.001)) - map(p - vec3(0.0, 0.0, 0.001))
        ));
        float diff = max(dot(n, normalize(vec3(1.0, 1.0, -1.0))), 0.0);
        col = 0.5 + 0.5 * cos(t * 0.5 + iTime + vec3(0.0, 2.0, 4.0));
        col *= diff * 0.8 + 0.2;
    }
    fragColor = vec4(col, 1.0);
}
```

## Julia Set Fractal

```glsl
vec3 palette(float t) {
    return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y * 2.5;
    vec2 c = vec2(-0.7 + 0.15 * cos(iTime * 0.3), 0.27 + 0.1 * sin(iTime * 0.5));
    vec2 z = uv;
    float iter = 0.0;
    for (int i = 0; i < 80; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > 4.0) break;
        iter += 1.0;
    }
    float t = iter / 80.0;
    vec3 col = palette(t + iTime * 0.05);
    col *= smoothstep(0.0, 0.05, t);
    fragColor = vec4(col, 1.0);
}
```

## Iterative Folding Art

```glsl
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 col = vec3(0.0);
    for (int i = 0; i < 10; i++) {
        float fi = float(i);
        uv = abs(uv) - 0.4 + 0.05 * sin(iTime * 0.3);
        uv *= rot(iTime * 0.15 + fi * 0.4);
        float d = abs(uv.x);
        col += 0.015 / (d + 0.01) * (0.5 + 0.5 * cos(fi * 0.7 + iTime * 0.5 + vec3(0.0, 2.0, 4.0)));
    }
    fragColor = vec4(col, 1.0);
}
```

## Domain-Warped Plasma

```glsl
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy * 3.0;
    float t = iTime * 0.3;
    // Nested domain warping
    float n1 = noise(uv * 2.0 + t);
    float n2 = noise(uv * 2.0 + n1 * 2.0 + t * 0.7);
    float n3 = noise(uv * 2.0 + n2 * 2.0 + t * 0.5);
    vec3 col = 0.5 + 0.5 * cos(n3 * 4.0 + iTime * 0.2 + vec3(0.0, 2.0, 4.0));
    col *= 0.7 + 0.3 * n2;
    fragColor = vec4(col, 1.0);
}
```

## Glowing Metaballs

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float v = 0.0;
    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float angle = fi * 0.785 + iTime * (0.3 + fi * 0.05);
        float radius = 0.25 + 0.15 * sin(iTime * 0.5 + fi * 1.2);
        vec2 p = vec2(cos(angle), sin(angle)) * radius;
        v += 0.015 / length(uv - p);
    }
    vec3 col = 0.5 + 0.5 * cos(v * 0.8 + iTime * 0.5 + vec3(0.0, 2.0, 4.0));
    col *= smoothstep(0.3, 1.5, v);
    fragColor = vec4(col, 1.0);
}
```

## Tunnel Effect

```glsl
mat2 rot(float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float a = atan(uv.y, uv.x);
    float r = length(uv);
    float tunnel = 1.0 / r;
    vec2 st = vec2(a / 3.14159, tunnel);
    st.y += iTime * 0.5;
    st *= rot(iTime * 0.1);
    float pat = sin(st.x * 8.0) * sin(st.y * 4.0);
    vec3 col = 0.5 + 0.5 * cos(pat * 2.0 + tunnel * 0.5 + iTime + vec3(0.0, 2.0, 4.0));
    col *= smoothstep(0.0, 0.3, r);
    col *= exp(-r * 0.5);
    fragColor = vec4(col, 1.0);
}
```

## Voronoi Pattern

```glsl
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y * 4.0;
    vec2 n = floor(uv);
    vec2 f = fract(uv);
    float md = 8.0;
    vec2 mr = vec2(0.0);
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);
            o = 0.5 + 0.5 * sin(iTime + 6.2831 * o);
            vec2 r = g + o - f;
            float d = dot(r, r);
            if (d < md) { md = d; mr = r; }
        }
    }
    float d = sqrt(md);
    vec3 col = 0.5 + 0.5 * cos(d * 5.0 + iTime * 0.5 + vec3(0.0, 2.0, 4.0));
    col *= 0.7 + 0.3 * smoothstep(0.0, 0.05, d);
    fragColor = vec4(col, 1.0);
}
```
