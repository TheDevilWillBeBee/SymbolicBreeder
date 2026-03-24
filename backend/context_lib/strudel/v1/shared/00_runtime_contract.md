# Shared Context — Strudel Runtime Contract

This shared file defines the hard rules of the Strudel environment used by Symbolic Breeder.
The topic files that follow are made of fragments and reusable idioms rather than full songs.
When composing final programs, turn those atoms into complete pieces.

## 1) Hard Output Rules

Every finished program should follow this contract:

- Begin with `setcpm(...)`
- Keep the program self-contained and runnable in the Strudel REPL
- Prefer 2 to 6 distinct musical roles unless minimalism is intentional
- Use separate `$:` lines for clearly different roles when possible
- End every top-level role with an inline visual
- Keep pitched parts inside one harmonic world unless modulation is deliberate
- Use built-in Strudel sources freely
- Do not use arbitrary external sample URLs or custom remote sample packs
- If `samples()` is used at all, use it only with Shabda
- Do not use interactive helpers like `slider()` or visual systems unrelated to audio composition

## 2) Tempo Means Cycles Per Minute

A cycle is the core time unit.
The most practical way to target a familiar BPM is:

```strudel
setcpm(120/4)
```

If one cycle represents four beats, `setcpm(bpm/4)` gives a familiar 4-beat feel.
If one cycle represents three beats, use `/3` instead.
The ratio you choose sets the frame for everything else.

Useful starting points:

```strudel
setcpm(90/4)
```

```strudel
setcpm(128/4)
```

```strudel
setcpm(140/2)
```

```strudel
setcpm(75/3)
```

## 3) Shared Harmonic Frame

When more than one pitched role is present, define a common harmonic field near the top.

Shared scale:

```strudel
var scale = "D:minor"
```

Shared progression:

```strudel
const chords = chord("<Dm7 Bb F C>")
```

Shared modal motion:

```strudel
const scaleProg = "<D:dorian G:mixolydian C:dorian F:mixolydian>"
```

Then reuse that harmonic frame across bass, chords, melody, pad, and counter-lines.

## 4) Top-Level Role Shapes

Percussion/noise roles usually begin with `s()` or `sound()`:

```strudel
$: s("bd*4").bank("RolandTR909")._scope()
```

Pitched roles usually begin with `note()`, `n()`, `chord()`, or `freq()`:

```strudel
$: n("0 2 4 5").scale(scale).s("sawtooth")._pianoroll()
```

```strudel
$: chord("<Dm7 G7 Cmaj7>").voicing().s("gm_epiano1")._pianoroll()
```

Use `stack()` when several layers truly belong to one role.
Use `arrange()` when you want sections over time.

## 5) Visual Convention

Use inline visuals, not background visuals.

For drums, percussion, noise, clicks, and sample textures:

```strudel
._scope()
```

For notes, harmony, bass, melodies, and most pitched material:

```strudel
._pianoroll()
```

Use `._punchcard()` when the transformed result matters more than the literal note pattern.

```strudel
._punchcard()
```

## 6) Allowed Sound Sources

Safe defaults:

- drum machine banks via `bank(...)`
- built-in waveforms like `sine`, `triangle`, `square`, `sawtooth`
- built-in noise sources like `white`, `pink`, `brown`, `crackle`
- built-in or bundled instrument names such as GM instruments and `wt_` wavetable sources
- Shabda, if a custom sample flavor is truly part of the idea

Built-in kit switch:

```strudel
s("bd sd hh").bank("<RolandTR808 RolandTR909>")
```

Waveform source:

```strudel
note("c3").s("triangle")
```

Noise source:

```strudel
s("white*8").decay(.03).sustain(0)
```

Shabda-only custom sampling route:

```strudel
samples('shabda:bass:4,hihat:4')
```

Do not use remote GitHub sample packs, raw URLs, or custom `strudel.json` references in this modality.

## 7) Orbit and Global Effect Caution

Delay and reverb are global per orbit.
If two parts in the same orbit set very different delay/reverb values, they can fight each other.
When two layers need very different wet spaces, separate their orbits.

Dry drums in one orbit:

```strudel
s("bd*4").orbit(1)
```

Big pad in another:

```strudel
n("0 2 4 6").scale(scale).s("supersaw").orbit(2).room(1).roomsize(8)
```

## 8) Fragment Status

The code blocks in these context files are atoms:

- one rhythmic cell
- one melodic shape
- one sound-design move
- one modulation pattern
- one arrangement operator

Compose them into complete pieces.
Do not treat any single fragment as the piece itself.
