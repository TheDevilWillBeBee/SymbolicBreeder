
# Strudel Language Reference

Strudel is a live-coding music environment in JavaScript. Programs describe musical patterns that repeat in **cycles**.

## Tempo — ALWAYS SET THIS FIRST

Every program MUST begin with a tempo setting:
- `setcpm(cpm)` — set cycles per minute (most common)
- `setcps(cps)` — set cycles per second
- Typical: `setcpm(120/4)` = 120 BPM in 4/4 time
- Range: `setcpm(60/4)` (slow ambient) to `setcpm(170/4)` (fast DnB)

## Core Functions

### Sounds
- `sound("name")` or `s("name")` — play a sample by name
- Common drum samples: `bd` (bass drum), `sd` (snare), `hh` (hi-hat), `oh` (open hat), `cp` (clap), `rim`, `lt` (low tom), `mt` (mid tom), `ht` (high tom), `cr` (crash), `rd` (ride), `cowbell`, `tambourine`, `clave`, `bongo`, `perc`
- `.bank("BankName")` — choose a sample bank
  - Drum machines: `"RolandTR909"`, `"RolandTR808"`, `"RolandTR707"`, `"RolandTR606"`, `"Linn9000"`, `"AkaiLinn"`, `"RhythmAce"`, `"BossDR550"`, `"CasioRZ1"`, `"OberheimDMX"`, `"YamahaRM50"`, `"BossDR110"`, `"ViscoSpaceDrum"`
- Sample variants: `s("bd:0")`, `s("bd:3")` — pick a numbered variant

### Notes & Pitch
- `note("c3 e3 g3")` — play notes by letter name + octave
- `note("48 52 55")` — MIDI note numbers also work
- `n("0 2 4 6")` — pattern index (used with `.scale()`)
- `.scale("C:minor")` — apply a scale to `n()` values
- Scales: `major`, `minor`, `dorian`, `mixolydian`, `phrygian`, `lydian`, `pentatonic`, `blues`, `chromatic`, `harmonic_minor`, `melodic_minor`, `whole_tone`
- Scale with root: `"C4:minor"`, `"A2:major:pentatonic"`
- `.transpose(n)` — transpose by semitones
- `.octave(n)` or `.oct(n)` or `.o(n)` — set octave
- `.add(note(n))` — add interval
- `.detune(amount)` — detune for chorus/thickness

### Chords
- `chord("<Am F C G>")` — chord progression
- `chord("<Dm7 G7 Cmaj7 Fmaj7>")` — jazz chords
- `.voicing()` — auto-voice the chord (smooth voice leading)
- `.dict('ireal')` or `.dict('legacy')` — voicing dictionary
- `.anchor("A3")` — set voicing anchor note
- `.rootNotes(octave)` — extract root notes for bass lines

### Synths
- Built-in waveforms: `"sine"`, `"triangle"`, `"square"`, `"sawtooth"`
- Use with `.s()`: `note("c3").s("sawtooth")`
- FM synthesis: `.fm(amount)`, `.fmh(harmonicity)`, `.fmattack(time)`
- SuperSaw: `s("supersaw")` — fat detuned saw
- Wavetable: `s("wt_digital")` and similar

### General MIDI Sounds
Prefix `gm_` + instrument name:
- Keys: `"gm_piano"`, `"gm_epiano1"`, `"gm_epiano2"`, `"gm_organ1"`, `"gm_celesta"`, `"gm_music_box"`, `"gm_vibraphone"`, `"gm_kalimba"`
- Guitar: `"gm_acoustic_guitar_nylon"`, `"gm_acoustic_guitar_steel"`, `"gm_electric_guitar_clean"`, `"gm_electric_guitar_muted"`
- Bass: `"gm_acoustic_bass"`, `"gm_fretless_bass"`, `"gm_synth_bass_1"`, `"gm_synth_bass_2"`
- Strings: `"gm_violin"`, `"gm_synth_strings_1"`, `"gm_string_ensemble_1"`, `"gm_pizzicato_strings"`
- Winds: `"gm_flute"`, `"gm_oboe"`, `"gm_trumpet"`, `"gm_blown_bottle"`, `"gm_ocarina"`
- Pads: `"gm_pad_warm"`, `"gm_pad_choir"`
- Other: `"gm_voice_oohs"`, `"gm_orchestra_hit"`, `"gm_accordion"`

### Stacking Parts — CRITICAL FOR COMPOSITION

