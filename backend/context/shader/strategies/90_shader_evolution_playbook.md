# Shader Evolution Playbook

This file teaches how to evolve shaders without copying parent code too literally.
It is shared by all context levels.

## Core Principle

Preserve **phenotype**, not exact implementation.

A child should often inherit some combination of:
- silhouette logic
- spatial organization
- palette family
- motion tempo
- rendering model
- material feel
- density or sparsity
- memory behavior
- focal composition

A child does **not** need to preserve:
- exact constants
- exact helper implementations
- exact ordering of operations
- exact formula choice
- exact control flow

## Read Parents as Traits, Not Templates

Before mutating, infer parent traits along these axes:

- **space**: centered, tiled, polar, kaleidoscopic, orbital, world-space
- **geometry**: fields, SDF motifs, noise masses, repeated cells, raymarched solids
- **motion**: drift, pulse, spin, orbit, turbulence, growth, feedback
- **surface**: flat graphic, glow-heavy, lit, metallic, foggy, emissive
- **color**: dark neon, pastel, warm metal, icy, monochrome, rainbow, duotone
- **complexity**: sparse, layered, dense, minimal, highly recursive
- **memory**: stateless or stateful
- **camera**: none, implied, orbit, dolly, tunnel, look-at

Mutate these traits deliberately rather than editing code line by line.

## Mutation Operators by Strength

### A) Close Mutations

Best when the user wants family resemblance and stable quality.

- retune frequencies
- retune scale, thickness, roughness, or octave count
- shift palette phase
- alter motion speed or phase
- change repetition count
- change warp amplitude
- add or remove one glow layer
- move the focal center
- change light direction slightly

Micro examples:

```glsl
p *= 1.15;
```

```glsl
float bands = sin(r * 22.0 + iTime * 1.2);
```

```glsl
col = palette(signal + 0.08);
```

### B) Medium Mutations

Best when you want novelty without losing identity.

- swap value noise for ridged or turbulence
- replace hard union with smooth union
- convert stripes into rings or spokes
- replace flat shading with field-normal lighting
- add one more repetition domain
- change from graphic edge to glow-heavy edge
- change point light to directional light
- convert a 2D motif into a shallow height-lit surface

Micro examples:

```glsl
float d = opSmoothUnion(d1, d2, 0.12);
```

```glsl
p += 0.18 * vec2(fbm(p + 1.2), fbm(p + 7.1));
```

```glsl
float rim = pow(1.0 - max(dot(n, v), 0.0), 4.0);
```

### C) Bold Mutations

Best for one or two outputs in a batch.

- reinterpret a 2D parent as raymarched 3D
- reinterpret a graphic parent as a procedural material study
- reinterpret a tiled parent as a feedback simulation
- keep palette and tempo but change geometry family
- keep silhouette logic but change rendering model
- keep memory behavior but change scene grammar completely

Bold mutation should still keep at least one anchor trait from the parent set.

## Crossover Recipes

Good crossover usually combines **different trait families** rather than averaging everything.

Useful crossover pairings:
- parent A geometry + parent B palette
- parent A motion + parent B lighting
- parent A field logic + parent B repetition logic
- parent A buffer behavior + parent B visual finish
- parent A camera + parent B material

Avoid crossing parents that are already similar in every axis.
Crossover is strongest when each parent contributes something distinct.

## Function Injection Without Imitation

Inject a function from the context or from another parent only if it changes the phenotype clearly.

Examples:
- add a palette helper to a monochrome field
- add a warp helper to a rigid grid
- add a fresnel term to a flat-lit surface
- add smooth union to a hard SDF collage
- add AO to a raymarched scene
- add a decay buffer to a moving emitter

Small function injections can change the feel of a shader more than a full rewrite.

## Composition-First Mutation

When mutating, ask:
1. what is the subject?
2. where is the focal region?
3. what is the motion hierarchy?
4. what provides contrast?
5. what is the material or finish?

If a mutation changes math but weakens these five things, it is usually a worse child.

## Guidance Handling

Treat user guidance as a directional bias, not as a command to erase lineage.

Examples:
- "warmer colors" -> shift palette family, emission hue, light temperature
- "more geometric" -> reduce organic warp, strengthen SDF and tiling
- "more fluid" -> increase domain warp, add advection, soften edges
- "more percussion / more intensity" for visuals -> faster pulses, sharper contrast, stronger periodic impact

## Diversity Within a Batch

For a batch of `n` children, distribute outputs intentionally:
- about half: close mutations
- some: medium mutations
- one or two: crossovers
- at most one: bold reinterpretation

This produces search-space coverage without losing lineage.

## Anti-Copy Rules

Do not reproduce parent code structure block-for-block.
Do not preserve every helper name, constant set, or ordering.
Do not make all children differ only by constants.

The goal is **recognizable descent with real novelty**.
