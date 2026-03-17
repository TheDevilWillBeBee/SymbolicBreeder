import { useSessionStore } from '../store/sessionStore';

interface Props {
  onEvolve: () => void;
}

export function GenerationNav({ onEvolve }: Props) {
  const currentGeneration = useSessionStore((s) => s.currentGeneration);
  const totalGenerations = useSessionStore((s) => s.generations.length);
  const selectedCount = useSessionStore((s) => s.selectedProgramIds.size);
  const isEvolving = useSessionStore((s) => s.isEvolving);
  const setCurrentGeneration = useSessionStore((s) => s.setCurrentGeneration);

  const canGoPrev = currentGeneration > 0;
  const canGoNext = currentGeneration < totalGenerations - 1;
  const canEvolve = selectedCount > 0 && !isEvolving;

  return (
    <div className="generation-nav">
      <div className="generation-nav-left">
        <button
          onClick={() => setCurrentGeneration(currentGeneration - 1)}
          disabled={!canGoPrev}
          title="Go to previous generation"
        >
          ◀ Prev
        </button>
        <span className="gen-indicator">
          Gen {currentGeneration + 1} / {totalGenerations}
        </span>
        <button
          onClick={() => setCurrentGeneration(currentGeneration + 1)}
          disabled={!canGoNext}
          title="Go to next generation"
        >
          Next ▶
        </button>
      </div>
      <button
        className="evolve-btn"
        onClick={onEvolve}
        disabled={!canEvolve}
        title="Generate a new generation from selected programs"
      >
        {isEvolving
          ? 'Evolving…'
          : `Evolve → (${selectedCount} selected)`}
      </button>
    </div>
  );
}
