# Strudel Language Reference

Strudel is a live-coding music environment in JavaScript. Programs describe musical patterns that repeat in **cycles**.

## Core Functions

### Sounds
- `sound("name")` or `s("name")` — play a sample by name
- Common drum samples: `bd` (bass drum), `sd` (snare), `hh` (hi-hat), `oh` (open hat), `cp` (clap), `rim`, `lt` (low tom), `mt` (mid tom), `ht` (high tom), `cr` (crash), `rd` (ride)
- `.bank("BankName")` — choose a sample bank (e.g. `"RolandTR909"`, `"RolandTR808"`, `"RolandTR606"`)
- Sample variants: `s("bd:0")`, `s("bd:3")` — pick a numbered variant

### Notes
- `note("c3 e3 g3")` — play notes by letter name + octave
- `note("48 52 55")` — MIDI note numbers also work
- `n("0 2 4 6")` — pattern index (used with `.scale()`)
- `.scale("C:minor")` — apply a scale to `n()` values
- Scales: `major`, `minor`, `dorian`, `mixolydian`, `phrygian`, `lydian`, `pentatonic`, `blues`, `chromatic`, `harmonic_minor`, `melodic_minor`, `whole_tone`
- Scale with root: `"C4:minor"`, `"A2:major:pentatonic"`

### Synths
- Built-in waveforms: `"sine"`, `"triangle"`, `"square"`, `"sawtooth"`
- Use with `.s()` or `.sound()`: `note("c3").s("sawtooth")`
- FM synthesis: `.fm(amount)`, `.fmh(harmonicity)`
- SuperSaw: `s("supersaw")`

### General MIDI Sounds
- Prefix `gm_` + instrument name: `"gm_piano"`, `"gm_acoustic_bass"`, `"gm_electric_guitar_clean"`, `"gm_violin"`, `"gm_flute"`, `"gm_trumpet"`, `"gm_synth_strings_1"`, `"gm_epiano1"`, `"gm_vibraphone"`, `"gm_music_box"`, `"gm_kalimba"`, `"gm_celesta"`, `"gm_orchestra_hit"`

### Tempo
- `setcpm(cpm)` — set cycles per minute
- `setcps(cps)` — set cycles per second
- Typical: `setcpm(120/4)` = 120 BPM in 4/4 time

### Stacking & Combining
- `stack(pat1, pat2, ...)` — layer patterns simultaneously
- `$: pattern` — register a pattern (each `$:` runs in parallel)
- Comma in mini-notation: `s("bd sd, hh*4")` — plays both simultaneously
- `arrange([bars, pattern], ...)` — sequence patterns over time

## Pattern Methods (Chainable)

### Gain & Volume
- `.gain(value)` — volume (0-1+)
- `.velocity(value)` — note velocity

### Timing
- `.fast(n)` — speed up by factor n
- `.slow(n)` — slow down by factor n
- `.early(t)` / `.late(t)` — shift in time

### Pitch
- `.transpose(n)` — transpose semitones
- `.octave(n)` or `.oct(n)` — set octave
- `.add(note(n))` — add interval

### Structure
- `.struct("pattern")` — impose rhythmic structure
- `.mask("pattern")` — silence parts of pattern
- `.euclid(pulses, steps)` — Euclidean rhythm
- `.euclidRot(pulses, steps, rotation)` — rotated Euclidean

### Repetition
- `.echo(times, time, feedback)` — echo effect
- `.ply(n)` — repeat each event n times
- `.chop(n)` — chop samples into n pieces

### Conditional
- `.sometimes(fn)` — apply fn ~50% of the time
- `.sometimesBy(prob, fn)` — apply with probability
- `.rarely(fn)` / `.almostNever(fn)` / `.often(fn)` / `.almostAlways(fn)`
- `.when("pattern", fn)` — conditional on pattern
- `.degradeBy(prob)` — randomly drop events

### Signals (Continuous Patterns)
- `sine`, `cosine`, `saw`, `tri`, `square`, `rand`, `perlin` — continuous 0-1 signals
- `.range(min, max)` — map signal to range
- `.rangex(min, max)` — exponential range (for frequencies)
- `.slow(n)` / `.fast(n)` — change signal speed
- `.seg(n)` — sample-and-hold (step the signal n times per cycle)

## JavaScript Features
- Variables: `let name = value` or `const name = value`
- Functions: `const fn = (x) => x.transpose(12)`
- `.layer(fn1, fn2)` — apply multiple transformations
- `.superimpose(fn)` — stack original with transformed copy
