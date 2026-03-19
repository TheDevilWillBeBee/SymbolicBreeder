# Primitives and Transforms

## Centered vs Corner-Origin Primitives

By default, `cube()` places its corner at the origin. Use `center=true` for symmetric designs:

```openscad
cube([20, 20, 5], center=true);
```

Spheres and cylinders are already centered on their axis:

```openscad
cylinder(h=20, r=5, center=true);
```

## Combining Transforms

Transforms compose by nesting. Read from inside out:

```openscad
translate([10, 0, 0])
  rotate([0, 0, 45])
    cube([5, 5, 5], center=true);
```

This first rotates the cube 45° around Z, then translates it 10 units along X.

## Scaling for Proportion

Use non-uniform scale to stretch primitives into new shapes:

```openscad
scale([1, 1, 2]) sphere(r=10);  // tall ellipsoid
```

```openscad
scale([2, 1, 0.3]) sphere(r=10);  // flat disc shape
```

## Mirror for Symmetry

Create bilateral symmetry efficiently:

```openscad
module half_shape() {
    translate([5, 0, 0]) sphere(r=3);
}
half_shape();
mirror([1, 0, 0]) half_shape();
```

## Color as Design Tool

Apply color at different nesting levels for multi-colored models:

```openscad
color("SteelBlue") translate([0, 0, 0]) cube([20, 20, 2], center=true);
color("Coral") translate([0, 0, 5]) sphere(r=4);
color("Gold") translate([0, 0, 10]) cylinder(h=3, r1=3, r2=0);
```

## Building Height with Stacking

Stack elements vertically for towers, columns, or layered forms:

```openscad
for (i = [0:4]) {
    translate([0, 0, i * 6])
      color([i/5, 0.3, 1 - i/5])
        cube([10 - i, 10 - i, 5], center=true);
}
```

## Rotation for Radial Placement

Place objects in a circle using rotation:

```openscad
for (i = [0:5]) {
    rotate([0, 0, i * 60])
      translate([15, 0, 0])
        sphere(r=3);
}
```

## Resize for Exact Dimensions

Use `resize()` when you need exact bounding dimensions:

```openscad
resize([20, 20, 40]) sphere(r=1);
```

## Preferred Composition Approach

1. Start with a primary form (the "body")
2. Add secondary forms for detail or contrast
3. Use color to distinguish functional regions
4. Use symmetry or repetition for visual coherence
5. Keep the model centered for good preview framing
