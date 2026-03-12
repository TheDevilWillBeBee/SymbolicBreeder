# GLSL ES 1.0 Reference

GLSL (OpenGL Shading Language) ES 1.0 is used for WebGL fragment shaders. This reference covers the subset relevant to writing Shadertoy-style fragment shaders.

## Types

| Type | Description | Example |
|------|-------------|---------|
| `float` | Single floating-point number | `float x = 1.0;` |
| `vec2` | 2-component float vector | `vec2 uv = vec2(0.5, 0.5);` |
| `vec3` | 3-component float vector | `vec3 col = vec3(1.0, 0.0, 0.0);` |
| `vec4` | 4-component float vector | `vec4 rgba = vec4(1.0, 0.5, 0.0, 1.0);` |
| `int` | Integer | `int i = 3;` |
| `bool` | Boolean | `bool b = true;` |
| `mat2` | 2×2 matrix | `mat2 rot = mat2(c, -s, s, c);` |
| `mat3` | 3×3 matrix | `mat3 m = mat3(1.0);` |

## Swizzling

Access vector components using `.xyzw`, `.rgba`, or `.stpq`:
```glsl
vec4 v = vec4(1.0, 2.0, 3.0, 4.0);
vec2 a = v.xy;     // (1.0, 2.0)
vec3 b = v.rgb;    // (1.0, 2.0, 3.0)
float c = v.w;     // 4.0
vec3 d = v.zyx;    // (3.0, 2.0, 1.0) — reorder
vec2 e = v.xx;     // (1.0, 1.0) — repeat
```

## Constructors

```glsl
vec3 a = vec3(1.0);           // (1.0, 1.0, 1.0)
vec3 b = vec3(1.0, 2.0, 3.0);
vec4 c = vec4(b, 1.0);        // (1.0, 2.0, 3.0, 1.0)
vec2 d = vec2(a.xy);          // (1.0, 1.0)
```

## Built-in Math Functions

| Function | Description |
|----------|-------------|
| `abs(x)` | Absolute value |
| `sign(x)` | Sign (-1, 0, or 1) |
| `floor(x)` | Round down |
| `ceil(x)` | Round up |
| `fract(x)` | Fractional part: `x - floor(x)` |
| `mod(x, y)` | Modulo: `x - y * floor(x/y)` |
| `min(x, y)` | Minimum |
| `max(x, y)` | Maximum |
| `clamp(x, lo, hi)` | Clamp to range |
| `mix(a, b, t)` | Linear interpolation: `a*(1-t) + b*t` |
| `step(edge, x)` | 0 if x < edge, else 1 |
| `smoothstep(lo, hi, x)` | Smooth Hermite interpolation |
| `sin(x)`, `cos(x)`, `tan(x)` | Trigonometric |
| `asin(x)`, `acos(x)`, `atan(y,x)` | Inverse trig |
| `pow(x, y)` | Power |
| `exp(x)`, `exp2(x)` | Exponential |
| `log(x)`, `log2(x)` | Logarithm |
| `sqrt(x)`, `inversesqrt(x)` | Square root |

## Vector Functions

| Function | Description |
|----------|-------------|
| `length(v)` | Vector length |
| `distance(a, b)` | Distance between points |
| `dot(a, b)` | Dot product |
| `cross(a, b)` | Cross product (vec3 only) |
| `normalize(v)` | Unit vector |
| `reflect(I, N)` | Reflection vector |

## For Loops

Loops must have compile-time-known bounds in GLSL ES 1.0:

```glsl
// Valid — constant bounds
for (int i = 0; i < 8; i++) {
    // iterative computation
}

// Valid — nested loops
for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
        // grid iteration
    }
}

// INVALID — variable bounds
int n = 8;
for (int i = 0; i < n; i++) { }  // won't compile
```

Common uses: FBM octaves, raymarching steps, fractal iteration, metaball accumulation, geometric folding.

## Important Notes

- All float literals must include a decimal point: `1.0` not `1`
- Division by zero produces undefined results — guard with small epsilon
- `atan(y, x)` returns angle in radians (-π to π)
- `mod()` handles negative values differently than some languages
- No recursive functions allowed
