# OpenSCAD Evolution Playbook

This file teaches how to evolve 3D models without copying parent code too literally.
It is shared by all context levels.

## Core Principle

Preserve **phenotype**, not exact implementation.

A child should often inherit some combination of:
- form language (angular, organic, geometric, mechanical)
- symmetry type (bilateral, radial, spiral, asymmetric)
- structural logic (stacked, nested, branching, lattice)
- surface treatment (smooth, faceted, perforated, ribbed)
- color palette and material logic
- scale hierarchy (dominant form + detail)
- density (sparse, medium, dense)
- compositional approach (monolithic, assembled, layered, woven)

A child does **not** need to preserve:
- exact dimensions or constants
- exact module implementations
- exact ordering of operations
- exact number of repetitions
- exact boolean structure

## Read Parents as Traits, Not Templates

Before mutating, infer parent traits along these axes:

- **form**: cubist, spheroid, toroidal, columnar, branching, crystalline, shell-like
- **symmetry**: none, bilateral, 3-fold, 4-fold, 6-fold, radial, helical
- **structure**: solid, hollow, lattice, shell, layered, stacked, interlocking
- **surface**: smooth, ridged, perforated, textured, faceted, organic
- **color**: monochrome, duotone, gradient, rainbow, metallic, earthy, bright
- **complexity**: minimal, moderate, elaborate, fractal
- **technique**: boolean-heavy, extrusion-based, loop-generated, recursive, hull-based
- **mood**: architectural, mechanical, biological, abstract, decorative, mathematical

Mutate these traits deliberately rather than editing code line by line.

## Mutation Operators by Strength

### A) Close Mutations

Best when the user wants family resemblance and stable quality.

- change dimensions or proportions
- adjust repetition count
- shift color palette
- change $fn resolution
- add or remove one decorative element
- adjust a twist or taper angle
- change hole or cavity sizes
- move the center of gravity
- change rounding radius

### B) Medium Mutations

Best when you want novelty without losing identity.

- swap a boolean operation (union ↔ difference ↔ intersection)
- convert radial symmetry to spiral or bilateral
- replace a primitive with an extruded profile
- add hull between existing elements
- introduce a recursive sub-element
- convert solid to hollow shell
- change from angular to rounded (or vice versa)
- add a lattice or perforation pattern
- introduce minkowski rounding
- swap grid pattern for radial or phyllotaxis

### C) Bold Mutations

Best for one or two outputs in a batch.

- reinterpret a mechanical parent as organic
- reinterpret a solid parent as a lattice structure
- reinterpret a simple parent as a recursive fractal
- keep color and symmetry but change form family entirely
- keep structural logic but change to a different geometric vocabulary
- convert a 2D extruded design into a full 3D composition

Bold mutation should still keep at least one anchor trait from the parent set.

## Crossover Recipes

Good crossover usually combines **different trait families** rather than averaging everything.

Useful crossover pairings:
- parent A form language + parent B color palette
- parent A symmetry + parent B surface treatment
- parent A structural logic + parent B detail elements
- parent A boolean approach + parent B repetition pattern
- parent A scale hierarchy + parent B compositional approach

Avoid crossing parents that are already similar in every axis.
Crossover is strongest when each parent contributes something distinct.

## Technique Injection Without Imitation

Inject a technique from the context or from another parent only if it changes the phenotype clearly.

Examples:
- add hull chains to an angular boolean model → organic smoothing
- add a perforation pattern to a solid shell → filigree effect
- add recursive branching to a simple column → tree-like growth
- add minkowski to a sharp-edged form → softened industrial look
- add spiral placement to a grid-based parent → natural growth feel
- add twist extrusion to a flat profile → helical dynamism

Small technique injections can change the feel of a model more than a full rewrite.

## Composition-First Mutation

When mutating, ask:
1. what is the primary form?
2. what symmetry organizes it?
3. what provides visual interest (detail, pattern, color)?
4. what creates negative space?
5. how does it relate to the ground plane?

If a mutation changes code but weakens these five things, it is usually a worse child.

## Guidance Handling

Treat user guidance as a directional bias, not as a command to erase lineage.

Examples:
- "more organic" → increase curvature, add hull, soften edges, use minkowski
- "more geometric" → sharpen edges, use facets, emphasize grid or tiling
- "taller" → increase vertical scale, add stacking, stretch proportions
- "more complex" → increase repetition, add recursion, add detail layers
- "simpler" → reduce element count, remove detail, enlarge primary form
- "more colorful" → add per-element color variation, use rainbow gradients
- "more mechanical" → add gears, precision holes, interlocking parts, chamfers

## Diversity Within a Batch

For a batch of `n` children, distribute outputs intentionally:
- about half: close mutations
- some: medium mutations
- one or two: crossovers
- at most one: bold reinterpretation

This produces search-space coverage without losing lineage.

## Anti-Copy Rules

Do not reproduce parent code structure block-for-block.
Do not preserve every module name, constant set, or ordering.
Do not make all children differ only by dimensions.

The goal is **recognizable descent with real novelty**.
