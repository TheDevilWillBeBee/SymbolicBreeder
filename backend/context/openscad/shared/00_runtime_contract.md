# OpenSCAD Runtime Contract and Core Rules

This file defines the non-negotiable contract for generated OpenSCAD models.
Every other context file assumes these rules.

## Output Contract

Write OpenSCAD code that produces a single, self-contained 3D model.
The model is rendered as a static preview — there is no animation or interactivity.

Allowed constructs: all built-in OpenSCAD primitives, transforms, boolean operations, modules, functions, and control flow.

Do **not** use `import()`, `surface()`, `include`, `use`, or any file-dependent operation.
Do **not** reference external STL, DXF, SVG, or image files.
Do **not** use libraries (BOSL2, MCAD, etc.) — all code must be inline.
Do **not** use `animation` features (`$t` variable) — static models only.

## Coordinate System

OpenSCAD uses a right-handed coordinate system:
- X axis: left-right
- Y axis: front-back  
- Z axis: up-down

Center models near the origin for good preview framing:

```openscad
translate([0, 0, 0]) sphere(r=10);
```

## Resolution Control

Use `$fn` for controlling mesh smoothness:

```openscad
$fn = 64;
sphere(r = 10);
```

For global resolution, set `$fn` at the top of the file.
Values between 32 and 100 give good quality-to-performance balance.
Use higher values (64–100) for curved surfaces that are the main subject.

## Color

Use `color()` to add visual interest. Multi-colored models are strongly encouraged:

```openscad
color("SteelBlue") cube([10, 10, 2]);
color([1, 0.5, 0.2]) sphere(r = 5);
```

Named colors: "Red", "Green", "Blue", "Yellow", "Cyan", "Magenta", "White", "Gray", "Orange", "Purple", "Gold", "SteelBlue", "Coral", "Teal", "Salmon", "LimeGreen", "Chocolate", "DarkSlateGray", etc.
RGBA vector: `color([r, g, b, a])` where each component is 0.0–1.0.

## Basic Primitives

3D primitives:

```openscad
cube([w, d, h]);
cube([w, d, h], center=true);
sphere(r = radius);
sphere(d = diameter);
cylinder(h = height, r = radius);
cylinder(h = height, r1 = bottom_r, r2 = top_r);
```

2D primitives (for extrusion):

```openscad
circle(r = radius);
square([w, h], center=true);
polygon(points = [[x1,y1], [x2,y2], ...]);
```

## Basic Transforms

```openscad
translate([x, y, z]) child();
rotate([x_deg, y_deg, z_deg]) child();
scale([sx, sy, sz]) child();
mirror([x, y, z]) child();
```

## Boolean Operations

```openscad
union() { a(); b(); }
difference() { base(); cut(); }
intersection() { a(); b(); }
```

## Practical Guardrails

- Always use braces `{}` for multi-child operations
- End statements with semicolons
- Use `center=true` on primitives when centering matters
- Keep total geometry complexity reasonable — avoid unbounded recursion
- Prefer loops over deeply nested manual repetition
- Test mental model: the first child of `difference()` is the base; subsequent children are subtracted
