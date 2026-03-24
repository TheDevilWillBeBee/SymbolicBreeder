# Simple Context — Cycles, Mini-Notation, and Parts

This level teaches the smallest reusable ideas for Strudel composition.
Think in layers, pulses, and repeated cells.
Use these fragments as atoms.

## 1) Start from Role, Not Ornament

A clear piece usually assigns distinct jobs:

- kick / low pulse
- snare or clap / backbeat marker
- hats or shaker / subdivision and motion
- bass / root and groove glue
- harmony / chord color and support
- lead or motif / memorable foreground
- pad or texture / sustain and atmosphere
- accent or fill / surprise and transition

A role can be sparse and still matter.

Kick skeleton:

```strudel
s("bd*4")
```

Backbeat skeleton:

```strudel
s("~ sd ~ sd")
```

Hat skeleton:

```strudel
s("hh*8")
```

Sparse bass pulse:

```strudel
note("c2 ~ g1 ~")
```

Sustained chord bed:

```strudel
chord("<Cm Ab>").voicing().clip(2)
```

## 2) One Cycle Can Imply Many Meters

Strudel works in cycles, not bars.
You choose how many felt beats live inside one cycle.

Common 4-beat frame:

```strudel
setcpm(120/4)
```

3-beat frame:

```strudel
setcpm(96/3)
```

2-beat frame for faster phrasing:

```strudel
setcpm(140/2)
```

A four-on-the-floor kick suggests a quarter-note grid inside a 4-beat cycle:

```strudel
s("bd*4")
```

An eight-step hat line suggests eighth-note motion:

```strudel
s("hh*8")
```

A sixteen-step hat line suggests sixteenth-note motion:

```strudel
s("hh*16")
```

A triplet-like pulse can be implied with groups of three:

```strudel
s("[hh hh hh]*4")
```

Shuffle can be implied by unequal note weights:

```strudel
note("[c3@2 c3]*4")
```

## 3) Core Mini-Notation Atoms

Sequence:

```strudel
s("bd hh sd hh")
```

Rests:

```strudel
s("bd ~ sd ~")
```

Subsequence inside one step:

```strudel
s("bd [hh hh] sd [hh bd]")
```

Alternate by cycle:

```strudel
s("<bd sd rim cp>")
```

Replicate without speeding up the whole phrase:

```strudel
note("c3!3 g3")
```

Elongate one event:

```strudel
note("c3@3 eb3")
```

Parallel events / chord stack:

```strudel
note("c3,eb3,g3")
```

Chance removal:

```strudel
s("hh*8?")
```

Random choice:

```strudel
note("c4 | eb4 | g4")
```

Euclidean pulse:

```strudel
s("bd(3,8)")
```

Rotated Euclidean pulse:

```strudel
s("hh(5,8,2)")
```

## 4) Density Is a Musical Decision

Denser is not automatically better.
Use density to say who is speaking.

Empty low end, active top:

```strudel
s("~ ~ ~ ~, hh*16")
```

Busy kick, sparse hats:

```strudel
s("bd*8, hh*4")
```

Humanized hat accents:

```strudel
s("hh*8").gain("[.4 .8]*4")
```

Randomly thinning a busy texture:

```strudel
s("perc*16").degradeBy(.35)
```

## 5) Negative Space Creates Groove

Rests let other parts breathe.

Snare with air around it:

```strudel
s("~ ~ sd ~")
```

Bass that leaves space after the kick:

```strudel
note("c2 ~ ~ g1")
```

Melody with held tones and silence:

```strudel
n("0 ~ 2 ~ 4@2 ~").scale("C4:minor")
```

## 6) Kick, Snare, Hat, and Percussion Micro-Cells

House-like floor pulse:

```strudel
s("bd*4")
```

Backbeat clap:

```strudel
s("~ cp ~ cp")
```

Off-beat hats:

```strudel
s("~ hh ~ hh ~ hh ~ hh")
```

Open-hat punctuation:

```strudel
s("~ ~ oh ~")
```

Rim accent in empty space:

```strudel
s("~ rim ~ ~")
```

Low tom fill shape:

```strudel
s("~ ~ [lt mt ht] ~")
```

Shaker subdivision:

```strudel
s("sh*16").gain("[.2 .5]*8")
```

## 7) Bass Should Talk to Rhythm

Bass can double the kick, answer the kick, or float above it.

On-beat bass:

```strudel
note("c2 ~ c2 ~")
```

Off-beat bass answer:

```strudel
note("~ g1 ~ bb1")
```

Pedal bass:

```strudel
note("c2@4")
```

Alternating root-fifth motion:

```strudel
note("c2 g2 c2 g2")
```

Scale-degree bass cell:

```strudel
n("0 0 4 3").scale("D2:minor")
```

## 8) Simple Part Contrast

A good texture often combines one sustained role with one pointillistic role.

Sustained pad, short bell:

```strudel
chord("<Cm Ab>").voicing().legato(2)
```

```strudel
n("0 2 4 6").scale("C5:minor").clip(.25)
```

Long bass, short drums:

```strudel
note("c2@4")
```

```strudel
s("bd*4, hh*8")
```

## 9) Rhythmic Contrast Without New Notes

Keep the same notes and change only rhythm.

Original cell:

```strudel
n("0 2 4 5").scale("A4:minor")
```

Syncopated cell:

```strudel
n("0 ~ 2 [4 5]").scale("A4:minor")
```

Held-note version:

```strudel
n("0@2 2 4@2 5").scale("A4:minor")
```

Repeated pickup:

```strudel
n("[0 0] 2 4 5").scale("A4:minor")
```

## 10) First Layering Moves

Same rhythm, different role:

```strudel
s("bd*4")
```

```strudel
note("c2 ~ g1 ~")
```

Same notes, different sound family:

```strudel
note("c3 eb3 g3").s("triangle")
```

```strudel
note("c3 eb3 g3").s("gm_epiano1")
```

Same hat line, different dynamics:

```strudel
s("hh*8").gain("[.3 .7]*4")
```

```strudel
s("hh*8").gain(rand.range(.2,.8))
```

## 11) Simple Arrangement Atoms

Mute a role with silence:

```strudel
silence
```

Hold a role for a few cycles, then remove it:

```strudel
arrange([4, s("hh*8")], [4, silence])
```

Bring a part in only sometimes:

```strudel
s("cp").rarely(x=>x.ply(2))
```

Let a fill happen only every now and then:

```strudel
s("sd").sometimes(x=>x.fast(4))
```

## 12) Mental Model

At this level, good results usually come from doing a few simple things well:

- pick a cycle frame
- assign clear roles
- decide where silence lives
- make one role steady
- make another role answer it
- repeat with slight change rather than constant novelty
