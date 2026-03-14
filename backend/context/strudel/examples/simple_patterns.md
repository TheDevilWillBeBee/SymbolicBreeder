
# Simple Strudel Patterns — For Seed Generation

Short, atomic patterns showing individual parts. These can be combined and evolved into full compositions.

## Drum Patterns

```strudel
setcpm(120/4)
$: s("bd sd bd sd, hh*8").bank("RolandTR909")._scope()
```

```strudel
setcpm(130/4)
$: s("bd*4, ~ sd ~ sd, hh*8").bank("RolandTR808")._scope()
```

```strudel
setcpm(100/4)
$: s("bd [~ bd] sd [~ sd:2], hh*4").slow(2)._scope()
```

```strudel
setcpm(140/4)
$: s("bd:4(<3 5>,8), sd(2,8,1), hh*8").bank("RolandTR909")._scope()
```

```strudel
setcpm(170/4)
$: stack(
  s("bd:1").beat("0,7?,10",16),
  s("sd:2").beat("4,12",16),
  s("hh:4!8")
)._scope()
```

```strudel
setcpm(120/4)
$: s("bd*4").duck("2:3").duckdepth(.8).duckattack(.2)._scope()
$: s("[~ <~ cp:1>]*2")._scope()
$: s("hh*8").gain("[0.5 0.3]*4")._scope()
```

## Bass Patterns

```strudel
setcpm(120/4)
$: note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600).gain(0.6)._pianoroll()
```

```strudel
setcpm(130/4)
$: note("<d2 d2 c2 a1>*2").s("triangle").lpf(400).gain(0.7)._pianoroll()
```

```strudel
setcpm(100/4)
$: note("<[c2 c3]*4 [bb1 bb2]*4 [f2 f3]*4 [eb2 eb3]*4>").s("gm_synth_bass_1").lpf(800)._pianoroll()
```

```strudel
setcpm(90/4)
$: note("<a1 e2 f2 g2>").s("sawtooth").lpf(500).gain(0.5)._pianoroll()
```

## Melodic Patterns

```strudel
setcpm(100/4)
$: n("0 2 4 <[6,8] [7,9]>").scale("C4:minor").s("piano").room(0.5)._pianoroll()
```

```strudel
setcpm(90/4)
$: note("c4 e4 g4 c5").s("triangle").delay(0.3).delaytime(0.125).room(0.3)._pianoroll()
```

```strudel
setcpm(120/4)
$: n("0 [2 4] <3 5> [~ <4 1>]").scale("D4:minor").s("gm_xylophone").room(0.4).delay(0.125)._pianoroll()
```

```strudel
setcpm(80/4)
$: note("e4 [b3 c4] d4 a3").s("sine").fm(3).fmh(2).lpf(2000).delay(0.3)._pianoroll()
```

## Chord Patterns

```strudel
setcpm(90/4)
$: chord("<Am F C G>").voicing().s("gm_epiano1").room(0.5)._pianoroll()
```

```strudel
setcpm(100/4)
$: chord("<Dm7 G7 Cmaj7 Fmaj7>").voicing().s("gm_epiano1").room(0.5).delay(0.25)._pianoroll()
```

```strudel
setcpm(120/4)
$: note("[c3,e3,g3] [f3,a3,c4] [g3,b3,d4] [c3,e3,g3]").s("triangle").room(0.5)._pianoroll()
```

```strudel
setcpm(85/4)
$: n("[0,2,4] [1,3,5]").scale("<D:dorian G:mixolydian C:dorian F:mixolydian>").s("gm_epiano1").room(0.4)._pianoroll()
```

## Simple Combined (2-Part)

```strudel
setcpm(120/4)
var scale = "C:minor"
$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")._scope()
$: note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600).gain(0.6)._pianoroll()
```

```strudel
setcpm(90/4)
var scale = "D:minor"
$: s("bd ~ sd ~, hh*4").bank("RolandTR707")._scope()
$: note("<d2 a2 bb2 g2>").s("triangle").lpf(400).gain(0.7)._pianoroll()
```

```strudel
setcpm(100/4)
$: s("bd sd bd sd, hh*8")._scope()
$: chord("<Am F C G>").voicing().s("gm_epiano1").room(0.5)._pianoroll()
```