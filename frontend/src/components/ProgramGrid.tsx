import { ProgramCard } from './ProgramCard';
import { useSessionStore } from '../store/sessionStore';
import { Program } from '../types';

interface Props {
  onPlay: (program: Program) => void;
  onStop: () => void;
  onShowCode: (program: Program) => void;
  onCustomize: (program: Program) => void;
  onShare?: (program: Program) => void;
}

export function ProgramGrid({ onPlay, onStop, onShowCode, onCustomize, onShare }: Props) {
  const generations = useSessionStore((s) => s.generations);
  const currentGeneration = useSessionStore((s) => s.currentGeneration);
  const programs = generations[currentGeneration] ?? [];

  if (programs.length === 0) {
    return (
      <div className="program-grid-empty">
        No programs yet. Start a new session!
      </div>
    );
  }

  return (
    <div className="program-grid">
      {programs.map((program) => (
        <ProgramCard
          key={program.id}
          program={program}
          onPlay={onPlay}
          onStop={onStop}
          onShowCode={onShowCode}
          onCustomize={onCustomize}
          onShare={onShare}
        />
      ))}
    </div>
  );
}
