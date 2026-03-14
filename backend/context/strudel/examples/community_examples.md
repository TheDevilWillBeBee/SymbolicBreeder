
# Community Strudel Compositions — Curated Examples

A collection of real Strudel programs showing diverse styles, techniques, and full arrangements.

## Multi-Part Compositions

### Circuitboard Psycho (Electronic)
```strudel
setcpm(120/4)
var scale = "E:minor"
$: n("<4 0 <5 9> 0 <7 5> 0 3>*16".add("<0 <2 4>>")).scale(scale).trans("0*16".add(wchoose([0, .9], [12, .05], [-12, .05]))).s("sawtooth").o(2)._pianoroll()
$: s("bd:1!4").duck("2:3").duckdepth(.8).duckattack(.2)._scope()
$: s("[- <- cp:1>]*2")._scope()
$: n("<0>*16".add("<0 <2 4>>")).scale(scale).trans("-12*16".add(wchoose([0, .9], [12, .05], [-12, .05]))).detune(rand2).s("supersaw").o(3)._pianoroll()
```

### Violin Shots (Dark Electronic)
```strudel
setcpm(120/4)
var scale = "D:minor"

$: stack(
  n("[0] [3 2] [4 <2 6>]".fast(2)).sound("supersaw").cutoff(perlin.range(5000,8000)),
  n("0 5 3 5".slow(4)).octave(-2).sound("supersaw").hard(.6).gain(.6).att(.25).cutoff(perlin.range(5000,8000)).orbit(2)
).scale(scale)._punchcard()

$: stack(
  s("bd:4").hard(.5).room(1),
  s("sd:3").late(.5).room(1).gain(.4),
  s("sh:2*2").lpf("20000 6000").fast(6).orbit(2)
)._punchcard()

$: n(irand("<12 4>".slow(8))).struct("<[x*2 -] x*3>").fast(4).scale(scale).sound("sax_stacc").degradeBy(.25).room(1.5).delay(.4).gain(.5).orbit(2)._punchcard()
```

### Heliyatrel Electronic
```strudel
setCpm(120/4)

$: sound("[rolandtr808_bd:13]!4")._scope()
$: sound("[- rolandtr808_hh:2]!4")._scope()
$: sound("[- rolandtr808_sd:3]!2")._scope()

$: n("[0,4?]").scale("<a:minor c:major f:major g:major> <e:minor g:major c:major f:major>")
  .struct("[[1 [- 1]] [1 [- 1]] [1 [- 1]] [1 1]]/2")
  .sound("wt_digital:1").trans(-12).gain(0.8)._pianoroll()

$: n("[<0?,4,7?> <0?,4,2?>]").scale("<a:minor c:major f:major g:major> <e:minor g:major c:major f:major>")
  .struct("[1 0 0 1] [1 0 1 1] [1 0 1 0] [1 1 0 1]")
  .sound("gm_epiano1:4").room(0.2).delay(0.5).gain(0.8)._pianoroll()

$: n("[0,2,4]").scale("[a:minor c:major f:major g:major]/4")
  .struct("[1 _ _ _]")
  .sound("gm_synth_strings_1:3").attack(0.7).detune(1).lpf(734)._pianoroll()
```

### Darkles — Arranged Song (Dark Ambient)
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

### Raindrops Cover (Plucked Guitar Style)
```strudel
setCpm(140/4)

const pluck = "[[e2 b2 e3]@6*2 e2 b2 [e2 b2 g3]@6*2 e2 g3 [c2 c3 e3]@6*2 c2 e3 d2 d3 b3 d2 d3 f#3 d2 f#3]/2"

$: s("bd").bank("linn").struct("[1 0 0 0]@56*14 1 0 0 1 1 0 1 0").slow(4)._scope()
$: s("[- oh]!4").bank("RolandTR909").gain(.3).room(.66)._scope()
$: s("[hh -]!8").bank("RolandTR808").gain(.5).delay(".5")._scope()
$: s("[- - <cp, sd:1> -]!2").bank("RolandTR707").gain(.3).room(.5)._scope()

$: note("<[- e2]!4 [- c2]!2 [- d2]!2>*4").s("gm_synth_bass_1").lpf(200).gain(1.25).room(.25)._pianoroll()
$: note(pluck.add(12)).s("supersaw").room(.5).roomsize(2).detune("<.5>").delay(".25")._pianoroll()
$: note(pluck.add(24)).gain(.75).clip(.8).s("supersaw").room(.5).roomsize(2).detune("<.75>").delay(".25")._pianoroll()
$: note("[e3 [g3 a3] b3 [e4 d4] b3 [g3 a3] e3 [c3 f#3]]/8".add(12)).gain(.5).s("gm_synth_strings_1:6").room(2).roomsize(2)._pianoroll()
```

