# GLSL ES 3.0 Reference

GLSL (OpenGL Shading Language) ES 3.0 is used for WebGL 2 fragment shaders. This reference covers the subset relevant to writing Shadertoy-style fragment shaders.

## Types

| Type | Description | Example |
|------|-------------|---------|
| `float` | Single floating-point number | `float x = 1.0;` |
| `vec2` | 2-component float vector | `vec2 uv = vec2(0.5, 0.5);` |
| `vec3` | 3-component float vector | `vec3 col = vec3(1.0, 0.0, 0.0);` |
| `vec4` | 4-component float vector | `vec4 rgba = vec4(1.0, 0.5, 0.0, 1.0);` |
| `int` | Integer | `int i = 3;` |
| `uint` | Unsigned integer | `uint u = 7u;` |
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
| `round(x)` | Round to nearest integer |
| `roundEven(x)` | Round to nearest even integer |
| `trunc(x)` | Truncate toward zero |
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
| `sinh(x)`, `cosh(x)`, `tanh(x)` | Hyperbolic trig |
| `asinh(x)`, `acosh(x)`, `atanh(x)` | Inverse hyperbolic trig |
| `pow(x, y)` | Power |
| `exp(x)`, `exp2(x)` | Exponential |
| `log(x)`, `log2(x)` | Logarithm |
| `sqrt(x)`, `inversesqrt(x)` | Square root |
| `isnan(x)` | True if x is NaN |
| `isinf(x)` | True if x is infinity |

### Hyperbolic Functions — Practical Uses

`tanh(x)` is especially useful for **soft clamping and tone mapping**:
```glsl
// Soft HDR clamping — preserves color ratios, never exceeds 1.0
col = tanh(col * 2.0);

// White balancing with tanh — compresses bright areas smoothly
col = tanh(col * col);
```

## Vector Functions

| Function | Description |
|----------|-------------|
| `length(v)` | Vector length |
| `distance(a, b)` | Distance between points |
| `dot(a, b)` | Dot product |
| `cross(a, b)` | Cross product (vec3 only) |
| `normalize(v)` | Unit vector |
| `reflect(I, N)` | Reflection vector |

## Matrix Functions

| Function | Description |
|----------|-------------|
| `transpose(m)` | Matrix transpose |
| `determinant(m)` | Matrix determinant |
| `inverse(m)` | Matrix inverse |

## Texture Functions

| Function | Description |
|----------|-------------|
| `texture(sampler, uv)` | Sample texture at UV coordinates (replaces `texture2D` from ES 1.0) |
| `texelFetch(sampler, ivec2, lod)` | Direct texel access without filtering |
| `textureSize(sampler, lod)` | Get texture dimensions as ivec2 |

## Bitwise Operations

ES 3.0 adds bitwise operators for `int` and `uint` types:

```glsl
int a = 0xFF;
int b = a & 0x0F;   // AND
int c = a | 0xF0;   // OR
int d = a ^ 0xFF;   // XOR
int e = ~a;          // NOT
int f = a << 2;      // left shift
int g = a >> 1;      // right shift

uint h = 42u;        // uint literal suffix
```

Useful for hash functions, cellular automata rules, and bit-packing data into texture channels.

## For Loops

In GLSL ES 3.0, loop bounds may be dynamic (unlike ES 1.0 which required compile-time constants):

```glsl
// Constant bounds (always valid)
for (int i = 0; i < 8; i++) {
    // iterative computation
}

// Nested loops
for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
        // grid iteration
    }
}

// Dynamic bounds (valid in ES 3.0)
int n = int(iResolution.x * 0.01);
for (int i = 0; i < n; i++) {
    // adaptive iteration count
}
```

Common uses: FBM octaves, raymarching steps, fractal iteration, metaball accumulation, geometric folding.

## Important Notes

- All float literals must include a decimal point: `1.0` not `1`
- Division by zero produces undefined results — guard with small epsilon
- `atan(y, x)` returns angle in radians (-π to π)
- `mod()` handles negative values differently than some languages
- No recursive functions allowed
- `texture()` replaces the old `texture2D()` from ES 1.0
