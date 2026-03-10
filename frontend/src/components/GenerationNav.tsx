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
      <button
        onClick={() => setCurrentGeneration(currentGeneration - 1)}
        disabled={!canGoPrev}
      >
        ◀ Previous Gen
      </button>

      <span className="gen-indicator">
        Generation {currentGeneration + 1} of {totalGenerations}
      </span>

      {canGoNext ? (
        <button onClick={() => setCurrentGeneration(currentGeneration + 1)}>
          Next Gen ▶
        </button>
      ) : (
        <button
          className="evolve-btn"
          onClick={onEvolve}
          disabled={!canEvolve}
        >
          {isEvolving
            ? 'Evolving…'
            : `Evolve → (${selectedCount} selected)`}
        </button>
      )}
    </div>
  );
}
