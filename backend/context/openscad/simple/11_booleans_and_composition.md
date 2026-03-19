# Booleans and Composition

## Difference for Carving

`difference()` subtracts the second and subsequent children from the first:

```openscad
difference() {
    cube([20, 20, 20], center=true);
    sphere(r=13);
}
```

This creates a cube with a spherical cavity.

## Intersection for Shared Volume

`intersection()` keeps only the volume shared by all children:

```openscad
intersection() {
    cube([15, 15, 15], center=true);
    sphere(r=10);
}
```

This creates a rounded cube effect.

## Nested Booleans for Complex Forms

Combine operations to build up complexity:

```openscad
difference() {
    union() {
        cube([20, 20, 5], center=true);
        translate([0, 0, 5]) cylinder(h=10, r=8);
    }
    // Cut a hole through everything
    cylinder(h=50, r=4, center=true);
}
```

## Hollow Objects

Create shells by subtracting a slightly smaller version:

```openscad
difference() {
    sphere(r=15);
    sphere(r=13);
    // Cut an opening
    translate([0, 0, 10]) cube([30, 30, 10], center=true);
}
```

## Pattern Through Subtraction

Cut repeating holes for decorative patterns:

```openscad
difference() {
    cylinder(h=5, r=20, center=true);
    for (i = [0:11]) {
        rotate([0, 0, i * 30])
          translate([12, 0, 0])
            cylinder(h=10, r=2, center=true);
    }
}
```

## Interlocking Parts

Design parts that fit together using complementary booleans:

```openscad
// Base with peg
union() {
    cube([20, 20, 5], center=true);
    translate([0, 0, 5]) cylinder(h=5, r=3);
}

// Cap with hole (shown offset)
translate([30, 0, 0])
difference() {
    cube([20, 20, 5], center=true);
    translate([0, 0, -3]) cylinder(h=8, r=3.2);
}
```

## Layered Color Composition

Build models from distinct colored regions:

```openscad
// Pedestal
color("DarkSlateGray") cube([30, 30, 3], center=true);
// Column
color("White") translate([0, 0, 3]) cylinder(h=20, r=4);
// Capital
color("Gold") translate([0, 0, 23]) cylinder(h=3, r1=4, r2=6);
// Orb
color("Coral") translate([0, 0, 28]) sphere(r=5);
```

## Compositional Thinking

Good 3D models usually have:

1. **Primary mass** — the dominant shape that defines silhouette
2. **Secondary detail** — smaller elements that add interest
3. **Negative space** — holes, cavities, or cutouts that create rhythm
4. **Material contrast** — different colors suggest different materials
5. **Ground relationship** — how the object meets its base plane
