
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
- Short form: `.adsr("a:d:s:r")` or `.ds("d:s")`

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
- `.hard(amount)` — hard clipping

## Panning
- `.pan(value)` — stereo pan (0=left, 0.5=center, 1=right)
- `.pan(rand)` — random panning

## Speed/Pitch
- `.speed(rate)` — playback speed (affects pitch)
- `.fast(n)` / `.slow(n)` — pattern speed (not pitch)

## Dynamics
- `.compressor("threshold:ratio:knee:attack:release")`
- `.postgain(amount)` — output gain

## Ducking (Sidechain Compression)
- `.duck("orbit:release:depth")` — duck when sounds in given orbit play
- `.duckdepth(amount)` — how much to duck
- `.duckattack(time)` — duck attack time

## Modulation
- `.vibrato(freq)` or `.vib(freq)` — vibrato
- `.phaser(rate)` — phaser effect
- `.phasersweep(freq)` — phaser sweep frequency
- `.tremolo(rate)` or `.trem(rate)` — amplitude modulation

## Using Signals with Effects
```
// Sweeping filter with sine wave
note("c3 e3 g3").s("sawtooth").lpf(sine.range(200, 2000).slow(4))

// Random panning
s("hh*8").pan(rand)

// Perlin noise on cutoff — smooth organic movement
s("bd sd").cutoff(perlin.range(500, 3000).slow(2))

// Saw wave on gain for rhythmic pumping
s("hh*16").gain(saw.range(0.2, 0.8))

// Random gain for humanized dynamics
s("hh*8").gain(rand.range(0.3, 0.8))
```