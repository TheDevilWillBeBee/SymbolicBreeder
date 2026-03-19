# Modules, Loops, and Parametric Design

## Parameterized Modules

Modules are reusable geometry generators:

```openscad
module pillar(h=20, r=3) {
    color("White") cylinder(h=h, r=r);
    color("Gold") translate([0, 0, h])
        cylinder(h=2, r1=r, r2=r+1.5);
}

pillar(h=30, r=4);
translate([20, 0, 0]) pillar(h=15, r=2);
```

## Modules with Children

Modules can transform their children:

```openscad
module ring_of(n=6, r=15) {
    for (i = [0:n-1]) {
        rotate([0, 0, i * 360/n])
          translate([r, 0, 0])
            children();
    }
}

ring_of(8, 20) cube([3, 3, 10], center=true);
```

## For Loops

Loops generate repeated geometry with variation:

```openscad
for (i = [0:7]) {
    rotate([0, 0, i * 45])
      translate([15, 0, i * 2])
        color([i/8, 0.5, 1 - i/8])
          sphere(r = 2 + i * 0.3);
}
```

## Nested Loops for Grids

```openscad
for (x = [-2:2], y = [-2:2]) {
    translate([x * 8, y * 8, 0])
      color([(x+2)/4, (y+2)/4, 0.5])
        cube([5, 5, 3 + abs(x) + abs(y)], center=true);
}
```

## Conditional Geometry

Use `if` inside loops for selective placement:

```openscad
for (i = [0:11]) {
    rotate([0, 0, i * 30])
      translate([15, 0, 0]) {
        if (i % 2 == 0)
            color("SteelBlue") cylinder(h=10, r=2);
        else
            color("Coral") cube([3, 3, 6], center=true);
      }
}
```

## Functions for Computed Values

Functions return values (not geometry):

```openscad
function wave(t, amp=5, freq=1) = amp * sin(t * freq * 360);

for (i = [0:30]) {
    translate([i * 3, wave(i/30), 0])
      color([i/30, 0.5, 1 - i/30])
        sphere(r = 1.5);
}
```

## Recursive Modules

Build fractal or branching structures:

```openscad
module branch(len, depth) {
    if (depth > 0) {
        color([depth/5, 0.4, 0.2])
          cylinder(h=len, r=depth * 0.5);
        translate([0, 0, len]) {
            rotate([0, 30, 0]) branch(len * 0.7, depth - 1);
            rotate([0, -30, 120]) branch(len * 0.7, depth - 1);
            rotate([0, -30, 240]) branch(len * 0.7, depth - 1);
        }
    }
}

branch(20, 4);
```

## Let Expressions

Use `let()` for local variable bindings in list comprehensions:

```openscad
points = [for (i = [0:36])
    let(a = i * 10, r = 10 + 5 * sin(a * 3))
    [r * cos(a), r * sin(a)]
];
polygon(points);
```

## Parametric Design Pattern

Design models as configurable systems:

```openscad
// Parameters
height = 40;
base_r = 15;
n_fins = 6;
fin_height = 25;
fin_thickness = 1.5;

// Base
color("DarkSlateGray")
  cylinder(h=3, r=base_r);

// Core column
color("SteelBlue")
  translate([0, 0, 3])
    cylinder(h=height, r=base_r * 0.3);

// Radial fins
for (i = [0:n_fins-1]) {
    rotate([0, 0, i * 360/n_fins])
      color("Coral")
        translate([0, -fin_thickness/2, 3])
          cube([base_r * 0.8, fin_thickness, fin_height]);
}
```
