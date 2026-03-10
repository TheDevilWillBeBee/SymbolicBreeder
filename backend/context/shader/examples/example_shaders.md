# Example Shaders — Diverse Seed Programs

A collection of visually distinct GLSL fragment shaders for inspiring evolutionary mutations.

## Neon Rings

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float rings = sin(d * 30.0 - uSin * 8.0) * 0.5 + 0.5;
    float glow = 0.02 / abs(sin(d * 15.0 - uSin * 4.0));
    vec3 col = glow * vec3(0.3, 0.7, 1.0) + rings * vec3(0.1, 0.0, 0.2);
    fragColor = vec4(col, 1.0);
}
```

## Plasma Wave

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy * 4.0;
    float v = sin(uv.x * 3.0 + uSin * 5.0);
    v += sin(uv.y * 2.5 + uCos * 4.0);
    v += sin((uv.x + uv.y) * 2.0 + uSin * 3.0);
    v += sin(length(uv - 2.0) * 3.0 + uCos * 2.0);
    v *= 0.5;
    vec3 col = 0.5 + 0.5 * cos(v * 3.14159 + vec3(0.0, 2.0, 4.0));
    fragColor = vec4(col, 1.0);
}
```

## Spiral Galaxy

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float a = atan(uv.y, uv.x);
    float r = length(uv);
    float spiral = sin(a * 3.0 + r * 20.0 - uSin * 8.0);
    float brightness = 0.03 / (r + 0.03);
    vec3 col = spiral * 0.5 + 0.5 * vec3(0.4, 0.6, 1.0);
    col *= brightness;
    col += 0.01 / (r + 0.01) * vec3(1.0, 0.9, 0.7);
    fragColor = vec4(col, 1.0);
}
```

## Electric Grid

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 3.0 + uSin;
    vec2 grid = fract(uv) - 0.5;
    float d = length(grid);
    float pulse = sin(d * 20.0 - uSin * 6.0) * 0.5 + 0.5;
    float glow = 0.02 / d;
    vec3 col = pulse * vec3(0.0, 1.0, 0.5) + glow * vec3(0.0, 0.3, 0.1);
    col *= smoothstep(0.5, 0.0, d);
    fragColor = vec4(col, 1.0);
}
```

## Morphing Shapes

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float blend = uSin * 0.5 + 0.5;
    float circle = length(uv);
    float diamond = abs(uv.x) + abs(uv.y);
    float shape = mix(circle, diamond, blend);
    float ring = smoothstep(0.02, 0.0, abs(shape - 0.3));
    ring += smoothstep(0.02, 0.0, abs(shape - 0.2)) * 0.5;
    vec3 col = ring * vec3(1.0, 0.4, 0.7);
    col += 0.03 / (shape + 0.03) * vec3(0.2, 0.0, 0.3);
    fragColor = vec4(col, 1.0);
}
```

## Kaleidoscope

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float a = atan(uv.y, uv.x);
    float r = length(uv);
    float segments = 6.0;
    a = mod(a, 6.28318 / segments) - 3.14159 / segments;
    vec2 p = vec2(cos(a), sin(a)) * r;
    float pat = sin(p.x * 15.0 + uSin * 4.0) * cos(p.y * 15.0 + uCos * 4.0);
    vec3 col = 0.5 + 0.5 * cos(pat * 3.0 + r * 5.0 + vec3(0.0, 2.0, 4.0));
    col *= smoothstep(0.8, 0.0, r);
    fragColor = vec4(col, 1.0);
}
```

## Noise Terrain

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 8.0 + vec2(uSin, uCos) * 2.0;
    float n = fract(sin(dot(floor(p), vec2(12.9898, 78.233))) * 43758.5453);
    float smooth_n = fract(sin(dot(floor(p + 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    n = mix(n, smooth_n, fract(p.x));
    vec3 col = mix(vec3(0.0, 0.1, 0.3), vec3(0.1, 0.8, 0.4), n);
    col = mix(col, vec3(1.0, 0.95, 0.9), smoothstep(0.7, 0.8, n));
    fragColor = vec4(col, 1.0);
}
```

## Breathing Orb

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float breath = 0.7 + 0.3 * uSin;
    float core = 0.05 / (d + 0.05) * breath;
    float halo = 0.02 / (d + 0.02) * (1.0 - breath) * 0.5;
    vec3 col = core * vec3(1.0, 0.3, 0.1) + halo * vec3(0.3, 0.5, 1.0);
    float rays = sin(atan(uv.y, uv.x) * 8.0 + uCos * 4.0) * 0.5 + 0.5;
    col += rays * 0.02 / (d + 0.1) * vec3(1.0, 0.8, 0.3);
    fragColor = vec4(col, 1.0);
}
```
