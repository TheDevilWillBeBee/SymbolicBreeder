# Strudel Audio Effects Reference

## Filter Effects
- `.lpf(freq)` or `.cutoff(freq)` — low-pass filter (removes highs)
- `.hpf(freq)` — high-pass filter (removes lows)
- `.bandf(freq)` — band-pass filter
- `.lpq(q)` / `.bandq(q)` — filter resonance
- `.lpenv(depth)` — filter envelope depth
- `.vowel("a e i o u")` — vowel filter

## Amplitude Envelope (ADSR)
- `.attack(time)` or `.att(time)` — attack time in seconds
- `.decay(time)` or `.dec(time)` — decay time
- `.sustain(level)` or `.sus(level)` — sustain level (0-1)
- `.release(time)` or `.rel(time)` — release time
- Short form: `.adsr("a:d:s:r")`

## Delay
- `.delay(wet)` — delay mix (0-1)
- `.delaytime(time)` — delay time in seconds
- `.delayfeedback(fb)` — feedback amount (0-1)
- Short form: `.delay("wet:time:feedback")`

## Reverb
- `.room(size)` — reverb amount (0-1+)
- `.roomsize(size)` or `.rsize(size)` — room size

## Distortion
- `.distort(amount)` — wave-shaping distortion
- `.distort("amount:mix")` — with dry/wet mix
- `.crush(bits)` — bitcrusher (lower = more crushed)
- `.coarse(factor)` — sample rate reduction
- `.shape(amount)` — wave-shaping

## Panning
- `.pan(value)` — stereo pan (0=left, 0.5=center, 1=right)
- `.pan(rand)` — random panning

## Speed/Pitch
- `.speed(rate)` — playback speed (affects pitch)
- `.fast(n)` / `.slow(n)` — pattern speed (not pitch)

## Dynamics
- `.compressor("threshold:ratio:knee:attack:release")`
- `.postgain(amount)` — output gain

## Ducking (Sidechain)
- `.duck(orbit)` — duck when sounds in given orbit play
- `.duckorbit(n)` — set the duck reference orbit
- `.duckattack(time)` — duck attack time
- `.duckdepth(amount)` — how much to duck

## Modulation
- `.vibrato(freq)` or `.vib(freq)` — vibrato
- `.vibmod(depth)` or `.vibmod(depth)` — vibrato depth
- `.phaser(rate)` — phaser effect
- `.tremolo(rate)` or `.trem(rate)` — amplitude modulation
- `.tremdepth(depth)` — tremolo depth

## Using Signals with Effects
```
// Sweeping filter with sine wave
note("c3 e3 g3").s("sawtooth").lpf(sine.range(200, 2000).slow(4))

// Random panning
s("hh*8").pan(rand)

// Perlin noise on cutoff
s("bd sd").cutoff(perlin.range(500, 3000).slow(2))
```
