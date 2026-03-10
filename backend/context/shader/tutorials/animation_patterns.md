# Animation Patterns for Shaders

## Using uSin and uCos

The uniforms `uSin` and `uCos` oscillate between -1 and 1 over a 5-second cycle. Use them for smooth, looping animations.

### Basic Animation
```glsl
// Pulsing size
float radius = 0.2 + 0.1 * uSin;

// Moving position
vec2 center = vec2(0.5 + 0.2 * uCos, 0.5 + 0.2 * uSin);

// Rotating angle
float angle = atan(uv.y, uv.x) + uSin * 3.14159;
```

### Mapping to Useful Ranges
```glsl
// Map -1..1 to 0..1
float t01 = uSin * 0.5 + 0.5;

// Map to custom range (e.g., 200 to 800)
float freq = 500.0 + 300.0 * uSin;

// Use as phase offset
float wave = sin(x * 10.0 + uSin * 6.0);
```

## Color Techniques

### Rainbow / Palette Cycling
```glsl
// Classic cosine palette (Inigo Quilez technique)
vec3 col = 0.5 + 0.5 * cos(value + vec3(0.0, 2.094, 4.189));
// Produces smooth rainbow transitions

// With animation
vec3 col = 0.5 + 0.5 * cos(value + uSin + vec3(0.0, 2.0, 4.0));
```

### HSV to RGB
```glsl
vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
// Usage: vec3 col = hsv2rgb(vec3(hue, saturation, value));
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
float spiral = sin(angle + radius * 10.0); // spiral pattern
```

## Common Math Tricks

### Smooth Pulse
```glsl
float pulse = smoothstep(0.4, 0.5, d) - smoothstep(0.5, 0.6, d);
```

### Repeating with Symmetry
```glsl
vec2 p = abs(uv);           // mirror across both axes
vec2 p = mod(uv, 1.0);      // tile
vec2 p = fract(uv * 3.0);   // 3×3 tiling
```

### Rotation
```glsl
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}
// Usage: uv = rot(uSin) * uv;
```

### Pseudo-random (Hash)
```glsl
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
```

### Domain Warping
```glsl
// Warp coordinates before computing pattern
uv += 0.1 * vec2(sin(uv.y * 5.0 + uSin * 3.0), cos(uv.x * 5.0 + uCos * 3.0));
```

## Tips for Short, Expressive Shaders

1. **Use aspect-corrected centered coordinates** for most effects
2. **`smoothstep` is your friend** — creates soft edges without branching
3. **Combine `sin`/`cos` with distances** for radial patterns
4. **Use `fract()` for tiling** — repeats patterns efficiently
5. **The cosine palette trick** (`0.5 + 0.5 * cos(…)`) creates beautiful colors with minimal code
6. **Keep shaders under 100 lines** — clarity trumps complexity.
7. **Layer simple effects** — combine 2-3 simple ideas rather than one complex one
8. **Define simple helper functions** — helper functions can simplify the code a lot and allow creating more complex shaders.
