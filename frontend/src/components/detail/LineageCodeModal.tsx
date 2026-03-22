import { useMemo } from 'react';
import { LineageProgram } from '../../types';
import { highlightCode } from '../../utils/syntaxHighlight';
import { Modal } from '../Modal';

/** Code viewer modal for a lineage program node. */
export function LineageCodeModal({ program, onClose }: { program: LineageProgram | null; onClose: () => void }) {
  const highlighted = useMemo(() => {
    if (!program) return '';
    const code = program.code.endsWith('\n') ? program.code : `${program.code}\n`;
    return highlightCode(code, program.modality);
  }, [program]);

  if (!program) return null;

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>Program Code &mdash; Generation {program.generation}</h3>
        <button onClick={onClose} title="Close">&times;</button>
      </div>
      <pre className="modal-code code-highlight-static">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
      <div className="modal-meta">
        <span>Generation {program.generation}</span>
        {program.parentIds.length > 0 && (
          <span> &middot; {program.parentIds.length} parent(s)</span>
        )}
        <span> &middot; {program.modality}</span>
      </div>
    </Modal>
  );
}
