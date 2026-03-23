import { useMemo } from 'react';
import { Program } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { highlightCode } from '../utils/syntaxHighlight';
import { buildLineNumberText } from '../utils/codeLineNumbers';
import { Modal } from './Modal';

interface Props {
  program: Program | null;
  onClose: () => void;
}

export function CodeModal({ program, onClose }: Props) {
  if (!program) return null;

  const customizedPrograms = useSessionStore.getState().customizedPrograms;
  const displayCode = customizedPrograms[program.id] ?? program.code;
  const highlightedCode = useMemo(
    () => highlightCode(displayCode.endsWith('\n') ? displayCode : `${displayCode}\n`, program.modality),
    [displayCode, program.modality],
  );
  const lineNumbers = useMemo(() => buildLineNumberText(displayCode), [displayCode]);

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>Program Code</h3>
        <button onClick={onClose} title="Close">✕</button>
      </div>
      <div className="modal-code code-highlight-static code-with-lines">
        <pre className="code-line-numbers" aria-hidden>{lineNumbers}</pre>
        <pre className="modal-code-content">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
      <div className="modal-meta">
        <span>Generation {program.generation + 1}</span>
        {program.parentIds.length > 0 && (
          <span> · {program.parentIds.length} parent(s)</span>
        )}
        <span> · {program.modality}</span>
      </div>
    </Modal>
  );
}
