# Simple Shader Patterns — For Seed Generation

Short, atomic visual patterns ideal for the initial generation (gen-0) in evolutionary breeding.

## Gradients

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv.x, uv.y, 0.5 + 0.5 * uSin, 1.0);
}
```

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(uv.x * 6.28 + uSin * 3.0 + vec3(0.0, 2.0, 4.0));
    fragColor = vec4(col, 1.0);
}
```

## Circles

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float circle = smoothstep(0.3 + 0.1 * uSin, 0.28 + 0.1 * uSin, d);
    fragColor = vec4(vec3(circle) * vec3(0.2, 0.6, 1.0), 1.0);
}
```

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float ring = smoothstep(0.02, 0.0, abs(d - 0.3 - 0.05 * uSin));
    fragColor = vec4(ring * vec3(1.0, 0.5, 0.2), 1.0);
}
```

## Waves

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float wave = sin(uv.x * 20.0 + uSin * 5.0) * 0.5 + 0.5;
    fragColor = vec4(wave * vec3(0.0, 0.8, 0.6), 1.0);
}
```

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float wave = sin(length(uv) * 20.0 - uSin * 6.0);
    fragColor = vec4(vec3(wave * 0.5 + 0.5) * vec3(0.8, 0.3, 0.9), 1.0);
}
```

## Stripes

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float stripe = step(0.5, fract(uv.y * 10.0 + uSin * 0.5));
    vec3 col = mix(vec3(0.1, 0.1, 0.2), vec3(0.9, 0.4, 0.1), stripe);
    fragColor = vec4(col, 1.0);
}
```

## Grid

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 grid = fract(uv * (5.0 + 2.0 * uSin));
    float d = length(grid - 0.5);
    float dot = smoothstep(0.2, 0.18, d);
    fragColor = vec4(dot * vec3(0.3, 1.0, 0.5), 1.0);
}
```

## Checker

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy * (4.0 + 2.0 * uSin);
    float c = mod(floor(uv.x) + floor(uv.y), 2.0);
    vec3 col = mix(vec3(0.05, 0.05, 0.15), vec3(0.95, 0.8, 0.3), c);
    fragColor = vec4(col, 1.0);
}
```

## Polar

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float a = atan(uv.y, uv.x);
    float r = length(uv);
    float pat = sin(a * 5.0 + uSin * 4.0) * 0.5 + 0.5;
    vec3 col = pat * vec3(1.0, 0.4, 0.7) * smoothstep(0.5, 0.0, r);
    fragColor = vec4(col, 1.0);
}
```
