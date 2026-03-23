import { useEffect, useMemo, useState } from 'react';
import { LineageProgram } from '../../types';
import { highlightCode } from '../../utils/syntaxHighlight';
import { buildLineNumberText } from '../../utils/codeLineNumbers';
import { Modal } from '../Modal';
import {
  getLineageCode,
  hasCustomizedLineageCode,
  LineageCodeSource,
} from '../../utils/lineageCode';

/** Code viewer modal for a lineage program node. */
export function LineageCodeModal({
  program,
  onClose,
  initialSource,
}: {
  program: LineageProgram | null;
  onClose: () => void;
  initialSource?: LineageCodeSource;
}) {
  const [source, setSource] = useState<LineageCodeSource>(initialSource ?? 'customized');
  const hasCustomized = program ? hasCustomizedLineageCode(program) : false;

  useEffect(() => {
    setSource(initialSource ?? 'customized');
  }, [initialSource, program?.id]);

  const highlighted = useMemo(() => {
    if (!program) return '';
    const selectedCode = getLineageCode(program, source);
    const code = selectedCode.endsWith('\n') ? selectedCode : `${selectedCode}\n`;
    return highlightCode(code, program.modality);
  }, [program, source]);
  const lineNumbers = useMemo(() => {
    if (!program) return '1\n';
    return buildLineNumberText(getLineageCode(program, source));
  }, [program, source]);

  if (!program) return null;

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>Program Code &mdash; Generation {program.generation}</h3>
        {hasCustomized && (
          <select
            className="lineage-code-source-select"
            value={source}
            onChange={(e) => setSource(e.target.value as LineageCodeSource)}
            title="Choose code version"
          >
            <option value="customized">Customized</option>
            <option value="original">Original</option>
          </select>
        )}
        <button onClick={onClose} title="Close">&times;</button>
      </div>
      <div className="modal-code code-highlight-static code-with-lines">
        <pre className="code-line-numbers" aria-hidden>{lineNumbers}</pre>
        <pre className="modal-code-content">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
      <div className="modal-meta">
        <span>Generation {program.generation}</span>
        {hasCustomized && <span> &middot; Viewing {source}</span>}
        {program.parentIds.length > 0 && (
          <span> &middot; {program.parentIds.length} parent(s)</span>
        )}
        <span> &middot; {program.modality}</span>
      </div>
    </Modal>
  );
}
