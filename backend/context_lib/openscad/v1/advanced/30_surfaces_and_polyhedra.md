# Surfaces, Polyhedra, and Mathematical Forms

## Polyhedron Primitive

`polyhedron()` builds geometry from explicit vertices and faces:

```openscad
polyhedron(
    points = [
        [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
        [5, 5, 12]
    ],
    faces = [
        [0, 1, 2, 3],   // base
        [0, 1, 4],       // front
        [1, 2, 4],       // right
        [2, 3, 4],       // back
        [3, 0, 4]        // left
    ]
);
```

Face winding must be counter-clockwise when viewed from outside.

## Parametric Surfaces via Polyhedra

Build smooth surfaces by computing a vertex grid and stitching quads:

```openscad
function surface_point(u, v) =
    let(
        x = (10 + 3 * cos(v)) * cos(u),
        y = (10 + 3 * cos(v)) * sin(u),
        z = 3 * sin(v)
    ) [x, y, z];

nu = 40; nv = 20;
points = [for (i = [0:nu-1], j = [0:nv-1])
    surface_point(i * 360/nu, j * 360/nv)];

faces = [for (i = [0:nu-1], j = [0:nv-1])
    let(
        a = i * nv + j,
        b = ((i+1) % nu) * nv + j,
        c = ((i+1) % nu) * nv + (j+1) % nv,
        d = i * nv + (j+1) % nv
    ) [a, b, c, d]
];

polyhedron(points=points, faces=faces);
```

## Mathematical Surface Gallery

### Torus

```openscad
rotate_extrude($fn=64)
    translate([15, 0, 0])
      circle(r=5, $fn=32);
```

### Möbius-like Strip (approximation)

```openscad
n = 80;
w = 3;
R = 15;
points = [for (i = [0:n-1], s = [-1, 1])
    let(
        a = i * 360/n,
        ha = a / 2,
        x = (R + s * w * cos(ha)) * cos(a),
        y = (R + s * w * cos(ha)) * sin(a),
        z = s * w * sin(ha)
    ) [x, y, z]
];
faces = [for (i = [0:n-1])
    let(
        a = i * 2,
        b = i * 2 + 1,
        c = ((i+1) % n) * 2 + 1,
        d = ((i+1) % n) * 2
    ) [a, d, c, b]
];
polyhedron(points=points, faces=faces);
```

### Wavy Bowl

```openscad
$fn = 64;
n_pts = 60;
difference() {
    rotate_extrude()
        polygon([for (i = [0:n_pts])
            let(a = i * 180/n_pts,
                r = 20 + 3 * sin(a * 5),
                z = 15 * cos(a))
            [r, z]
        ]);
    translate([0, 0, 3])
      scale([0.9, 0.9, 1])
        rotate_extrude()
          polygon([for (i = [0:n_pts])
              let(a = i * 180/n_pts,
                  r = 20 + 3 * sin(a * 5),
                  z = 15 * cos(a))
              [r, z]
          ]);
}
```

## Star Polyhedra

Generate star-shaped cross-sections and extrude:

```openscad
function star(n, r1, r2) = [
    for (i = [0:2*n-1])
        let(a = i * 180/n, r = (i % 2 == 0) ? r1 : r2)
        [r * cos(a), r * sin(a)]
];

linear_extrude(height=10, twist=30, slices=40)
    polygon(star(6, 15, 8));
```

## Gear-Like Forms

```openscad
module gear_profile(n_teeth=12, outer_r=15, inner_r=12) {
    step = 360 / n_teeth;
    union() {
        circle(r=inner_r);
        for (i = [0:n_teeth-1])
            rotate([0, 0, i * step])
              translate([0, -1.5, 0])
                square([outer_r, 3]);
    }
}

linear_extrude(height=5)
    gear_profile(16, 20, 16);
```

## Techniques for Smooth Organic Surfaces

When exact parametric surfaces are too complex, approximate with:

1. **Hull chains** between positioned spheres
2. **Minkowski** with small spheres for edge rounding
3. **Rotate extrude** of computed profiles
4. **Linear extrude with twist** for helical forms
5. **Stacked cross-sections** with hull between adjacent pairs
