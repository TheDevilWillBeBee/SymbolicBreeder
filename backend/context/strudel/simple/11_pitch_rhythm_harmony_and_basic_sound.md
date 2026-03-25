# Simple Context — Pitch, Rhythm, Harmony, and Basic Sound

This level teaches how to write notes that belong together and how to make them sound intentional.
Use small motifs, shared scales, and simple sound choices.

## 1) Three Main Pitch Workflows

Absolute notes:

```strudel
note("c3 eb3 g3 bb3")
```

Scale degrees inside a scale:

```strudel
n("0 2 4 6").scale("C4:minor")
```

Chord symbols with voicing:

```strudel
chord("<Cm Ab Fm G>").voicing()
```

Use `note()` when exact pitches matter.
Use `n().scale(...)` when you want freedom inside a mode.
Use `chord(...).voicing()` when harmony should guide the piece.

## 2) Shared Harmonic Language

For major/minor scales, always use full mode names: `:major` and `:minor`.
Do not use shorthand like `:maj` or `:min`.

Shared scale variable:

```strudel
var scale = "E:minor"
```

Then reuse it:

```strudel
n("0 2 4 5").scale(scale)
```

```strudel
n("0 0 4 3").scale("E2:minor")
```

Shared progression:

```strudel
const chords = chord("<Am F C G>")
```

Then derive different roles from it:

```strudel
chords.voicing()
```

```strudel
chords.rootNotes(2)
```

```strudel
n("0 1 2 3").set(chords).voicing()
```

## 3) Register Organizes the Mix Before Effects Do

Low bass:

```strudel
note("c2 g1")
```

Mid harmony:

```strudel
chord("<Cm Ab>").voicing().anchor("C4")
```

High motif:

```strudel
n("0 2 4 6").scale("C5:minor")
```

Octave reinforcement:

```strudel
note("c2,c3")
```

Small detuned thickness:

```strudel
note("c3").add(note("0,.07"))
```

The comma form `"0,.07"` is mini-notation inside a quoted pattern string.
Do not write unquoted comma arguments like `note(0,.07)`.

## 4) Motif Writing: Repetition with Change

Plain motif:

```strudel
n("0 2 4 2").scale("D4:dorian")
```

Sequence the contour upward:

```strudel
n("0 2 4 2").add("0 1 2 3").scale("D4:dorian")
```

Answer phrase one step lower:

```strudel
n("0 2 4 2 <0 -1>").scale("D4:dorian")
```

Octave lift for the last note:

```strudel
n("0 2 4 2").scale("D4:dorian").off(3/4, x=>x.add(note(12)).gain(.35))
```

Reverse for variation:

```strudel
n("0 2 4 2").scale("D4:dorian").rev()
```

Mirror feel:

```strudel
n("0 2 4 2").scale("D4:dorian").palindrome()
```

## 5) Bass, Harmony, and Melody Should Not Fight

Bass from chord roots:

```strudel
const chords = chord("<Dm Bb F C>")
```

```strudel
chords.rootNotes(2)
```

Bass from a chord tone pattern:

```strudel
n("0 2 1 0").set(chords).mode("root:d2").voicing()
```

Top-line from the same chord world:

```strudel
n("0 1 2 3").set(chords).voicing()
```

## 6) Chord Symbols and What They Do in Progressions

Use uppercase letters for major triads and add suffixes for quality or tension.
Important rule for this context: use `C^7` for major seventh, not `Cmaj7`.

Major triad (`C`) - stable home color.
Common use: tonic arrival or cadence destination.

```strudel
chord("<F G C>")
```

Minor triad (`Cm`) - darker tonic or modal center.
Common use: minor-key loop center or deceptive cadence landing.

```strudel
chord("<Cm Ab Bb G>")
```

Dominant seventh (`C7`) - contains strong pull to a chord a fifth below.
Common use: cadence driver like V7 to I or secondary dominant motion.

```strudel
chord("<D7 G7 C>")
```

Major seventh (`C^7`) - tonic family with softer, jazzier color.
Common use: final cadence color or smooth tonic in ii-V-I writing.

```strudel
chord("<Dm7 G7 C^7>")
```

Extended chords (`C9`, `Cm9`, `C11`, `C13`) - seventh chords with added upper tones.
Common use: color-rich vamps, dominant setups, or softer long cadential landings.

```strudel
chord("<C9 F9>")
```

```strudel
chord("<Cm9 Ab^7>")
```

```strudel
chord("<C11 F13 C^7>")
```

Altered dominant tensions (`C7b9`, `C7b13`) - dominant chords with extra bite.
Common use: stronger cadence gravity into a tonic, especially in minor.

```strudel
chord("<E7b9 Am>")
```

```strudel
chord("<A7b13 Dm>")
```

Diminished triad (`Co`) - unstable symmetric color.
Common use: passing chord between stable harmonies.

```strudel
chord("<C Co Dm>")
```

Diminished seventh (`Co7`) - compact tension stack with strong resolution pull.
Common use: leading-tone cadence color into minor or major tonic.

```strudel
chord("<Co7 C>")
```

Augmented triad (`Caug`) - raised fifth creates forward motion.
Common use: dominant-area color before resolving to a stable chord.

```strudel
chord("<Caug F>")
```

Suspended chords (`Csus`, `C7sus`) - replace the third to delay major/minor identity.
Common use: hold tension, then resolve to `C` or `C7` for release.

