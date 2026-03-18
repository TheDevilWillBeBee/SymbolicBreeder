# Shared Strategy — Strudel Evolution Playbook

This file teaches how to evolve Strudel programs without falling into trivial code paraphrase.
Preserve musical identity at the phenotype level, not the syntax level.

## 1) Think in Phenotype Axes

A Strudel piece can be described by musical axes such as:

- tempo feel
- implied meter
- drum language
- groove cell
- harmonic world
- bass behavior
- motif contour
- register layout
- timbre family
- modulation style
- wet/dry space
- arrangement arc
- randomness policy

A child can be recognizably related even if the code is rewritten, as long as several of these axes remain connected.

## 2) Preserve 2 to 4 Anchors

For each child, keep a few anchors from the parents.
Examples:

- same kick/snare relationship
- same chord loop or mode
- same bass rhythm with new notes
- same timbre family but different motif
- same motif contour in a new register
- same energy arc with different instrumentation

Do not preserve every axis at once.
Do not replace every axis at once.

## 3) Close Mutation Operators

Use these when the child should feel obviously related:

- tweak tempo slightly
- thicken or thin one rhythmic role
- change a few scale degrees but keep contour
- shift register by octave
- change one synth or bank while keeping rhythm
- alter filter, room, delay, detune, or noise amount
- swap one chord color while keeping root motion
- add or remove one occasional fill
- add gentle warble, echo, or ducking
- move one part to a different orbit for cleaner depth

Examples of close mutations:

```strudel
s("hh*8")
```

```strudel
s("hh*16").gain("[.6 .3]*8")
```

```strudel
n("0 2 4 2").scale("D4:dorian")
```

```strudel
n("0 2 5 2").scale("D4:dorian")
```

## 4) Medium Mutation Operators

Use these when the child should sound related but clearly evolved:

- rewrite rhythm while keeping harmony
- rewrite harmony while keeping groove cell
- convert a chord role into an arpeggiated role
- convert a bass role into root-pulse plus answer notes
- replace a static pad with moving filter automation
- change straight feel into swung feel
- add a counter-line or remove one role entirely
- use `struct`, `mask`, or `arrange` to change entrances
- split one role into layered timbres
- collapse several roles into one hybrid role

## 5) Crossover Operators

When using multiple parents, combine them by role rather than by line-level copy.
Possible crossover patterns:

- Parent A drum language + Parent B harmony
- Parent A bass behavior + Parent B melody contour
- Parent A pad space + Parent B lead timbre
- Parent A arrangement logic + Parent B core motif
- Parent A rhythmic density + Parent B register plan

After crossover, repair coherence:

- align tempo frame
- align harmonic center
- reduce clashing registers
- reduce redundant roles
- unify reverb/delay logic

## 6) Bold Reinterpretation Operators

A bold child may keep only a few anchors.
Examples:

- keep the harmonic world but replace every timbre family
- keep the groove and bass but turn harmony into sampled texture
- keep the motif contour but move it into another mode or tuning
- keep the arrangement arc but compress the piece into fewer roles
- keep the emotional profile but rewrite rhythm and instrumentation from scratch

A bold child should still reveal lineage somewhere.

## 7) Role-Based Mutations

### Drums

Mutate by:

- density
- variant selection
- bank swap
- open/closed hat balance
- syncopation level
- fill frequency
- ghost-note probability
- swing amount
- compression or crunch

### Bass

Mutate by:

- root motion
- octave placement
- sustain vs pulse
- syncopation vs grounding
- filter brightness
- waveform family
- relationship to kick

### Harmony

Mutate by:

- voicing dictionary
- anchor register
- chord density
- borrowed chord color
- pad vs stab behavior
- filter sweep and reverb size

### Melody / Lead

Mutate by:

- contour
- ornament density
- delay strategy
- call/response structure
- counter-melody presence
- octave doubling
- timbre brightness

### Texture / FX

Mutate by:

- noise amount
- chop / slice behavior
- room / delay depth
- pan width
- Shabda usage
- phasing or swarm layers

## 8) Guidance Mapping

Map user guidance onto concrete axes.

- "more percussive" -> increase rhythmic density, reduce sustain, add rim/shaker/ghost notes
- "warmer" -> lower cutoff, softer waveform, richer mids, less harsh highs, slower attacks
- "brighter" -> higher cutoff, shorter transients, more upper partials, clearer hats
- "more ambient" -> fewer attacks, longer release, larger room, slower motion, simpler drums
- "more danceable" -> clearer kick pattern, stronger backbeat, steadier bass, ducking, less harmonic ambiguity
- "jazzy" -> richer chord symbols, smoother voicings, swing, passing tones, lighter ride-like top rhythm
- "darker" -> lower register, minor/modal colors, filtered highs, longer tension before resolution
- "more melodic" -> clearer foreground contour, repetition with variation, less competition from chords
- "more minimal" -> fewer roles, fewer notes, clearer repetition, stronger timbral detail
- "more experimental" -> polymeter, stepwise tools, xenharmony, sample surgery, unusual envelopes

## 9) One-Shot Batch Design

When generating a batch of children:

- around half should be close descendants
- some should be medium-strength mutations
- one or two may be crossovers
- at most one may be a bold reinterpretation

Across the batch, distribute novelty across different axes.
Do not make every child differ only by tempo, only by bank, or only by filter cutoff.

## 10) Anti-Patterns to Avoid

Avoid these common failure modes:

- every role busy all the time
- all pitched parts in the same register
- harmony and bass using unrelated scales
- randomization on every parameter at once
- giant reverb on every orbit
- many layers with nearly identical function
- no silence, no contrast, no arrival points
- copying parent code and merely changing constants

## 11) Mutation Order That Usually Works

A reliable order for evolution:

1. decide what identity to preserve
2. choose one or two axes to mutate first
3. repair harmonic coherence
4. repair register separation
5. decide whether a new role is needed
6. decide whether the form needs a clearer entrance or drop
7. simplify if the result got too crowded

## 12) Composition Over Syntax

A good descendant is not the one that looks closest in code.
A good descendant is the one that a listener would hear as belonging to the same family while still offering a fresh path.
