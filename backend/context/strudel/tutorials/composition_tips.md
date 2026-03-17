
# Composition Tips & Tricks for Strudel

## Building a Full Song — Think in Parts

A good composition has distinct musical ROLES. Build songs by layering these:

1. **Drums/Rhythm**: The foundation. Use `s()` with drum samples and `.bank()`.
2. **Bass**: Low-frequency foundation. Use `note()` with `"sawtooth"`, `"triangle"`, or GM bass sounds. Keep `.lpf()` low (200-800).
3. **Chords/Harmony**: Mid-range harmonic bed. Use `chord()` with `.voicing()`, or stack notes with `[c3,e3,g3]`.
4. **Melody/Lead**: A singable top line. Use `n()` with `.scale()`, or `note()` with melodic instruments.
5. **Pads/Atmosphere**: Sustained textures. Use strings, pads, or synths with long `.attack()` and `.room()`.
6. **Fills/Accents**: Ear candy — occasional hits, percussion fills, FX. Use `.sometimes()`, `.degradeBy()`, `?`.

## Harmonic Coherence — CRITICAL

ALL melodic parts must agree harmonically. Three approaches:

**Approach 1: Shared scale variable**
```
setcpm(120/4)
var scale = "D:minor"
$: n("0 3 5 7").scale(scale).s("sawtooth").lpf(500)._pianoroll()
$: n("0 [2 4] <3 5> [~ 1]").scale(scale).s("piano").room(0.3)._pianoroll()
```

**Approach 2: Chord progression**
```
setcpm(90/4)
const chords = chord("<Dm7 G7 Cmaj7 Fmaj7>")
$: chords.voicing().s("gm_epiano1").room(0.5)._pianoroll()
$: n("2").set(chords).anchor(chords.rootNotes(1)).voicing().s("gm_acoustic_bass")._pianoroll()
```

**Approach 3: Scale progression**
```
setcpm(100/4)
$: n("0 2 4 6").scale("<D:dorian G:mixolydian C:dorian F:mixolydian>").s("piano")._pianoroll()
```

## Rhythmic Alignment

Parts should complement each other rhythmically:
- Bass often plays on or near the kick drum hits
- Chords often play off-beats or sustained pads
- Melodies fill gaps left by other parts
- Use rests (`~` or `-`) to create space
- Use `@` to elongate notes that need to breathe

## Adding Variation with Random/Signals

Make patterns feel alive and less robotic:

```
// Random gain for humanized hi-hats
s("hh*8").gain(rand.range(0.3, 0.8))

// Perlin noise on filter for organic movement
note("c3 e3").s("sawtooth").lpf(perlin.range(500, 3000).slow(4))

// Weighted random for occasional octave jumps
n("0*16").scale("E:minor").trans("0*16".add(wchoose([0, .9], [12, .05], [-12, .05])))

// irand for melodic variation
n(irand(8).seg(0.5)).scale("C:minor").s("piano")

// Random sample selection
s("hh").n(irand(5)).gain(rand.range(0.4, 0.9))

// Degrading for sparse patterns
s("hh*16").degradeBy(0.3)
```

## Song Structure with arrange()

Build songs that evolve over time:

```
setcpm(120/4)
var scale = "A:minor"

let DRUMS = s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")
let BASS = note("<a1 e2 f2 g2>").s("sawtooth").lpf(500)
let CHORDS = chord("<Am F C G>").voicing().s("gm_epiano1").room(0.5)
let MELODY = n("0 2 4 <6 [4 2]>").scale("A4:minor").s("triangle").delay(0.3)

arrange(
  [4, DRUMS],                              // intro: drums alone
  [4, stack(DRUMS, BASS)],                 // add bass
  [8, stack(DRUMS, BASS, CHORDS)],         // add chords
  [8, stack(DRUMS, BASS, CHORDS, MELODY)], // full arrangement
  [4, stack(BASS, CHORDS)],                // breakdown
  [4, stack(DRUMS, BASS, CHORDS, MELODY)], // return
  [9999, silence]
)
```

## Useful Tricks from the Community

**Sidechain pumping (ducking):**
```
$: s("bd*4").duck("2:3").duckdepth(.8).duckattack(.2)
$: note("c3").s("supersaw").orbit(2)  // this gets ducked by the kick
```

**Off-beat echo for depth:**
```
note("c3 e3 g3").off(1/8, x => x.transpose(12).gain(0.3))
```

**Euclidean rhythms for world music feel:**
```
s("bd(3,8), sd(2,8,1), hh(5,8,2)")
```

**FM synthesis for interesting timbres:**
```
note("c3 e3 g3").s("sine").fm(3).fmh(2).lpf(2000)
```

**Detuned supersaw for big chords:**
```
note("[c3,e3,g3]").s("supersaw").detune(0.5).room(0.5)
```

**Using struct() for rhythmic variation:**
```
chord("<Am F C G>").voicing().s("gm_epiano1")
  .struct("[1 0 0 1] [1 0 1 1] [1 0 1 0] [1 1 0 1]")
```

**Palindrome for mirror patterns:**
```
n("<0 1 2 3 4 5>").scale("C:minor").s("piano").palindrome()
```

**Conditional fills:**
```
s("bd [~ bd] sd [~ sd:2]").sometimes(x => x.ply(2))
```

**Mask for arrangement-like muting:**
```
$: s("hh*8").mask("<0 0 1 1 1 1 1 1>/4")  // hi-hats enter after 2 cycles
```

**Variable-speed filter sweeps:**
```
note("<c2 g2>*4").s("sawtooth")
  .lpf(sine.range(200, 2000).slow(8))
  .lpq(rand.range(2, 8))
```

## Visualization Rules

ALWAYS add visualization to every `$:` line:
- Drums and percussion: `._scope()`
- Melodic/pitched sounds: `._pianoroll()` or `._punchcard()`
- Options: `._pianoroll({ labels: 1 })`, `._punchcard()`, `._pianoroll({ vertical: 1, cycles: 2 })`