```strudel
chord("<Gsus G>")
```

```strudel
chord("<D7sus D7 G>")
```

## 7) Common Progression Shapes

Minor loop with pop/direct energy:

```strudel
chord("<Am F C G>")
```

ii-V-I with soft tonic landing:

```strudel
chord("<Dm7 G7 C^7>")
```

Minor ii-V-i cadence cell:

```strudel
chord("<Bm7b5 E7b9 Am>")
```

Modal vamp with suspended color:

```strudel
chord("<Dm7 G7sus G7>")
```

Dark descending roots:

```strudel
chord("<Fm Db Eb C>")
```

Dominant color with added tension:

```strudel
chord("<Am D7 G7 C^7>")
```

Passing diminished color:

```strudel
chord("<C Co Dm G7>")
```

Augmented lift before resolution:

```strudel
chord("<C Caug F G>")
```

You do not need many chords if rhythm and timbre are alive.

## 8) Cadence and Release Moves

Dominant to tonic:

```strudel
chord("<G7 C^7>")
```

Minor dominant pull:

```strudel
chord("<E7 Am>")
```

Stronger minor cadence with altered tension:

```strudel
chord("<E7b9 Am>")
```

Suspension resolving into a dominant:

```strudel
chord("<D7sus D7 G>")
```

Leading-tone diminished release:

```strudel
chord("<Bo7 C>")
```

Suspension resolving downward:

```strudel
note("g4 a4 g4 f4")
```

Delayed final note:

```strudel
n("0 2 4 6@2 5 4").scale("C4:major")
```

Pedal point while harmony shifts above it:

```strudel
note("d2@4")
```

```strudel
chord("<Dm Bb Gm A>").voicing()
```

## 9) Make Rhythm and Melody Complement Each Other

On-grid melody:

```strudel
n("0 2 4 5").scale("C4:minor")
```

Syncopated melody:

```strudel
n("0 ~ [2 4] ~ 5").scale("C4:minor")
```

Held-note melody over active drums:

```strudel
n("0@2 2 4@2").scale("C4:minor")
```

Fast decorative pickup into a longer tone:

```strudel
n("[6 7] 0@2 2").scale("A4:minor")
```

## 10) Basic Waveform and Instrument Choices

Pure, simple, round:

```strudel
note("c3").s("sine")
```

Soft but clear:

```strudel
note("c3").s("triangle")
```

Bright and harmonically rich:

```strudel
note("c3").s("sawtooth")
```

Hollow and game-like:

```strudel
note("c3").s("square")
```

Keyboard texture:

```strudel
chord("<Cm Ab>").voicing().s("gm_epiano1")
```

String pad texture:

```strudel
chord("<Cm Ab>").voicing().s("gm_synth_strings_1")
```

## 11) Basic Envelope Design

Short pluck:

```strudel
note("c3").s("triangle").attack(.005).decay(.08).sustain(0).release(.05)
```

Soft pad:

```strudel
note("c3").s("sawtooth").attack(.4).decay(.2).sustain(.6).release(.8)
```

Punchy bass:

```strudel
note("c2").s("sawtooth").attack(.01).decay(.12).sustain(.15).release(.03)
```

Compact ADSR shorthand:

```strudel
note("c3").s("triangle").adsr(".01:.1:.3:.08")
```

## 12) Basic Filter and Space Choices

Darker bass:

```strudel
note("c2").s("sawtooth").lpf(400)
```

Open lead:

```strudel
note("c5").s("square").lpf(2200)
```

Moving filter pattern:

```strudel
note("c3 eb3 g3").s("sawtooth").lpf("400 1600 800 2400")
```

Simple echo:

```strudel
note("c4 eb4 g4").s("triangle").delay(.35)
```

Large room:

```strudel
chord("<Cm Ab>").voicing().s("gm_epiano1").room(.7).roomsize(4)
```

Vocal-ish formant color:

```strudel
note("c3 eb3 g3").s("sawtooth").vowel("<a e i o>")
```

## 13) Noise and Air

Noise hat:

```strudel
s("white*8").decay(.03).sustain(0).hpf(7000)
```

Softer hat:

```strudel
s("pink*8").decay(.05).sustain(0).hpf(5000)
```

Subtle dirt on a tone:

```strudel
note("c4").s("triangle").noise(.08)
```

## 14) Dynamics Matter More Than Extra Notes

Hat accents:

```strudel
s("hh*8").gain("[.3 .8]*4")
```

Randomized dynamics:

```strudel
s("perc*8").gain(rand.range(.25,.75))
```

Velocity as expressive contour:

```strudel
n("0 2 4 6").scale("C4:major").velocity(".4 .6 .9 .7")
```

## 15) Simple Stereo and Layering

Center the bass:

```strudel
note("c2").s("sawtooth").pan(.5)
```

Wider top layer:

```strudel
n("0 2 4 6").scale("C5:major").s("triangle").pan("0 .3 .7 1")
```

Layer two timbres on one note stream:

```strudel
note("c3 eb3 g3").layer(x=>x.s("triangle"), x=>x.s("square").gain(.35))
```

## 16) Simple Composition Heuristics

At this level, musical coherence usually comes from five moves:

- choose one tempo frame
- choose one harmonic frame
- keep bass and harmony related
- let the melody reuse a small contour
- use filters, dynamics, and rests before adding more notes
