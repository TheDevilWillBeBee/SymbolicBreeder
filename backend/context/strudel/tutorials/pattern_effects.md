# Strudel Pattern Effects Reference

Pattern effects transform the structure or timing of patterns (not the audio signal).

## Time

- `.fast(n)` — speed up the pattern by n
- `.slow(n)` — slow down the pattern by n
- `.early(t)` — shift pattern earlier by t
- `.late(t)` — shift pattern later by t
- `.rev()` — reverse the pattern order

## Structure

- `.jux(fn)` — apply fn to right channel only (stereo split)
  - Example: `s("bd sd hh cp").jux(rev)` — reversed in right ear
- `.add(note(n))` — add value to pattern
- `.ply(n)` — repeat each event n times
  - Example: `s("bd sd").ply(2)` → `s("[bd bd] [sd sd]")`
- `.off(time, fn)` — overlay a transformed copy, offset in time
  - Example: `note("c3 e3 g3").off(1/8, x => x.transpose(12))` — octave echo
- `.echo(times, time, feedback)` — repeat with decay
- `.chop(n)` — granulate: cut each sample into n slices
- `.ribbon(length, overlap)` or `.rib(length, overlap)` — create ribbon patterns

## Randomness

- `.degradeBy(prob)` — randomly silence events (0-1 probability)
- `.sometimes(fn)` — apply fn ~50% of the time
- `.sometimesBy(prob, fn)` — apply fn with given probability
- `.rarely(fn)` — ~10% of the time
- `.almostNever(fn)` — ~2% of the time
- `.often(fn)` — ~75% of the time
- `.almostAlways(fn)` — ~90% of the time

## Layering

- `.layer(fn1, fn2, ...)` — create multiple simultaneous transformations
- `.superimpose(fn)` — stack pattern with transformed version
  - Example: `note("c3").superimpose(x => x.transpose(12))` — octaves

## Euclidean

- `.euclid(pulses, steps)` — Euclidean rhythm
- `.euclidRot(pulses, steps, rotation)` — with rotation
- `.euclidLegato(pulses, steps)` — legato Euclidean

## Arrangement

```
// Using arrange() for song structure
arrange(
  [4, stack(drums, bass)],          // 4 cycles of drums+bass
  [8, stack(drums, bass, melody)],  // 8 cycles adding melody
  [4, stack(drums)],                // 4 cycles outro
  [9999, silence]                   // end
)
```

## Multiple Tempos

```
// Different speeds via slow() with pattern
note("c3 e3 g3 b3").slow("0.5, 1, 1.5")
```