### Outrun Synthwave
```strudel
setcpm(112/4)

$: note("[f3 ab3 g3] [eb3 g3 c3] [f3 bb3 ab3] [eb3 c3 g3 f3]")
  .slow(4).euclidRot(4,16,2).sound("sawtooth").lpf(800).decay(0.12).pan(0.3)
  .delay(sine.range(0,0.75).slow(10))._pianoroll()

$: note("[f1 ~ ~ f1 ~ ~ f1 ~ ~ f1 ~ ~ f1 ~ ~ f1] [db1 ~ ~ db1 ~ ~ db1 ~ ~ eb1 ~ ~ eb1 ~ ~ eb1]")
  .slow(2).sound("gm_synth_bass_2:0").lpf(800).pan(0.4).release(0.25).room(0.2)._pianoroll()

$: s("bd!4").bank("RolandTR909").gain(0.35).room(0.15)._scope()
$: s("~ hh ~ [hh hh] ~ hh ~ hh").bank("RolandTR909").gain(0.08).crush(5)._scope()
$: s("~ sd ~ [sd ~ ~ sd]").bank("RolandTR909").gain(0.15)._scope()

$: note("[f4 g4 f4 g4 ab4 g4 f4@2] [eb4 f4 eb4 f4 c4 db4 eb4@2] [f4 g4 f4 g4 bb4 g4 ab4@2] [~ eb4 c4 bb3@2 g4@2 f4]")
  .slow(4).sound("gm_electric_guitar_clean:4").lpf(2000).pan(0.65).phaser(4).phasersweep(2000)._pianoroll()
```

### Bergheini (Minimal Techno Build)
```strudel
setcpm(150/4)

$: s("bd*4").struct("<[x ~ x x]!32 x x>").bank("Linn9000")
  .velocity("<1 ~ .05 .1>*4").compressor("-10:8:10:0.14:3").gain(.8).room(.2)
  .mask("<[1 1] 1 1 0 1!16>/32")._scope()

$: s("hh*2").struct("<[~ x]!16 x*4 x*8>").bank("OberheimDMX")
  .velocity("<[.05 .07 .08] .15>").compressor("-20:20:10:3:6").gain(.35).room(.8).roomsize(.5)
  .mask("<[0 0] 1 1 1 1!16>/32")._scope()

$: chord("<Am Am7 C Gm>/8").dict('ireal').anchor('A3').voicing()
  .sound('gm_ocarina').off(.2, x=>x.velocity("<.4 .2 .3>*16")).room(.8).delay(.1)
  .gain("<0 0 [.3 .4 .5 .6] .7 .7!16>/32")
  .mask("<[0 0] 0 1 1 1!16>/32".early(.05))._pianoroll()

$: n("[1 2 4 7]").chord("<Am Gm>/8").dict('ireal').voicing()
  .sound("sine").fm("1 3 5").fmattack(".3 .7 2").fmh("1 5 7 9").velocity(.66)
  .room("<1 3!8>/16").mask("<[0 0] 0 0 1 1!16>/32".early(.05))._pianoroll()
```

### Theres No Soul Here (Emotional Electronic)
```strudel
setcpm(91/2)

let chords = arrange(
    [16, "<Fm!3 [Fm!3 Em]>/2"],
    [16,"<Fm <Cm C>>/2"],
    [8,"<Db>/2"],
    [8,"<Gb>/2"],
).chord()

let warble = x=>x.add(note(perlin.range(0,.5)))

let guitar = chords.s("sawtooth").dict('legacy').voicing().fm(8).fmh(1.0009).gain(.25)
  .lpf(perlin.range(900,4000)).lpq(8)
  .struct("[~ x]*2").clip(.5).delay(".5:.125:.8").room(1).layer(warble)

let piano = n("<0 4 2>*[<3 2>/32]").set(chords).s('piano').dict('legacy').voicing()
  .inside(2,juxBy(.5,rev)).lpf(2000).gain(.5).room(perlin.slow(2)).layer(warble)

let bass = n("2").set(chords).anchor(chords.rootNotes(1)).dict('legacy').voicing()
  .s("gm_acoustic_bass").sometimesBy("0 .5",add(note("12")))
  .ply(2).clip(.5).ply("<1!4 [2 3]>").lpf(900).lpq(2).attack(.02).ds(".1:.5").release(.02)
  .layer(warble).gain(3)

let drums = s("bd [~@3 bd:0:.5?],~@1.02 [sd,rim],hh*4")
  .gain(.8).bank('RolandTR707').speed(.8)
  .off(-1/8, x=>x.mul(gain(.25)).degrade().speed(.7))

stack(drums, guitar, piano, bass).add(room(.25))
```

