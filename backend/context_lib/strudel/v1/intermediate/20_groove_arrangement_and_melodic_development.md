# Intermediate Context — Groove, Arrangement, and Melodic Development

This level is about making patterns feel alive over time.
The focus shifts from isolated fragments to interaction between layers.

## 1) Groove Lives in Placement, Not Only in Density

Straight subdivision:

```strudel
s("hh*8")
```

Pushed off-beat feel:

```strudel
s("~ hh ~ hh ~ hh ~ hh")
```

Micro-shifted answer:

```strudel
s("cp").late(.125)
```

Pickup before the beat:

```strudel
note("g4").early(1/16)
```

Ghost notes with lower gain:

```strudel
s("sd ~ sd ~").gain("1 .2 .7 .2")
```

Ghost notes with probability:

```strudel
s("sd?0.2 ~ sd ~")
```

## 2) Swing, Shuffle, and Uneven Weight

Triplet shuffle feel with weights:

```strudel
note("[0@2 0] [3@2 3] [4@2 4] [3@2 3]").scale("C4:blues")
```

Pattern-level swing:

```strudel
s("hh*8").swing()
```

Custom swing amount:

```strudel
s("hh*8").swingBy(1/12, 2)
```

A swung accompaniment can support a straight melody, or vice versa.
Keep at least one layer simple so the listener can orient.

## 3) Complementary Rhythms

Kick states the pulse:

```strudel
s("bd*4")
```

Bass answers the gaps:

```strudel
note("~ c2 ~ g1")
```

Harmony on off-beats:

```strudel
chord("<Cm Ab>").voicing().struct("~ x ~ x")
```

Lead between long tones:

```strudel
n("0 [2 4] ~ 5").scale("C5:minor")
```

When every role hits constantly, the piece gets flat.
Alternate who is dense and who is sparse.

## 4) Structural Rhythm Tools

Impose a gate on a pattern:

```strudel
n("0 2 4 6").scale("C4:minor").struct("1 0 1 1")
```

Mask away regions over larger spans:

```strudel
s("hh*8").mask("<0 0 1 1 1 1>/2")
```

Beat placement by index:

```strudel
s("bd").beat("0,7,10,12",16)
```

Euclidean overlay:

```strudel
s("rim").euclidRot(3,8,1)
```

Legato Euclidean melody:

```strudel
n("0 2 4 6").scale("C4:minor").euclidLegatoRot(3,8,2)
```

## 5) Section Design with `arrange()`

Bring a role in after a delay:

```strudel
arrange([8, silence], [8, s("hh*8")])
```

Intro to full section to drop:

```strudel
arrange([4, DRUMS], [8, stack(DRUMS, BASS, CHORDS)], [4, stack(BASS, CHORDS)])
```

Short fill section:

```strudel
arrange([7, MAIN], [1, FILL])
```

Think of arrangement as controlled revelation.
Introduce roles, then withhold them again.

## 6) Fills and Turnarounds

Fast snare burst:

```strudel
s("sd").fast(8)
```

Tom cascade:

```strudel
s("lt mt ht").fast(4)
```

Melodic pickup at the end of a cycle:

```strudel
n("~ ~ [5 6 7]").scale("A4:minor")
```

Occasional fill via probability:

```strudel
s("rim").rarely(x=>x.fast(4).gain(.7))
```

Cycle-based variation:

```strudel
s("hh*8").someCyclesBy(.25, x=>x.rev())
```

## 7) Melody Development Without Losing Identity

Base contour:

```strudel
n("0 2 4 2").scale("D4:dorian")
```

Rhythmic mutation only:

```strudel
n("0 [2 4] 2").scale("D4:dorian")
```

Register mutation only:

```strudel
n("0 2 4 2").scale("D5:dorian")
```

Intervallic decoration:

```strudel
n("0 2 4 2").add("0 0 2 0").scale("D4:dorian")
```

Echo a transformed copy:

