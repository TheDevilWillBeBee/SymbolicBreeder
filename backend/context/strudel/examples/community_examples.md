# Community Strudel Songs — Curated Examples

A collection of real Strudel programs from the community, curated to show diverse styles and techniques.

## Simple Drum Patterns

### Basic Rock Beat
```strudel
s("bd sd bd sd, hh*8")
```

### House Beat
```strudel
s("bd*4, ~ sd ~ sd, hh*8").bank("RolandTR909")
```

### Hip Hop Beat
```strudel
$: stack(
  sound("hh").struct("<[1 0]*8 [[1*2 [1 0]] [1 0]!5 [1*2 [1 0]] [1 0]]>").gain("[0.4 .6]*4"),
  sound("sd").struct("<[0 0 3 0]!2>"),
  sound("bd").struct("<[1 0!5 1 0!5 1 0!3]>")
).bank("tr606")
```

### DnB Beat
```strudel
setCpm(170/4)
$: stack(
  s("bd:1").beat("0,7?,10",16).duck("3:4:5"),
  s("sd:2").beat("4,12",16),
  s("hh:4!8")
)
```

### West African Bell Pattern
```strudel
setcpm(134/4)
stack(
  s("bd:3(<4!7 <3 6>>,12)"),
  s("sd:3(<2!3 3>,12,3)"),
  s("hh:3(2,3,1)*4"),
  s("rim(1,3,2)*4"),
  s("perc:2(7,12,3)")
).bank("BossDR550")
  .lpf(rand.rangex(550,20000).fast(12))
```

## Melodic Patterns

### Ambient Piano Phase
```strudel
setcpm(18)
let bass = note("[<C3 B2 A2 B2> G3]*2").s('gm_acoustic_guitar_nylon').legato(2)
let phrase1 = note("[- E4 G4 E4@2 E4 G4 E4@2 C4 F4 E4 D4@4]/2")
$: stack(bass, phrase1)
```

### Sawtooth Bass
```strudel
note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600).gain(0.6)
```

### Synth Melody with Effects
```strudel
note("c4 e4 g4 c5").s("triangle").delay(0.3).delaytime(0.125).room(0.3)
```

### Scale-based Melody
```strudel
n("0 2 4 6 [8 7] [6 5] [4 3] [2 1]").scale("C:minor").s("piano").room(0.5)
```

### FM Synth Lead
```strudel
note("e4 [b3 c4] d4 a3").s("sine").fm(3).fmh(2).lpf(2000).delay(0.3)
```

## Multi-Layer Compositions

### Minimal Techno
```strudel
setcpm(120)
$: s("bd*4").duck("2:3").duckdepth(.8).duckattack(.2)
$: s("[- <- cp:1>]*2")
$: s("hh*8").gain("[0.5 0.3]*4")
$: note("<c2 c2 eb2 f2>").s("sawtooth").lpf(400).gain(0.6)
```

### Ambient Dub
```strudel
setcpm(60)
$: note("c3 [eb3 g3] bb2 [f3 ab3]").s("triangle").room(0.8).delay(0.5).delayfeedback(0.6)
$: s("bd ~ sd ~").room(0.3)
$: s("hh*4").gain(perlin.range(0.2, 0.6)).pan(rand)
```

### Chord Progression with Voicing
```strudel
setcpm(90/4)
let chords = chord("<Am F Gadd9 [Dm Em]>")
$: chords.voicing().s("gm_epiano1").room(0.5)
$: note("<a2 f2 g2 d2>").s("sawtooth").lpf(500).gain(0.5)
$: s("bd sd bd sd, hh*8").bank("RolandTR909").gain(0.5)
```

### Euclidean Rhythms
```strudel
setcpm(30)
stack(
  note("<[c2,c1] [ab0,ab1] [f0,f1] [g0,g1]>")
    .euclidRot(3,16,14).sound("gm_synth_bass_2:1").decay(1.2).room(1).gain(1.6),
  note("<eb4 f4 g4 d4>")
    .euclidLegatoRot(3,16,14).sound("sine").fm(1).crush(sine.range(7,14).slow(20)).gain(0.35)
)
```

### Supersaw Chords with Drums
```strudel
setcpm(20)
$: stack(
  s("bd:4").struct("x <x -> - <- x> - - - - x - x <- x> -"),
  s("sd:5").struct("- - - - x - - x").gain(.5),
  s("hh:4").struct("x x x - x - x x").gain(.75)
).room(".4:.5").cutoff(perlin.range(2000,3000).slow(3))
$: s("supersaw, sine").n("<<0!3 [-2 -1]> <3!3 [3 4]>>")
  .scale("c2:major").seg(16).clip(.9).cutoff(perlin.range(1000,4000).slow(2))
```

### Outrun Synthwave
```strudel
setcps(1)
stack(
  note("[f3 ab3 g3] [eb3 g3 c3] [f3 bb3 ab3] [eb3 c3 g3 f3]")
    .slow(4).euclidRot(4,16,2).sound("sawtooth").lpf(800).decay(0.12).pan(0.3)
    .delay(sine.range(0,0.75).slow(10)),
  note("[c1,c2]").sound("sawtooth").lpf(200).gain(0.6).slow(4),
  s("bd*4, ~ cp ~ cp, hh*8").gain(0.5)
)
```

### Arranged Song Structure
```strudel
setcpm(140/4)
let BASS = note("<[c5 ~ ~ a5] [g5 e5 c5 ~]>").sound("triangle").lpf(300)
let PIANO = note("<[a2,c3,e3,g3] [f3, a3, c3, e3]>").sound("piano").room(0.5)
let DRUMS = n("<1 2> 1 <2 3> 1").sound("bd hh sd hh").bank("RolandTR808")
arrange(
  [4, stack(BASS, PIANO)],
  [4, stack(BASS, PIANO, DRUMS)],
  [2, stack(BASS, PIANO)],
  [9999, silence]
)
```

### Darkles — Random + Manual
```strudel
setcpm(140/4)
var scale = "E:minor"
const SYNTH = n(irand(10).seg(0.5).add("[0 3]/4").add("0, 2, 4")).scale(scale)
  .sound("gm_synth_strings_1").attack("0.4").sustain("3").distort("2:.4").gain(0.4)
const KICK = s("bd:4(<3 5>,8)").bank("Linn9000").gain(0.8)
const SNARE = s("sd:3").struct("<[~ x]!8 [~ x ~ [x x]]>").gain(0.7)
const HIGHHAT = s("hh*8").gain("[0.4 0.6]*4")
$: arrange(
  [4, stack(SYNTH)],
  [4, stack(SYNTH, KICK, HIGHHAT)],
  [4, stack(SYNTH, KICK, HIGHHAT, SNARE)],
  [9999, silence]
)
```
