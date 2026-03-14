# Strudel Mini-Notation Reference

Mini-notation is a compact string syntax for describing patterns.

## Core Syntax

| Syntax | Meaning | Example |
|--------|---------|---------|
| `a b c` | Sequence (space-separated) | `"bd sd hh"` — 3 events per cycle |
| `[a b]` | Subsequence (fit into one step) | `"bd [sd sd] hh"` — sd plays twice in same time as bd |
| `a*n` | Repeat n times | `"hh*4"` — 4 hi-hats per cycle |
| `a/n` | Slow down by n | `"bd/2"` — plays every 2 cycles |
| `<a b c>` | Alternate per cycle | `"<bd sd>"` — bd on odd cycles, sd on even |
| `a,b` | Play simultaneously (stack) | `"bd sd, hh*4"` — drums + hi-hats together |
| `~` or `-` | Rest / silence | `"bd ~ sd ~"` — bd, rest, sd, rest |
| `a!n` | Replicate n times | `"bd!3 sd"` — same as `"bd bd bd sd"` |
| `a@n` | Elongate (stretch over n steps) | `"c3@3 e3"` — c3 lasts 3/4 of cycle |
| `a?` | 50% chance to play | `"bd? sd"` — bd randomly drops out |
| `a:n` | Sample variant | `"bd:3"` — variant 3 of bd |
| `{a b c}%n` | Polymetric (fit over n steps) | `"{0 1 2 3 4}%8"` — 5 events over 8 steps |
| `a(p,s)` | Euclidean rhythm | `"bd(3,8)"` — 3 beats in 8 steps |
| `a(p,s,r)` | Euclidean + rotation | `"hh(5,8,2)"` |

## Combining

- Sequences in brackets: `"[bd sd] hh [cp cp cp]"`
- Nested alternation: `"<[bd sd] [bd bd sd]>"`
- Stacked (comma): `"bd*4, ~ sd ~ sd, hh*8"` — three layers
- Mixed: `"<bd [bd bd]> sd <[hh hh hh] hh*4>"`

## Modifiers on Events

- `a#` — sharp: `"c#3"`
- `ab` — flat: `"eb3"`
- Octave in note names: `"c3"`, `"c4"`, `"c5"`

## Common Drum Patterns

```
// Basic rock beat
s("bd sd bd sd, hh*8")

// Four on the floor (house)
s("bd*4, ~ sd ~ sd, hh*8")

// Breakbeat
s("[bd bd] ~ [~ bd] ~, ~ sd ~ sd, hh*8")

// Hip-hop with swing
s("bd ~ ~ bd ~ ~ bd ~, ~ ~ sd ~ ~ ~ sd ~, hh*8")
```