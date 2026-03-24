# Advanced Context — Advanced Harmony, Timbre, and Experimental Worlds

This level is for pieces whose identity depends on harmony color, custom timbre, transformed samples, or unusual tuning systems.
It is powerful, but restraint matters.

## 1) Voice-Leading Controls Are Harmonic Orchestration

Plain voicing:

```strudel
chord("<C^7 A7b13 Dm7 G7>").voicing()
```

Anchor lower:

```strudel
chord("<C^7 A7b13 Dm7 G7>").anchor("A3").voicing()
```

Above-anchor voicing mode:

```strudel
chord("<C^7 A7b13 Dm7 G7>").mode("above:c4").voicing()
```

Root mode for bass extraction:

```strudel
n("0").chord("<C^7 A7b13 Dm7 G7>").mode("root:g2").voicing()
```

Select notes from the voiced chord:

```strudel
n("0 2 1 3").chord("<C^7 A7b13 Dm7 G7>").voicing()
```

Use voicings to create smoothness first, then add rhythmic complexity.

## 2) Harmonic Color Beyond Basic Triads

Major seventh softness:

```strudel
chord("<Cmaj7 Amaj7>")
```

Minor ninth depth:

```strudel
chord("<Cm9 Abmaj7>")
```

Suspended tension:

```strudel
chord("<Dsus Dm>")
```

Altered dominant pull:

```strudel
chord("<G7alt Cm>")
```

Planed parallel harmony:

```strudel
note("[0,4,7] [2,6,9] [4,8,11]").add("60")
```

Pedal bass under changing colors:

```strudel
note("c2@4")
```

```strudel
chord("<Cm Dbmaj7 Ab Bb>").voicing()
```

## 3) Borrowed Color and Modal Drift

Mode progression for melodic material:

```strudel
n("0 2 4 6").scale("<D:dorian G:mixolydian C:dorian F:mixolydian>")
```

Borrow one bright chord inside a dark loop:

```strudel
chord("<Cm Ab Fm G>")
```

Static root, different scale colors:

```strudel
n("0 2 4 6").scale("<C:minor C:dorian C:phrygian>")
```

Changing mode can refresh a piece without rewriting its rhythm.

## 4) Advanced Envelope Thinking

Pitch envelope snap:

```strudel
note("c2").s("triangle").penv(7).patt(.01).pdec(.08)
```

Descending pitch blip:

```strudel
note("c2").s("triangle").penv(-5).panchor(0).pdec(.06)
```

Filter envelope pluck with resonance:

```strudel
note("c3").s("sawtooth").lpf(300).lpq(9).lpa(.01).lpd(.09).lpenv(7)
```

Amplitude envelope smear:

```strudel
note("c4 eb4 g4").s("triangle").attack(.2).decay(.3).sustain(.4).release(1.2)
```

These gestures can define instrument identity as strongly as note choice.

## 5) FM, Partials, and Phases

Brighter FM strike:

```strudel
note("c4").s("triangle").fm(6).fmh(3).fmattack(.02)
```

Soft bell-like FM:

```strudel
note("c5 eb5 g5").s("sine").fm(2).fmh(5)
```

Custom harmonic recipe:

```strudel
note("c3").s("user").partials([1,0,.3,0,.1,0,0,.2])
```

Animated harmonic profile:

```strudel
note("c3").s("user").partials([1,0,"0 1","0 1 .3",rand])
```

Animated phase cloud:

```strudel
note("c3 eb3 g3").s("user").partials(randL(20)).phases(randL(20))
```

Partial design is best used when you want a signature synth color that stock waveforms do not provide.

## 6) Wavetable and Loop-Based Timbre

Bundled wavetable source:

```strudel
note("c3 eb3 g3").s("wt_flute")
```

Scan through a wavetable bank:

```strudel
note("c2*8").s("wt_flute").n(run(8))
```

Repurpose a short sample as a synth-like source:

```strudel
note("c3 eb3 g3").s("bd").loop(1).loopEnd(.05).gain(.2)
```

Move the window over time:

```strudel
note("c3").s("wt_flute").loopBegin(0).loopEnd(.1)
```

## 7) Sample Surgery and Texture Design

Short chop cloud:

```strudel
s("misc").chop(16).sometimesBy(.5, x=>x.ply(2))
```

Slice order with recurring motives:

```strudel
s("misc").slice(8, "<0 1 2 3 4*2 5 6 [6 7]>")
```

Splice for time-aware pitch/speed behavior:

```strudel
s("misc").splice(8, "<0 2 4 5>")
```

Scrub a sample window:

```strudel
s("misc").scrub(sine.range(0,1).slow(4))
```

When transformed samples dominate the mix, simplify harmony and leave spectral room.

## 8) Noise as Material, Not Just Decoration

Crackle bed with slow density drift:

```strudel
s("crackle*4").density(perlin.range(.01,.2).slow(8))
```

Filtered brown noise wash:

```strudel
s("brown").bpf(1200).bpq(4).gain(.08).room(.6)
```

Noisy pluck:

```strudel
note("c4").s("triangle").noise(.25).decay(.08).sustain(0)
```

Air burst accent:

```strudel
s("white").clip(.05).hpf(10000).gain(.15)
```

## 9) Motion Through Stereo and Duplication

Reverse in one channel only:

```strudel
n("0 2 4 6").scale("C5:minor").jux(rev)
```

Layered vibrato and octave spread:

```strudel
note("c4 eb4 g4").layer(
  x=>x.s("triangle").vib(4),
  x=>x.s("square").add(note(12)).gain(.18)
)
```

Offset swarm copies:

```strudel
n("0 2 4 6").scale("C5:minor")
  .off(1/16, x=>x.add(note(7)).gain(.2))
  .off(2/16, x=>x.add(note(12)).gain(.12))
```

## 10) Xenharmonic and Frequency-Based Worlds

Direct frequency stream:

```strudel
freq("220 330 440 660")
```

Custom tuning by name:

```strudel
i("0 1 2 3 4 5").tune("hexany15").mul(getFreq('c3')).freq()
```

Tune with another scale family:

```strudel
i("4 8 9 10 5 7 9 11").tune("tranh3").mul(getFreq('c3')).freq()
```

Strummed xenharmonic texture:

```strudel
i("[0 1 2 3 4 5 6]@0.3 -".add("<2 5 8 1>")).tune("sanza").mul(getFreq('c3')).freq().legato(3)
```

Advanced tunings are strongest when rhythm is simple and resonance is allowed to bloom.

## 11) Speech and Semantic Sample Use

Speech fragment from Shabda:

```strudel
samples('shabda/speech:the_drum,forever')
```

Granular chant-like transformation:

```strudel
s("the_drum*2").chop(16).speed(rand.range(.85,1.1))
```

Slow phrase bed:

```strudel
s("forever").slow(4).late(.125)
```

Treat speech as a character or texture layer, not just novelty.
Give it space.

## 12) ZZFX and Parameter-Rich Synthetic Events

Compact synthetic event design:

```strudel
note("c2 eb2 f2 g2").s("z_sawtooth").curve(1).slide(0).noise(0).tremolo(.5)
```

ZZFX is powerful when you want game-like or hyper-synthetic one-shot identities.
Use it sparingly because too many simultaneous parameter-rich voices can blur the piece.

## 13) Experimental World-Building Heuristics

For unusual pieces, still preserve a few anchors:

- one recurring rhythm cell
- one stable register band
- one recurring timbre family
- one harmonic center or drone
- one clearly staged energy arc

If everything is changing all the time, the piece can become unreadable.
If one element stays recognizable, the rest can be adventurous.