### Quteriss Exp#8 (Experimental Jazz)
```strudel
setcpm(120/4)

$: stack(
  sound("clave:3").struct("[1 1 0 0 0 0 1 0]").gain("1.5 1.8")
    .mask("<0 1 1 1 1 1 1 1>/4"),

  note("<<bb,d4,f4> <a,c4,e4> <<d4 d5>/2,f,g>*2@2>").scale("<d:minor>")
    .chop("<2!2 4!2>/16").gain(.4)
    .sound("<<gm_epiano2:2> <gm_epiano2:2,gm_pad_warm:3>>/8").room(.4)
    .lpf(saw.range(800,2600)).release(2),

  note("<bb6 a6 f6 d6>").sound("gm_celesta:3").delay(.8)
    .lpf(1000).mask("<0 0 1 1 1 1 1 1>/4").gain(.8),

  note("<<d6@2,[d4 d5]> <f6@2,<[d6 f5]>>>").scale("d:minor")
    .delay(.3).room(.2).roomsize(6).gain(1.5).fast("<2 2 4 2>/4")
    .sound("gm_electric_guitar_muted").lpf(1600)
    .mask("<0 0 0 0 1 1 1 1>/4")
)._pianoroll()
```

### Heliyatrel Bass-Driven
```strudel
setCpm(135/4)

$: note("<[f1 f2]*4 [ds1 ds2]*4 [db1 db2]*4 [c1 c2 c1 c2 d1 d2 e1 e2]>").sound("wt_digital").lpf("200 400").gain(2)._pianoroll()
$: sound("circuitsdrumtracks_bd*4").gain(0.75)._scope()
$: sound("[~ circuitsdrumtracks_sd]*2").gain(0.75)._scope()
$: sound("circuitsdrumtracks_hh*8").gain("[0.05 0.2]*4")._scope()
$: sound("[~@12 circuitsdrumtracks_sd]").gain(0.5)._scope()
$: note("[[f1 ~@1]!4 [g#1 ~@1]!4 [bb1 ~@1]!4 [c2 ~@1]!4]*0.25").sound("supersaw").gain(0).room(1.5).delay(0.75).lpf("600 800 400 1000")._pianoroll()
$: note("[~ [<[f3,ab3,c4,eb4]!2 [f3,ab3,c4,d4]!2 [f3,ab3,c4,eb4]!2 [e3,f3,a3,c4,e4]!2> ~]]*2").sound("gm_electric_guitar_muted").delay("0.8:0.6:0.5").gain(0.5)._pianoroll()
```

## Simple but Effective Patterns

### Minimal Techno
```strudel
setcpm(120/4)
$: s("bd*4").duck("2:3").duckdepth(.8).duckattack(.2)._scope()
$: s("[- <- cp:1>]*2")._scope()
$: s("hh*8").gain("[0.5 0.3]*4")._scope()
$: note("<c2 c2 eb2 f2>").s("sawtooth").lpf(400).gain(0.6)._pianoroll()
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
).bank("BossDR550").lpf(rand.rangex(550,20000).fast(12))._scope()
```

### Ambient Dub
```strudel
setcpm(60/4)
var scale = "C:minor"
$: note("c3 [eb3 g3] bb2 [f3 ab3]").s("triangle").room(0.8).delay(0.5).delayfeedback(0.6)._pianoroll()
$: s("bd ~ sd ~").room(0.3)._scope()
$: s("hh*4").gain(perlin.range(0.2, 0.6)).pan(rand)._scope()
```

### Chord Progression with Voicing
```strudel
setcpm(90/4)
let chords = chord("<Am F Gadd9 [Dm Em]>")
$: chords.voicing().s("gm_epiano1").room(0.5)._pianoroll()
$: note("<a2 f2 g2 d2>").s("sawtooth").lpf(500).gain(0.5)._pianoroll()
$: s("bd sd bd sd, hh*8").bank("RolandTR909").gain(0.5)._scope()
```

### Euclidean Rhythms
```strudel
setcpm(30/4)
stack(
  note("<[c2,c1] [ab0,ab1] [f0,f1] [g0,g1]>").euclidRot(3,16,14).sound("gm_synth_bass_2:1").decay(1.2).room(1).gain(1.6),
  note("<eb4 f4 g4 d4>").euclidLegatoRot(3,16,14).sound("sine").fm(1).crush(sine.range(7,14).slow(20)).gain(0.35)
)._pianoroll()
```