```strudel
n("0 2 4 2").scale("D4:dorian").off(1/8, x=>x.add(note(7)).gain(.25))
```

Mirror a phrase internally:

```strudel
n("0 1 3 4").scale("A4:minor").inside(2, palindrome)
```

## 8) Counter-Melody and Call/Response

Lead cell:

```strudel
n("0 2 4 5").scale("C5:minor")
```

Lower answer cell:

```strudel
n("5 4 2 0").scale("C4:minor")
```

Delayed octave shadow:

```strudel
n("0 2 4 5").scale("C5:minor").off(1/16, x=>x.add(note(-12)).gain(.2))
```

Answer only on some cycles:

```strudel
n("5 4 2 0").scale("C4:minor").mask("<0 1>/2")
```

## 9) Voice-Leading as a Composition Tool

Basic smooth voicing:

```strudel
chord("<Am F C G>").voicing()
```

Anchor the voicing lower:

```strudel
chord("<Am F C G>").anchor("A3").voicing()
```

Choose notes from the voicing like a scale:

```strudel
n("0 2 1 3").chord("<Am F C G>").voicing()
```

Root-driven bass from the same harmony:

```strudel
chord("<Am F C G>").rootNotes(2)
```

Tight voice leading creates connection even when rhythm changes.

## 10) Motion by Addition Rather Than Rewrite

Warble / tape-like pitch drift:

```strudel
note("c4 eb4 g4").add(note(perlin.range(0,.05)))
```

Random octave puncture:

```strudel
n("0*8").scale("E4:minor").add(wchoose([0,.9],[12,.05],[-12,.05]))
```

Filter movement over held notes:

```strudel
chord("<Cm Ab>").voicing().s("sawtooth").lpf(perlin.range(500,3000).slow(4))
```

Velocity motion instead of extra notes:

```strudel
n("0 2 4 6").scale("C4:major").velocity(".35 .6 .9 .55")
```

## 11) Ducking, Glue, and Energy Management

Kick as pumping reference:

```strudel
s("bd*4")
```

Synth being ducked:

```strudel
note("c3 eb3 g3").s("supersaw").orbit(2).duck("2:3").duckdepth(.8).duckattack(.2)
```

The point of ducking is not only loudness control.
It also creates rhythmic breathing and can make dense harmony feel clearer.

## 12) Masked Entrances and Layered Reveals

Delayed hats:

```strudel
s("hh*8").mask("<0 0 1 1 1 1>/4")
```

Pad appears later:

```strudel
chord("<Cm Ab>").voicing().mask("<0 0 0 1 1 1>/2")
```

Lead enters only in the second phrase:

```strudel
n("0 2 4 6").scale("C5:minor").mask("<0 1>/2")
```

## 13) Multi-Layer Timbre from One Pattern

Same notes, different synth body and transient:

```strudel
n("0 2 4 6").scale("C4:minor").layer(
  x=>x.s("triangle").gain(.6),
  x=>x.s("square").gain(.2).clip(.3),
  x=>x.s("gm_pad_warm").gain(.15).room(.7)
)
```

Same drum rhythm, two spectral bands:

```strudel
s("hh*8").layer(
  x=>x.bank("RolandTR909").gain(.4),
  x=>x.s("white*8").decay(.02).sustain(0).hpf(9000).gain(.12)
)
```

## 14) Orbit Separation for Clean Arrangement

Dry drums:

```strudel
s("bd*4, hh*8").orbit(1)
```

Wet pad:

```strudel
chord("<Cm Ab>").voicing().s("gm_pad_warm").orbit(2).room(1).roomsize(8)
```

Echo lead:

```strudel
n("0 2 4 6").scale("C5:minor").s("triangle").orbit(3).delay(.35)
```

Different spaces imply different depth planes.

## 15) Intermediate Heuristics

At this level, strong pieces often come from these habits:

- one repeating groove anchor
- one harmonic frame
- one or two evolving foreground details
- sections created by entry/exit rather than total rewrites
- variation through rhythm, register, filter, and density before harmony is changed
