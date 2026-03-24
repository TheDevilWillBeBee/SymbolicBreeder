# Generative Structures and Optimization

## L-System Style Branching

Build tree-like or coral-like structures with recursive modules:

```openscad
module tree(len, thickness, depth, spread=25) {
    if (depth > 0) {
        color([0.4, 0.2 + depth * 0.1, 0.1])
          cylinder(h=len, r1=thickness, r2=thickness * 0.7);
        translate([0, 0, len]) {
            for (a = [0, 120, 240]) {
                rotate([0, 0, a])
                  rotate([spread, 0, 0])
                    tree(len * 0.65, thickness * 0.6, depth - 1, spread + 5);
            }
        }
    } else {
        color("LimeGreen") sphere(r=thickness * 2);
    }
}

tree(15, 2, 4);
```

## Fractal Structures

### Sierpinski-Style Subdivision

```openscad
module sierpinski(size, depth) {
    if (depth == 0) {
        cube([size, size, size], center=true);
    } else {
        s3 = size / 3;
        for (x = [-1, 0, 1], y = [-1, 0, 1], z = [-1, 0, 1]) {
            count = (x == 0 ? 1 : 0) + (y == 0 ? 1 : 0) + (z == 0 ? 1 : 0);
            if (count < 2)
                translate([x * s3, y * s3, z * s3])
                  sierpinski(s3, depth - 1);
        }
    }
}

sierpinski(30, 2);
```

### Recursive Frame

```openscad
module frame(size, depth) {
    if (depth == 0) {
        cube([size, size, size], center=true);
    } else {
        difference() {
            cube([size, size, size], center=true);
            s = size * 0.55;
            cube([s, s, size * 1.1], center=true);
            cube([s, size * 1.1, s], center=true);
            cube([size * 1.1, s, s], center=true);
        }
    }
}

frame(30, 1);
```

## Voronoi-Like Patterns

Approximate Voronoi by subtracting many cylinders from a plate:

```openscad
module pseudo_voronoi(n=30, plate_r=25, hole_r=1.5, seed=42) {
    difference() {
        cylinder(h=2, r=plate_r, center=true, $fn=64);
        for (i = [0:n-1]) {
            a = (i * 137.508) % 360;
            r = sqrt(i / n) * plate_r * 0.9;
            translate([r * cos(a), r * sin(a), 0])
              cylinder(h=5, r=hole_r, center=true, $fn=12);
        }
    }
}

pseudo_voronoi();
```

## Lattice and Truss Structures

```openscad
module strut(p1, p2, r=0.5) {
    v = p2 - p1;
    h = norm(v);
    ax = (h == 0) ? [0, 0, 0] : 
         (v[0] == 0 && v[1] == 0) ? [0, 0, 0] :
         cross([0, 0, 1], v / h);
    ang = (h == 0) ? 0 : acos(v[2] / h);
    translate(p1)
      rotate(a=ang, v=ax)
        cylinder(h=h, r=r, $fn=8);
}

// Simple space frame
s = 10;
corners = [
    [0,0,0], [s,0,0], [s,s,0], [0,s,0],
    [s/2,s/2,s*0.8]
];
edges = [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]];

for (e = edges) strut(corners[e[0]], corners[e[1]], 0.5);
for (c = corners) translate(c) sphere(r=1, $fn=16);
```

## Phyllotaxis and Golden Angle Patterns

```openscad
n = 200;
for (i = [1:n]) {
    a = i * 137.508;
    r = 2 * sqrt(i);
    z = i * 0.1;
    translate([r * cos(a), r * sin(a), z])
      color([i/n, 0.8, 0.3])
        sphere(r = 0.5 + i/n, $fn=12);
}
```

## Performance Optimization

### Reduce $fn Where Possible

Use lower $fn for non-focal geometry:

```openscad
// Main subject — high quality
color("Gold") sphere(r=10, $fn=64);

// Background elements — lower quality
for (i = [0:20])
    translate([cos(i*30)*25, sin(i*30)*25, 0])
      sphere(r=2, $fn=12);
```

### Limit Recursion Depth

Keep recursive modules to depth 3–5. Each level multiplies geometry exponentially.

### Avoid Redundant Minkowski

Minkowski on complex geometry is expensive. Use it on simplified shapes:

```openscad
minkowski() {
    cube([20, 20, 10], center=true);
    sphere(r=1, $fn=16);
}
```

### Hull Is Cheaper Than Minkowski

Prefer `hull()` when the desired shape is convex or can be decomposed into convex parts.

## Robust Modeling Practices

1. **Manifold geometry**: Ensure all models are manifold (watertight). Avoid zero-thickness walls.
2. **Overlap tolerance**: When stacking shapes for `union()`, add a tiny overlap (0.01) to avoid z-fighting.
3. **Subtraction clearance**: Make cutting tools slightly larger than needed.
4. **Test incrementally**: Build complex models in stages; verify each stage.
