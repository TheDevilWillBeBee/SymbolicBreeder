# Animation & Advanced Patterns for Shaders

## Using iTime

The uniform `iTime` provides elapsed time in seconds. Use it freely for animation.

### Basic Animation
```glsl
// Pulsing size
float radius = 0.2 + 0.1 * sin(iTime);

// Moving position
vec2 center = vec2(0.5 + 0.2 * cos(iTime), 0.5 + 0.2 * sin(iTime));

// Rotating angle
float angle = atan(uv.y, uv.x) + iTime;

// Slow oscillation
float slow = sin(iTime * 0.3);

// Fast oscillation
float fast = sin(iTime * 5.0);
```

### Speed and Phase Control
```glsl
// Different speeds for layered effects
float a = sin(iTime * 1.0);
float b = cos(iTime * 0.7);
float c = sin(iTime * 2.3 + 1.5);  // phase offset

// Map to custom range (e.g., 200 to 800)
float freq = 500.0 + 300.0 * sin(iTime);

// Scrolling UV
vec2 scrolled = uv + vec2(iTime * 0.1, 0.0);
```

## Color Techniques

### Rainbow / Palette Cycling
```glsl
// Classic cosine palette — extremely versatile
vec3 col = 0.5 + 0.5 * cos(value + vec3(0.0, 2.094, 4.189));

// With time animation
vec3 col = 0.5 + 0.5 * cos(value + iTime + vec3(0.0, 2.0, 4.0));

// Parameterized palette
vec3 palette(float t) {
    return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));
}
```

### HSV to RGB
```glsl
vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
// Usage: vec3 col = hsv2rgb(vec3(hue, saturation, value));
```

### Tone Mapping with tanh
```glsl
// Soft HDR clamping — preserves color ratios, never exceeds 1.0
col = tanh(col * 2.0);

// White balancing with tanh — compresses bright areas smoothly
col = tanh(col * col);

// Combine with additive glow for controlled bloom
vec3 glow = 0.03 / (distance + 0.03);
col += glow;
col = tanh(col);
```

### Color Mixing
```glsl
// Smooth blend between two colors
vec3 col = mix(vec3(0.1, 0.0, 0.3), vec3(1.0, 0.5, 0.0), t);

// Additive glow
col += 0.05 / (distance + 0.05);
```

## Common Geometric Patterns

### Circles and Rings
```glsl
float d = length(uv);                    // distance from center
float circle = smoothstep(0.3, 0.28, d); // filled circle
float ring = smoothstep(0.02, 0.0, abs(d - 0.3)); // thin ring
```

### Grids
```glsl
vec2 grid = fract(uv * 5.0);            // 5×5 grid cells
float lines = step(0.95, max(grid.x, grid.y)); // grid lines
```

### Stripes
```glsl
float stripe = sin(uv.x * 20.0) * 0.5 + 0.5;  // vertical stripes
float diagonal = sin((uv.x + uv.y) * 15.0);     // diagonal stripes
```

### Polar Coordinates
```glsl
float angle = atan(uv.y, uv.x);         // -π to π
float radius = length(uv);
float petals = sin(angle * 5.0);          // 5-petal flower
float spiral = sin(angle + radius * 10.0 - iTime * 2.0); // animated spiral
```

## Helper Functions

Helper functions keep mainImage readable and enable complex effects. Define them above mainImage.

### Rotation Matrix
```glsl
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}
// Usage: uv = rot(iTime) * uv;
```

### Pseudo-random Hash
```glsl
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
```

### Value Noise
```glsl
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);  // smoothstep interpolation
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
```

## For Loops — Iterative Techniques

For loops enable the most visually complex effects. In ES 3.0, bounds may be dynamic, but prefer reasonable limits for performance.

### FBM (Fractal Brownian Motion)
```glsl
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}
// Creates organic, cloud-like textures
```

### Raymarching (3D SDF Rendering)
```glsl
float map(vec3 p) {
    // Define your SDF scene here
    return length(p) - 1.0;  // sphere
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0, 0.0, -3.0);  // ray origin
    vec3 rd = normalize(vec3(uv, 1.0));  // ray direction
    float t = 0.0;
    for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if (d < 0.001) break;
        t += d;
        if (t > 20.0) break;
    }
    // Color based on distance/iterations
}
```

### Fractal Iteration (Julia Set)
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y * 2.5;
    vec2 c = vec2(-0.7 + 0.2 * cos(iTime * 0.3), 0.3 + 0.1 * sin(iTime * 0.5));
    vec2 z = uv;
    float iter = 0.0;
    for (int i = 0; i < 64; i++) {
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        if (dot(z, z) > 4.0) break;
        iter += 1.0;
    }
    vec3 col = 0.5 + 0.5 * cos(iter * 0.1 + vec3(0.0, 2.0, 4.0));
    // ...
}
```

### Iterative Geometric Folding
```glsl
// Fold space iteratively for fractal-like patterns
vec3 col = vec3(0.0);
for (int i = 0; i < 8; i++) {
    uv = abs(uv) - 0.5;
    uv *= rot(iTime * 0.1 + float(i) * 0.3);
    col += 0.02 / abs(uv.x) * palette(float(i) * 0.15);
}
```

### Metaballs / Particle Fields
```glsl
float v = 0.0;
for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 p = vec2(sin(iTime + fi * 1.3), cos(iTime * 0.7 + fi * 1.7)) * 0.4;
    v += 0.02 / length(uv - p);
}
```

## SDF (Signed Distance Function) Primitives

```glsl
// Sphere / Circle
float sdSphere(vec3 p, float r) { return length(p) - r; }

// Box
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Torus
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// Smooth union (blend two SDFs)
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}
```

## Domain Manipulation

### Domain Repetition
```glsl
// Infinite repetition
vec3 p = mod(pos + 0.5 * spacing, spacing) - 0.5 * spacing;

// 2D tiling
vec2 id = floor(uv * 5.0);
vec2 cell = fract(uv * 5.0) - 0.5;
```

### Domain Warping
```glsl
// Warp coordinates before computing pattern
uv += 0.1 * vec2(sin(uv.y * 5.0 + iTime), cos(uv.x * 5.0 + iTime * 0.7));

// Nested warping for organic flow
float n1 = fbm(uv * 3.0 + iTime * 0.2);
float n2 = fbm(uv * 3.0 + n1 + iTime * 0.1);
```

## Tips for Expressive Shaders

1. **Use aspect-corrected centered coordinates** for most effects
2. **`smoothstep` is your friend** — creates soft edges without branching
3. **The cosine palette trick** (`0.5 + 0.5 * cos(…)`) creates beautiful colors with minimal code
4. **Use for loops** to add complexity — FBM, raymarching, fractal iteration, metaballs
5. **Define helper functions** — keeps mainImage clean and enables reuse
6. **Layer simple effects** — combine 2-3 techniques for rich visuals
7. **Domain warping** creates organic, fluid-like motion
8. **Iterative folding** (abs + rotate in a loop) creates fractal patterns cheaply