### Supersaw Chords with Drums
```strudel
setcpm(120/4)
$: stack(
  s("bd:4").struct("x <x -> - <- x> - - - - x - x <- x> -"),
  s("sd:5").struct("- - - - x - - x").gain(.5),
  s("hh:4").struct("x x x - x - x x").gain(.75)
).room(".4:.5").cutoff(perlin.range(2000,3000).slow(3))._scope()
$: s("supersaw, sine").n("<<0!3 [-2 -1]> <3!3 [3 4]>>").scale("c2:major").seg(16).clip(.9).cutoff(perlin.range(1000,4000).slow(2))._pianoroll()
```

### Pastoral II (Classical Guitar)
```strudel
setcpm(18)
let bass = note("[<C3 B2 A2 B2> G3]*2").s('gm_acoustic_guitar_nylon').legato(2)
let phrase1 = note("[- E4 G4 E4@2 E4 G4 E4@2 C4 F4 E4 D4@4]/2")
let phrase2 = note("[- E4 G4 E4@1.5 G4@0.5 E4 G4 E4@2 C4 F4 E4 D4@4]/2")
let phrase3 = note("[- C5 G4 E4 A4 G4 D4@2]")

arrange(
  [2,stack(bass,phrase1)],
  [2,stack(bass,phrase2)],
  [2,stack(bass,phrase3)],
  [9999, silence]
).s('gm_acoustic_guitar_nylon').add(note(perlin.range(0,.05))).legato(2)
```

### Oleander (Latin Percussion)
```strudel
setcpm(143/4)

$: s("bd [bd bd - bd], sd(2,4,1), hh*8")._scope()
$: s("-!7 [- [sd*12]@3]").gain(rand.range(0.5,0.9)).slow(8)._scope()

$: note("[d3@ a1 a2][a1 e1@2 d1][- cs2 a1 ds1][a2 c1@3]").s("sawtooth").legato(0.5)
  .distort(3)
  .lpf(sine.range("<600!8 400!8 300!8 600!8 800!8 400!8>","<700!8 800!8 1200!8 1700!8 2400!8 800!8>").slow(2))
  .lpq(rand.range(4,"<[18 25 36 25 10 20 15 9 32 12 10 20 12 18]!3 [10 25 10 9 10 10 10 10 40 10 32]>"))
  .gain(rand.range(0.5,0.9))._pianoroll()
```

### The Arrangement (World Music)
```strudel
setcpm(120/4)

$: stack(
  s("bd:4").beat("0,8?,10,12?",16),
  s("sd:6 clap:0?").beat("4,12",16),
  s("hh:4!8"),
  s("cowbell:3!2").gain(1.5)
)._scope()

$: arrange(
  [4, s("- - - -")],
  [32, n("0 [1 <2 -1>] 0 <[3 -2] -1 [-1 7]>?").scale("c#3:phrygian").s("gm_fretless_bass:1").gain(1.5)]
)._pianoroll()

let lead = n("[3 | 1 | 7 | 5]").scale("c#3:phrygian").s("ocarina_vib:0").clip("4 .1 2").gain(.5).room(1)
let pungi = n("<0 <[1 3 5 7] -2 [7 5 3 1] [1 3]*6>>").scale("c#4:phrygian").s("gm_oboe:2").palindrome().fast(2).gain(.5).room(1)

$: arrange(
  [8, s("- - - -")],
  [4, lead],
  [4, pungi]
)._pianoroll()
```

### Piano Arrangement with Builds
```strudel
setcpm(150/4)

let Piano = note("<[c2, e3] [e3, g3] [g3, b3] [b3, d4] [g3, b3] [e3, g3] [c2, e3] [c2, a1]>").sound("piano").lpf(500).room(0.5)
let chords = note("<[e3, g3, b3]>*2 [c3, e3, g3]").sound("square").decay(0.5).n(irand(12)).room(1).roomsize(10).gain(0.5)
let synthbass = note("C1*16").sound("sine").transpose(irand(36)).scale('c major').scaleTranspose(3).gain(0.7)
let trommer = n("<1 2> 1 <2 3> 1").sound("bd hh sd hh").gain(0.8).lpf(4000).bank("RolandTR808")
let bd = sound("jazz jazz bd jazz")

arrange(
  [4, stack(Piano)],
  [5, stack(Piano, bd)],
  [3, stack(trommer, bd, synthbass, Piano)],
  [6, stack(trommer, bd, synthbass, chords)],
  [6, stack(trommer, bd, chords, Piano)],
  [9999, silence]
)
```