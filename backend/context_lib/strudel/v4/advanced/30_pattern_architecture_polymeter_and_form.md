# Advanced Context — Pattern Architecture, Polymeter, and Form

This level treats Strudel patterns as compositional architecture.
Use it when the identity of a piece depends on structure, transformation logic, or large-scale form.

## 1) Choose Between Mini-Notation and Functions Deliberately

Mini-notation is excellent for local rhythmic cells:

```strudel
s("bd [hh hh] sd [hh rim]")
```

Functions are often clearer for larger pattern design:

```strudel
stack(
  s("bd(5,8), hh*8"),
  note("c2 eb2(3,8)").s("sawtooth")
)
```

Sequence explicitly with functions:

```strudel
seq("c3", "eb3", "g3").note()
```

Cycle-alternating categories:

```strudel
cat("c3", "eb3", "g3").note()
```

Parallel layers by function:

```strudel
stack("c3,eb3,g3", "c2 g2").note()
```

Use the representation that makes the relationship most obvious.

## 2) Structural Constructors

Weighted concatenation:

```strudel
stepcat([3, "e3"], [1, "g3"]).note()
```

Arranged sections:

```strudel
arrange([4, A], [4, B], [2, BREAK], [8, C])
```

Polymeter by step alignment:

```strudel
polymeter("bd hh hh", "sd hh").sound()
```

Explicit polymeter steps:

```strudel
polymeterSteps(2, "c3 eb3", "g2").note()
```

Silence as a formal material:

```strudel
silence
```

## 3) Polyrhythm, Polymeter, and Phasing Are Different Tools

Polyrhythm: different subdivisions at once:

```strudel
s("bd*2, hh*3")
```

Polymeter: different bar lengths under the same pulse:

```strudel
s("<bd rim, hh hh oh>*4")
```

Phasing: near-unison at slightly different rates:

```strudel
note("<c d g a bb d c a>*[6,6.1]")
```

Metric modulation: same cycle time, new beat interpretation:

```strudel
s("<[bd hh rim] [bd hh rim sd]>")
```

Use only one of these at a time unless the piece is intentionally disorienting.

## 4) Time Modifiers as Formal Devices

Reverse the phrase:

```strudel
n("0 2 4 6").scale("C4:minor").rev()
```

Forward-back mirror:

```strudel
n("0 2 4 6").scale("C4:minor").palindrome()
```

Inner-cycle transformation:

```strudel
n("0 2 4 6").scale("C4:minor").inside(2, rev)
```

Outer-cycle transformation:

```strudel
n("0 2 4 6").scale("C4:minor").outside(4, x=>x.fast(2))
```

Compress to a smaller span:

```strudel
n("0 2 4 6").scale("C4:minor").compress(0, .5)
```

Zoom into a region:

```strudel
s("bd sd hh cp").zoom(0, .5)
```

## 5) Conditional Structure

Transform only when a binary pattern says so:

```strudel
"0 1 2 3".when("<0 1>/2", x=>x.add(7)).scale("A:minor").note()
```

Act on the first part of a chunk:

```strudel
n("0 2 4 6").scale("C4:minor").chunk(4, x=>x.rev())
```

Reverse chunk order instead:

```strudel
n("0 2 4 6").scale("C4:minor").chunkBack(4, x=>x.add(12))
```

Select only certain parts structurally:

```strudel
n("0 2 4 6").scale("C4:minor").struct("1 0 1 0")
```

Mask large spans:

```strudel
s("hh*16").mask("<0 1 1 0 1 1>/2")
```

Conditional tools are powerful because they create recurrence with memory.

## 6) Accumulation and Self-Variation

Superimpose a transposed copy:

```strudel
n("0 2 4 6").scale("C4:minor").superimpose(x=>x.add(note(7)).gain(.25))
```

Layer multiple transformations at once:

```strudel
n("0 2 4 6").scale("C4:minor").layer(
  x=>x,
  x=>x.rev().gain(.2),
  x=>x.off(1/8, y=>y.add(note(12)).gain(.15))
)
```

Stutter a hit:

```strudel
s("cp").stut(4, 1/16, .6)
```

Echo pattern-space rather than only audio-space:

```strudel
n("0 2 4").scale("C5:minor").echo(3, 1/8, .4)
```

## 7) Stepwise Patterning

Use stepwise tools when step geometry matters more than cycle geometry.
These are powerful and sometimes experimental.

Expand step width:

```strudel
note("c a f e").expand(2)
```

Contract step width:

```strudel
note("c a f e").contract(2)
```

Set the effective pace:

```strudel
note("c a f e").expand("3 2 1 1 2 3").pace(8)
```

Stepwise concatenation:

```strudel
stepcat("bd hh hh", "bd hh hh cp hh").sound()
```

Zip two step streams:

```strudel
zip("0 2 4 6", "1 3 5 7")
```

Use stepwise thinking when writing asymmetric ostinati, additive meters, or evolving ostinato grids.

## 8) Formal Energy by Parameter Families

Brightness arc:

```strudel
note("c3 eb3 g3").s("sawtooth").lpf("400 800 1400 2400")
```

Density arc:

```strudel
s("hh*4").fast("1 1 2 4")
```

Wetness arc:

```strudel
chord("<Cm Ab>").voicing().room("0 .2 .5 1")
```

Register arc:

```strudel
n("0 2 4 6").scale("C4:minor").add("0 0 12 12")
```

A strong section transition often changes only one or two of these axes at once.

## 9) Theme and Variation at the Pattern Level

Keep rhythm, change harmony:

```strudel
n("0 2 4 2").set(chord("<Am F C G>")).voicing()
```

Keep harmony, change rhythm:

```strudel
n("0 [2 4] 2").scale("A4:minor")
```

Keep melody, change instrument family:

```strudel
n("0 2 4 2").scale("A4:minor").s("gm_oboe")
```

Keep motif, change formal placement:

```strudel
arrange([8, silence], [8, n("0 2 4 2").scale("A4:minor")])
```

## 10) Advanced Role Logic

A role can mutate while staying itself.
Examples:

Kick role becomes spectral instead of literal:

```strudel
s("bd*4").layer(x=>x, x=>x.s("white*4").hpf(5000).gain(.08))
```

Bass role becomes chord-root arpeggio:

```strudel
n("0 1 2 1").chord("<Am F C G>").mode("root:a2").voicing()
```

Lead role becomes texture cloud:

```strudel
n("0 2 4 6").scale("C5:minor").superimpose(x=>x.off(1/16, y=>y.gain(.15)))
```

This is useful in evolution because identity can persist through role behavior even when syntax changes a lot.

## 11) Formal Planning Heuristics

For larger pieces, define a few axes before writing code:

- what is the anchor groove cell?
- what is the harmonic world?
- what changes from section to section?
- what returns unchanged so the piece still feels related?
- which layer carries surprise, and which layer carries orientation?

Advanced complexity works best when at least one reference layer remains legible.