**Method 1: $: prefix (recommended for multi-part songs)**
Each `$:` line runs as an independent parallel pattern:
```
setcpm(120/4)
$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")._scope()
$: note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600)._pianoroll()
$: chord("<Cm Ab Fm G>").voicing().s("gm_epiano1").room(0.5)._pianoroll()
```

**Method 2: stack() function**
```
stack(
  s("bd*4, [~ sd]*2, hh*8"),
  note("<c2 g2>").s("sawtooth").lpf(600),
  chord("<Cm Ab>").voicing().s("gm_epiano1")
)
```

**Method 3: Comma in mini-notation (for simple layering)**
```
s("bd*4, hh*8, ~ sd ~ sd")
```

**Method 4: arrange() for song structure**
```
let drums = s("bd*4, [~ sd]*2, hh*8")
let bass = note("<c2 g2>").s("sawtooth").lpf(600)
let melody = n("0 2 4 6").scale("C:minor").s("piano")
arrange(
  [4, drums],
  [4, stack(drums, bass)],
  [8, stack(drums, bass, melody)],
  [4, stack(drums, bass)],
  [9999, silence]
)
```

### Visualization — ALWAYS ADD TO EVERY LINE
- `._scope()` — waveform display (use for drums and percussive sounds)
- `._pianoroll()` — piano roll display (use for melodic/pitched sounds)
- `._punchcard()` — punchcard display (alternative to pianoroll)
- Options: `._pianoroll({ labels: 1 })`, `._pianoroll({ vertical: 1 })`

### Signals (Continuous Patterns)
- `sine`, `cosine`, `saw`, `tri`, `square` — smooth 0-1 signals
- `rand` — random value each event
- `perlin` — smooth random (Perlin noise)
- `irand(n)` — random integer 0 to n-1
- `.range(min, max)` — map signal to range
- `.rangex(min, max)` — exponential range (for frequencies)
- `.slow(n)` / `.fast(n)` — change signal speed
- `.seg(n)` — sample-and-hold (step the signal n times per cycle)
- `wchoose([value1, weight1], [value2, weight2], ...)` — weighted random choice

## Pattern Methods (Chainable)

### Gain & Volume
- `.gain(value)` — volume (0-1+)
- `.velocity(value)` — note velocity
- `.postgain(amount)` — output gain (useful for mute: `.postgain(0)`)

### Timing
- `.fast(n)` — speed up by factor n
- `.slow(n)` — slow down by factor n
- `.early(t)` / `.late(t)` — shift in time

### Structure
- `.struct("pattern")` — impose rhythmic structure
- `.mask("pattern")` — silence parts of pattern
- `.euclid(pulses, steps)` — Euclidean rhythm
- `.euclidRot(pulses, steps, rotation)` — rotated Euclidean
- `.beat("positions", total)` — place beats at positions (e.g. `.beat("0,4,10",16)`)

### Repetition
- `.echo(times, time, feedback)` — echo effect
- `.ply(n)` — repeat each event n times
- `.chop(n)` — chop samples into n pieces

### Conditional
- `.sometimes(fn)` — apply fn ~50% of the time
- `.sometimesBy(prob, fn)` — apply with probability
- `.degradeBy(prob)` — randomly drop events
- `.rarely(fn)` / `.often(fn)` / `.almostAlways(fn)`

### Transformation
- `.rev()` — reverse pattern
- `.palindrome()` — play forward then backward
- `.jux(fn)` — apply fn to right channel only
- `.juxBy(amount, fn)` — jux with stereo width control
- `.off(time, fn)` — overlay shifted + transformed copy
- `.layer(fn1, fn2)` — apply multiple transformations
- `.superimpose(fn)` — stack original with transformed copy
- `.inside(n, fn)` — apply fn to inner cycles
- `.add(value)` — add to pattern values

### Clip & Legato
- `.clip(length)` — clip event duration
- `.legato(length)` — set note legato

## Variables and Song Structure

Use `let` or `const` to name parts, then combine:
```
setcpm(120/4)
let drums = s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")
let bass = note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600)
let chords = chord("<Cm Ab Fm G>").voicing().s("gm_epiano1")

arrange(
  [4, drums],
  [4, stack(drums, bass)],
  [8, stack(drums, bass, chords)],
  [9999, silence]
)
```

Use `var scale = "D:minor"` (or other scales) at the top to share a scale across all parts.
