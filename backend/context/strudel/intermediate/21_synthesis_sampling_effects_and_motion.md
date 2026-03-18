# Intermediate Context — Synthesis, Sampling, Effects, and Motion

This level teaches how to shape timbre and motion without breaking musical coherence.
The idea is not merely to add effects, but to make sound design participate in composition.

## 1) Sample, Synth, and Hybrid Source Choices

Drum machine kit:

```strudel
s("bd sd hh").bank("RolandTR909")
```

Basic oscillator:

```strudel
note("c3").s("sawtooth")
```

Noise source:

```strudel
s("white*8").decay(.03).sustain(0)
```

Built-in supersaw texture:

```strudel
note("c3 eb3 g3").s("supersaw")
```

Bundled wavetable source:

```strudel
note("c3").s("wt_flute")
```

GM instrument layer:

```strudel
note("c4 e4 g4").s("gm_epiano1")
```

## 2) Sample Variants and Bank Movement

Choose variants by `n`:

```strudel
s("hh*8").bank("RolandTR909").n("0 1 2 3")
```

Pattern the bank itself:

```strudel
s("bd sd hh").bank("<RolandTR808 RolandTR909>")
```

Alternate clap types by cycle:

```strudel
s("<cp rim>").bank("AkaiLinn")
```

Subtle variant motion creates realism without changing the rhythm.

## 3) Signal-Driven Motion

Basic LFO-like filter sweep:

```strudel
note("c3 eb3 g3").s("sawtooth").lpf(sine.range(300,2400).slow(4))
```

Exponential range for frequency-like controls:

```strudel
s("hh*16").cutoff(saw.rangex(800,12000).slow(2))
```

Random panning:

```strudel
s("perc*8").pan(rand)
```

Smooth random cutoff:

```strudel
note("c3").s("triangle").lpf(perlin.range(400,3000).slow(3))
```

Stepped random integers:

```strudel
n(irand(7).seg(8)).scale("C4:minor")
```

## 4) Event-Sampled vs Continuously Moving Parameters

Many Strudel parameters are sampled when an event fires.
If the pattern has only one event per cycle, modulation can feel stepped even when the source is smooth.
Increase event density when you want smoother motion.

Stepped feel:

```strudel
s("supersaw").lpf(tri.range(200,5000).slow(2))
```

Smoother felt motion by increasing event rate:

```strudel
s("supersaw").seg(16).lpf(tri.range(200,5000).slow(2))
```

This is useful for filter sweeps, tremolo-like movement, or animated sample cuts.

## 5) Filters as Compositional Tools

Closed, dark, muffled:

```strudel
note("c2").s("sawtooth").lpf(250)
```

Bright lead:

```strudel
note("c5").s("square").lpf(4000)
```

Resonant sweep:

```strudel
note("c3").s("sawtooth").lpf(800).lpq(10)
```

Vowel motion:

```strudel
note("c3 eb3 g3").s("sawtooth").vowel("<a e i o>")
```

High-pass cleanup on noise or pads:

```strudel
s("white*8").hpf(7000)
```

Band-pass focus:

```strudel
note("c4").s("pink").bpf(1400).bpq(8)
```

## 6) Filter Envelopes and Pluck Design

Filter snap on a bass stab:

```strudel
note("c2").s("sawtooth").lpf(250).lpa(.01).lpd(.08).lpenv(6)
```

Longer swell:

```strudel
note("c3").s("sawtooth").lpf(500).lpa(.2).lpr(.4).lpenv(4)
```

Envelope depth matters as much as the base cutoff.
Start by choosing the resting brightness, then decide how far the envelope should travel.

## 7) FM, Vibrato, and Other Movement

Gentle FM color:

```strudel
note("c4 eb4 g4").s("triangle").fm(2).fmh(2)
```

Sharper attack via FM envelope:

```strudel
note("c4").s("triangle").fm(4).fmattack(.03)
```

Vibrato for sustained tones:

```strudel
note("g4@4").s("triangle").vib(5)
```

Amplitude wobble:

```strudel
note("c3").s("sawtooth").tremolo(6)
```

Phaser width on a lead:

```strudel
note("c5 eb5 g5").s("square").phaser(4).phasersweep(2000)
```

## 8) Noise Design Beyond Hi-Hats

Soft bed:

```strudel
s("pink").gain(.08).hpf(2000).room(.4)
```

Transient air on percussion:

```strudel
s("white*16").decay(.015).sustain(0).hpf(9000).gain(.1)
```

Crackle texture:

```strudel
s("crackle*4").density(".01 .04 .2 .5")
```

Noise layered under a synth:

```strudel
note("c4").s("triangle").noise(.15)
```

## 9) Sample Manipulation Without External Packs

Clip an event shorter:

```strudel
s("oh*4").clip("1 .5 .25 .1")
```

Trim the end of a sample:

```strudel
s("oh*4").end("1 .5 .25 .1")
```

Playback speed patterning:

```strudel
s("bd rim [~ cp] rim").speed("<1 2 -1 -2>")
```

Granulate with chop:

```strudel
s("misc").chop(8)
```

Specify slice order:

```strudel
s("misc").slice(8, "<0 1 2 3 4 5 6 7>")
```

Time-fitting splice behavior:

```strudel
s("misc").splice(8, "<0 2 4 6>")
```

When a sample-transform texture is central, keep the rest of the piece simpler so the transformed sound reads clearly.

## 10) Built-In and Shabda Sample Strategy

Default built-ins should remain the first choice.
If a custom semantic sample is essential, Shabda is allowed.

Minimal Shabda query:

```strudel
samples('shabda:bass:4,hihat:4,rimshot:2')
```

Then use it like any other sample set:

```strudel
n("0 1 2 3").s("bass")
```

Speech textures are possible too:

```strudel
samples('shabda/speech:forever')
```

```strudel
s("forever").slow(4)
```

Use this sparingly.
Let the semantic sample become a role, not a gimmick pasted on top.

## 11) Delay, Reverb, and Orbit Logic

Simple echo:

```strudel
note("c4 eb4 g4").s("triangle").delay(".4:.25:.4")
```

Large room:

```strudel
chord("<Cm Ab>").voicing().s("gm_pad_warm").room(1).roomsize(8)
```

Short room on drums:

```strudel
s("bd sd hh").room(.15).roomsize(.8)
```

Separate orbit for a wetter world:

```strudel
chord("<Cm Ab>").voicing().orbit(2).room(1).roomsize(10)
```

Global reverb and delay are shared per orbit.
If two parts want very different settings, split their orbits.

## 12) Ducking, Compression, and Glue

Sidechain-like motion:

```strudel
note("c3 eb3 g3").s("supersaw").orbit(2).duck("2:3").duckdepth(.8).duckattack(.2)
```

Compressor on hats or buses:

```strudel
s("hh*8").compressor("-20:20:10:3:6")
```

Postgain for trim or mute:

```strudel
s("bd*4").postgain(.8)
```

A little compression can make rhythmic detail more readable.
Too much can erase accent shape.

## 13) Motion by Layering Rather Than Automation Alone

Transient + body + pad from one note stream:

```strudel
note("c3 eb3 g3").layer(
  x=>x.s("triangle").attack(.005).decay(.08).sustain(0),
  x=>x.s("square").gain(.15).clip(.2),
  x=>x.s("gm_pad_warm").gain(.1).room(.8).release(.6)
)
```

The ear often perceives this as one complex instrument rather than three parts.

## 14) Motion by Transformation Copies

Pitch echo:

```strudel
note("c4 eb4 g4").off(1/8, x=>x.add(note(12)).gain(.25))
```

Filtered answer:

```strudel
note("c4 eb4 g4").off(1/4, x=>x.lpf(1200).gain(.2))
```

Reverse-image stereo split:

```strudel
n("0 2 4 6").scale("C4:minor").jux(rev)
```

## 15) Intermediate Sound-Design Heuristics

At this level, strong timbre design often follows these principles:

- every role has a spectral band
- modulation speed matches musical function
- wet space is assigned intentionally, not everywhere
- motion can come from dynamics, filters, pitch, or timing
- one dramatic sound is better than five half-committed ones
