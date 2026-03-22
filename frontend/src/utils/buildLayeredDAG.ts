import { LineageProgram } from '../types';

export interface GenerationLayer {
  generation: number;
  programs: LineageProgram[];
}

export interface TransitionNode {
  guidance?: string;
  llmModel?: string;
  contextProfile?: string;
  /** IDs of programs in the lower (parent) generation */
  parentIds: string[];
  /** IDs of programs in the upper (child) generation */
  childIds: string[];
}

export interface LayeredDAG {
  /** Sorted descending by generation (highest gen = top of display) */
  layers: GenerationLayer[];
  /**
   * One transition per layer, describing how that generation was evolved.
   * transitions[i] sits between layers[i] (upper) and layers[i+1] (lower).
   * May be null for the seed generation if it has no evolution metadata.
   */
  transitions: (TransitionNode | null)[];
}

/**
 * Organises a flat lineage array into a layered DAG for display.
 *
 * Algorithm:
 * 1. Group programs by generation number.
 * 2. Sort generations descending (newest at top).
 * 3. For each adjacent pair of layers, build a TransitionNode from the
 *    upper layer's shared evolution metadata (guidance, model, profile).
 *
 * Returns null if lineage is empty.
 */
export function buildLayeredDAG(lineage: LineageProgram[]): LayeredDAG | null {
  if (lineage.length === 0) return null;

  // Group by generation
  const genMap = new Map<number, LineageProgram[]>();
  for (const p of lineage) {
    const arr = genMap.get(p.generation) || [];
    arr.push(p);
    genMap.set(p.generation, arr);
  }

  const gens = [...genMap.keys()].sort((a, b) => b - a);
  const layers: GenerationLayer[] = gens.map((g) => ({ generation: g, programs: genMap.get(g)! }));

  const transitions: (TransitionNode | null)[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const upperLayer = layers[i];
    const lowerLayer = layers[i + 1];
    const lowerIds = new Set(lowerLayer.programs.map((p) => p.id));

    // Collect IDs of parent programs that appear in the lower layer
    const parentIds = new Set<string>();
    for (const p of upperLayer.programs) {
      for (const pid of p.parentIds) {
        if (lowerIds.has(pid)) parentIds.add(pid);
      }
    }

    const rep = upperLayer.programs[0];
    transitions.push({
      guidance: rep.guidance,
      llmModel: rep.llmModel,
      contextProfile: rep.contextProfile,
      parentIds: [...parentIds],
      childIds: upperLayer.programs.map((p) => p.id),
    });
  }

  // Generation 0 (seed) also shows metadata if present
  const bottomLayer = layers[layers.length - 1];
  const bottomRep = bottomLayer.programs[0];
  if (bottomRep.llmModel || bottomRep.guidance || bottomRep.contextProfile) {
    transitions.push({
      guidance: bottomRep.guidance,
      llmModel: bottomRep.llmModel,
      contextProfile: bottomRep.contextProfile,
      parentIds: [],
      childIds: bottomLayer.programs.map((p) => p.id),
    });
  } else {
    transitions.push(null);
  }

  return { layers, transitions };
}
