# SVG Evolution Playbook

This file teaches how to evolve SVG compositions without copying parent markup too literally.
It is shared by all context levels.

## Core Principle

Preserve **phenotype**, not exact markup.

A child should often inherit some combination of:
- shape language
- color palette
- spatial organization
- symmetry type
- visual weight distribution
- typography treatment
- style family
- complexity level
- motion character (advanced level)

A child does **not** need to preserve:
- exact element structure
- exact attribute values
- exact coordinate positions
- exact gradient definitions
- exact group hierarchy

## Read Parents as Traits, Not Templates

Before mutating, infer parent traits along these axes:

- **shape**: geometric, organic, angular, curved, mixed
- **palette**: monochrome, warm, cool, complementary, gradient-heavy, limited
- **symmetry**: radial, bilateral, asymmetric, rotational
- **density**: minimal/sparse, moderate, intricate/dense
- **typography**: none, subtle/accent, integrated, dominant
- **style**: corporate/clean, playful/fun, elegant/refined, technical/precise, organic/natural
- **composition**: centered, off-center, grid-based, radial, freeform
- **depth cues**: flat, layered, pseudo-3D, shadow-based

Mutate these traits deliberately rather than editing markup element by element.

## Mutation Operators by Strength

### A) Close Mutations

Best when the user wants family resemblance and stable quality.

- shift palette hue slightly
- adjust size ratios between elements
- change stroke widths
- modify corner radii
- shift element positions slightly
- change gradient angle or spread
- adjust opacity of secondary elements
- swap between similar font weights
- rotate the composition slightly
- add or remove one accent element

### B) Medium Mutations

Best when you want novelty without losing identity.

- swap shape primitives (circles → polygons, rects → paths)
- convert solid fills to gradients or vice versa
- change symmetry type (bilateral → radial)
- add or remove a pattern fill
- introduce or remove a clipping mask
- change typography from accent to dominant (or vice versa)
- convert geometric shapes to organic curves
- add a filter effect (blur, shadow)
- change layering order to shift depth
- restructure the spatial layout

### C) Bold Mutations

Best for one or two outputs in a batch.

- reinterpret a geometric parent as an organic composition
- reinterpret a flat parent with depth cues and filters
- keep palette but completely change the shape language
- keep the silhouette but change every surface treatment
- convert a text-heavy logo into a pure symbol
- convert a symbol into a text-integrated mark
- reinterpret the theme in a different style family entirely

Bold mutation should still keep at least one anchor trait from the parent set.

## Crossover Recipes

Good crossover combines **different trait families** rather than averaging everything.

Useful crossover pairings:
- parent A shape language + parent B color palette
- parent A symmetry + parent B density level
- parent A typography + parent B composition style
- parent A filter treatment + parent B geometric base
- parent A layout + parent B style family

Avoid crossing parents that are already similar in every axis.
Crossover is strongest when each parent contributes something distinct.

## Technique Injection Without Imitation

Inject a technique from context or from another parent only if it changes the phenotype clearly:

- add a gradient to a flat-filled composition
- add a clip path to create a shaped window effect
- add a pattern fill where there was solid color
- add a drop shadow to a flat design
- introduce a mask for soft edge treatment
- add text to a purely geometric composition

Small technique injections can change the feel of a composition more than a full rewrite.

## Composition-First Mutation

When mutating, ask:
1. what is the subject or focal point?
2. how is space organized?
3. what creates visual contrast?
4. what is the color strategy?
5. what is the overall mood or style?

If a mutation changes markup but weakens these five things, it is usually a worse child.

## Guidance Handling

Treat user guidance as a directional bias, not as a command to erase lineage.

Examples:
- "warmer colors" → shift palette toward reds/oranges/ambers, warm the gradients
- "more minimal" → reduce element count, increase whitespace, simplify shapes
- "more dynamic" → add angular elements, asymmetry, or motion (at advanced level)
- "more corporate" → clean lines, restrained palette, structured layout
- "more playful" → rounded shapes, brighter colors, less rigid composition

## Diversity Within a Batch

For a batch of `n` children, distribute outputs intentionally:
- about half: close mutations
- some: medium mutations
- one or two: crossovers
- at most one: bold reinterpretation

This produces search-space coverage without losing lineage.

## Anti-Copy Rules

Do not reproduce parent markup structure element-for-element.
Do not preserve every attribute value, gradient stop, or group name.
Do not make all children differ only by color values.

The goal is **recognizable descent with real novelty**.
