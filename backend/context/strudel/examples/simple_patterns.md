# Simple Strudel Patterns — For Seed Generation

Short, atomic patterns ideal for the initial generation (gen-0) in evolutionary breeding.

## Drums

```strudel
s("bd sd bd sd")
```

```strudel
s("bd*4, ~ sd ~ sd, hh*8")
```

```strudel
s("bd [~ bd] sd [~ sd:2]").slow(2)
```

```strudel
s("bd:3 [sd:1 sd:2] bd:0 sd:5").speed(1.2)
```

```strudel
s("bd sd:1 [bd bd] sd:2")
```

```strudel
s("hh*8").gain("[0.8 0.5]*4")
```

```strudel
s("hh*16").gain("[1 0.5 0.7 0.3]*4")
```

```strudel
s("bd*2, ~ sd, hh*4")
```

```strudel
s("bd(3,8), sd(2,8,1), hh*8").bank("RolandTR909")
```

```strudel
s("[bd,cr] sd [bd <- bd>] sd, hh*8").bank("RolandTR808")
```

## Melodies

```strudel
note("c3 eb3 g3 bb3").s("sawtooth").cutoff(800)
```

```strudel
note("c4 e4 g4 c5").s("triangle").delay(0.3).delaytime(0.125)
```

```strudel
note("e4 [b3 c4] d4 a3").s("sine").room(0.5)
```

```strudel
note("<c3 e3 g3 b3>/2").s("square").lpf(1200)
```

```strudel
note("a2 c3 e3 a3").s("sawtooth").cutoff(sine.range(200,2000).slow(4))
```

```strudel
note("c3 g3 c4 g3").s("triangle")
```

```strudel
note("<c4 d4 e4 f4 g4>*2").s("square").lpf(800).room(0.2)
```

```strudel
note("g3 a3 b3 d4").s("sawtooth").cutoff(1000).gain(0.5)
```

```strudel
note("c3 [eb3 g3] bb2 [f3 ab3]").s("triangle").room(0.4)
```

```strudel
n("0 2 4 6 8").scale("C:minor").s("piano")
```

## Bass

```strudel
note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600).gain(0.6)
```

```strudel
note("c2 c2 g2 g2").s("sawtooth").lpf(400).gain(0.5)
```

```strudel
note("<c1 g1 ab1 f1>").s("triangle").lpf(300).gain(0.8)
```

```strudel
note("c2*8").s("sine").gain("[.3 .5]*4").lpf(500)
```

## Chords

```strudel
note("[c3,e3,g3] [d3,f3,a3]").s("sine").room(0.3)
```

```strudel
note("[c3,e3,g3] [f3,a3,c4] [g3,b3,d4] [c3,e3,g3]").s("triangle").room(0.5)
```

```strudel
chord("<Am F C G>").voicing().s("gm_epiano1").room(0.5)
```

## Combined

```strudel
s("bd ~ sd ~, hh*4").gain(0.8)
```

```strudel
s("bd*2, ~ sd, hh*4").room(0.3).gain(0.7)
```

```strudel
stack(s("bd sd bd sd"), note("c2 g2").s("sawtooth").lpf(400))
```
