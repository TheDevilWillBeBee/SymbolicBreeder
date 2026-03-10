import { Program } from '../types';
import { useSessionStore } from '../store/sessionStore';

interface Props {
  program: Program | null;
  onClose: () => void;
}

export function CodeModal({ program, onClose }: Props) {
  if (!program) return null;

  const customizedPrograms = useSessionStore.getState().customizedPrograms;
  const displayCode = customizedPrograms[program.id] ?? program.code;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Program Code</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <pre className="modal-code">
          <code>{displayCode}</code>
        </pre>
        <div className="modal-meta">
          <span>Generation {program.generation + 1}</span>
          {program.parentIds.length > 0 && (
            <span> · {program.parentIds.length} parent(s)</span>
          )}
          <span> · {program.modality}</span>
        </div>
      </div>
    </div>
  );
}
