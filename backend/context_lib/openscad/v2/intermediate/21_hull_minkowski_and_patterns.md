# Hull, Minkowski, Extrusion, and Patterns

## Hull

`hull()` computes the convex hull of its children — useful for organic, smooth, and bridging shapes:

```openscad
hull() {
    sphere(r=5);
    translate([20, 0, 10]) sphere(r=3);
}
```

Hull between multiple primitives creates smooth transitions:

```openscad
hull() {
    cube([20, 20, 2], center=true);
    translate([0, 0, 15]) sphere(r=5);
}
```

## Minkowski Sum

`minkowski()` inflates one shape by sweeping another along its surface. Great for rounding edges:

```openscad
minkowski() {
    cube([20, 20, 10], center=true);
    sphere(r=2);
}
```

Minkowski with a cylinder for uniform edge rounding:

```openscad
minkowski() {
    cube([15, 15, 5], center=true);
    cylinder(h=0.01, r=2);
}
```

**Note:** Minkowski is computationally expensive. Keep child geometry simple.

## Linear Extrude

Extrude 2D shapes into 3D with optional twist and scale:

```openscad
linear_extrude(height=30, twist=90, slices=60)
    square([10, 10], center=true);
```

Tapered extrusion:

```openscad
linear_extrude(height=25, scale=0.3)
    circle(r=12);
```

## Rotate Extrude

Spin a 2D profile around the Z axis to create solids of revolution:

```openscad
rotate_extrude($fn=64)
    translate([10, 0, 0])
      circle(r=3);
```

Partial rotation for arches and rings:

```openscad
rotate_extrude(angle=270, $fn=64)
    translate([15, 0, 0])
      square([3, 5], center=true);
```

## Custom 2D Profiles

Use `polygon()` for arbitrary cross-sections:

```openscad
linear_extrude(height=20)
    polygon(points=[
        [0, 0], [10, 0], [8, 5],
        [10, 10], [0, 10], [2, 5]
    ]);
```

## Text

Add 3D text using `text()` inside extrusion:

```openscad
linear_extrude(height=3)
    text("SCAD", size=12, halign="center", valign="center");
```

## Radial Patterns

Distribute elements in a circle:

```openscad
module radial(n, radius) {
    for (i = [0:n-1])
        rotate([0, 0, i * 360/n])
          translate([radius, 0, 0])
            children();
}

radial(12, 20) {
    hull() {
        cube([2, 2, 8], center=true);
        translate([0, 0, 10]) sphere(r=1.5);
    }
}
```

## Grid Patterns

Regular and offset grids:

```openscad
// Hex-offset grid
for (y = [0:5])
  for (x = [0:5]) {
    offset_x = (y % 2 == 0) ? 0 : 4;
    translate([x * 8 + offset_x, y * 7, 0])
      cylinder(h = 3 + sin(x * 60 + y * 45) * 2, r=3);
  }
```

## Spiral Patterns

```openscad
for (i = [0:60]) {
    a = i * 15;
    r = 2 + i * 0.3;
    translate([r * cos(a), r * sin(a), i * 0.3])
      color([i/60, 0.5, 1 - i/60])
        sphere(r = 0.8 + i * 0.02);
}
```

## Organic Forms via Hull Chains

Chain hull between successive elements for smooth organic forms:

```openscad
module hull_chain() {
    for (i = [0:$children-2])
        hull() {
            children(i);
            children(i+1);
        }
}

hull_chain() {
    sphere(r=5);
    translate([10, 5, 8]) sphere(r=3);
    translate([20, -3, 12]) sphere(r=4);
    translate([30, 2, 8]) sphere(r=2);
}
```

## Twisted Extrusion Patterns

Combine twist with complex 2D shapes for interesting solids:

```openscad
linear_extrude(height=40, twist=180, slices=100, scale=0.5)
    difference() {
        circle(r=12);
        for (i = [0:2])
            rotate([0, 0, i * 120])
              translate([6, 0, 0])
                circle(r=4);
    }
```
