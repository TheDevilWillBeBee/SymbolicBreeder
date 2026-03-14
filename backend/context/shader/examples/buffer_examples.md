# Buffer Shader Examples — Ping-Pong Effects

Buffer shaders that use `iBackBuffer` to read the previous frame, enabling stateful simulations.

## Game of Life

Classic cellular automaton — cells live or die based on neighbor count.

```glsl
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void initImage(out vec4 fragColor, in vec2 fragCoord) {
    float r = hash(fragCoord + vec2(42.0, 17.0));
    float alive = step(0.62, r);
    fragColor = vec4(alive, alive, alive, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 px = 1.0 / iResolution.xy;
    vec2 uv = fragCoord / iResolution.xy;

    float sum = 0.0;
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            if (x == 0 && y == 0) continue;
            sum += texture2D(iBackBuffer, uv + vec2(float(x), float(y)) * px).r;
        }
    }

    vec2 prev = texture2D(iBackBuffer, uv).rg;
    float self = prev.r;
    float trail = prev.g;
    float alive = 0.0;
    if (self > 0.5) {
        alive = (sum > 1.5 && sum < 3.5) ? 1.0 : 0.0;
    } else {
        alive = (sum > 2.5 && sum < 3.5) ? 1.0 : 0.0;
    }

    trail = max(trail * 0.95, alive);
    vec3 col = mix(vec3(0.0, 0.02, 0.1) * trail, vec3(0.1, 0.8, 0.4), alive);
    fragColor = vec4(alive, trail, 0.0, 1.0);
}
```

## Reaction-Diffusion (Gray-Scott)

Two-chemical system producing organic, coral-like patterns.

```glsl
void initImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float u = 1.0;
    float v = 0.0;
    vec2 center = abs(uv - 0.5);
    if (center.x < 0.05 && center.y < 0.05) {
        v = 0.5;
    }
    fragColor = vec4(u, v, 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 px = 1.0 / iResolution.xy;
    vec2 uv = fragCoord / iResolution.xy;
    vec2 val = texture2D(iBackBuffer, uv).rg;
    float u = val.r;
    float v = val.g;

    // Laplacian with weighted kernel
    float lu = -u;
    float lv = -v;
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            if (x == 0 && y == 0) continue;
            float w = (x == 0 || y == 0) ? 0.2 : 0.05;
            vec2 s = texture2D(iBackBuffer, uv + vec2(float(x), float(y)) * px).rg;
            lu += w * s.r;
            lv += w * s.g;
        }
    }

    float f = 0.037;
    float k = 0.06;
    float Du = 0.21;
    float Dv = 0.105;
    float dt = 0.9;
    float uvv = u * v * v;
    float nu = clamp(u + dt * (Du * lu - uvv + f * (1.0 - u)), 0.0, 1.0);
    float nv = clamp(v + dt * (Dv * lv + uvv - (f + k) * v), 0.0, 1.0);

    vec3 col = 0.5 + 0.5 * cos(nv * 6.0 + vec3(0.0, 2.0, 4.0));
    col = mix(col, vec3(0.02), step(nv, 0.01));
    fragColor = vec4(nu, nv, 0.0, 1.0);
}
```

## Smooth Trails

A moving light leaves colorful trails that slowly fade. No initImage needed — starts from black.

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 prev = texture2D(iBackBuffer, uv).rgb * 0.97;

    float t = iTime * 0.8;
    vec2 center = 0.5 + 0.3 * vec2(cos(t), sin(t * 1.3));
    float d = length(uv - center);
    float spot = smoothstep(0.04, 0.0, d);
    vec3 spotCol = 0.5 + 0.5 * cos(iTime + vec3(0.0, 2.0, 4.0));

    vec3 col = max(prev, spot * spotCol);
    fragColor = vec4(col, 1.0);
}
```
