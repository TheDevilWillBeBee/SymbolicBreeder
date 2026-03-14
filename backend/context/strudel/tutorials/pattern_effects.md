
# Strudel Pattern Effects Reference

Pattern effects transform the structure or timing of patterns (not the audio signal).

## Time
- `.fast(n)` — speed up the pattern by n
- `.slow(n)` — slow down the pattern by n
- `.early(t)` — shift pattern earlier by t
- `.late(t)` — shift pattern later by t
- `.rev()` — reverse the pattern order
- `.palindrome()` — play forward then backward

## Structure
- `.jux(fn)` — apply fn to right channel only (stereo split)
- `.juxBy(amount, fn)` — jux with stereo width control
- `.add(value)` — add value to pattern
- `.ply(n)` — repeat each event n times
- `.off(time, fn)` — overlay a transformed copy, offset in time
  - Example: `note("c3 e3 g3").off(1/8, x => x.transpose(12))` — octave echo
- `.echo(times, time, feedback)` — repeat with decay
- `.chop(n)` — granulate: cut each sample into n slices

## Randomness & Variation
- `.degradeBy(prob)` — randomly silence events (0-1 probability)
- `.sometimes(fn)` — apply fn ~50% of the time
- `.sometimesBy(prob, fn)` — apply fn with given probability
- `.rarely(fn)` — ~10% of the time
- `.often(fn)` — ~75% of the time
- `.almostAlways(fn)` — ~90% of the time
- `irand(n)` — random integer 0 to n-1 (use in patterns for variety)
- `rand` — random float 0-1
- `perlin` — smooth random noise
- `wchoose([val1, weight1], [val2, weight2], ...)` — weighted random choice

## Layering
- `.layer(fn1, fn2, ...)` — create multiple simultaneous transformations
- `.superimpose(fn)` — stack pattern with transformed version

## Euclidean Rhythms
- `.euclid(pulses, steps)` — Euclidean rhythm
- `.euclidRot(pulses, steps, rotation)` — with rotation
- `.euclidLegato(pulses, steps)` — legato Euclidean
- `.euclidLegatoRot(pulses, steps, rotation)` — legato + rotation
- Shorthand in mini-notation: `"bd(3,8)"`, `"hh(5,8,2)"`

## Arrangement & Song Structure

Use `arrange()` to create sections (intro, verse, chorus, breakdown):
```
setcpm(120/4)
let drums = s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")
let bass = note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600)
let melody = n("0 2 4 6").scale("C4:minor").s("piano")

arrange(
  [4, drums],                        // 4 cycles: drums only (intro)
  [8, stack(drums, bass)],           // 8 cycles: add bass
  [8, stack(drums, bass, melody)],   // 8 cycles: full arrangement
  [4, stack(bass, melody)],          // 4 cycles: breakdown
  [4, stack(drums, bass, melody)],   // 4 cycles: return
  [9999, silence]                    // end
)
```

## Multiple Tempos / Polyrhythm
```
// Different speeds via slow() with pattern
note("c3 e3 g3 b3").slow("0.5, 1, 1.5")
```

## Muting
- `_$: pattern` — prefix with underscore to mute a $: line
- `.hush()` — silence a pattern
- `.postgain(0)` — mute via gain