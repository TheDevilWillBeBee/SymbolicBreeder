import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Program, RenderHandle } from '../types';
import { getPlugin } from '../modalityRegistry';
import { useSessionStore } from '../store/sessionStore';
import { highlightCode } from '../utils/syntaxHighlight';

interface Props {
  program: Program;
  onClose: () => void;
}

export function CustomizeModal({ program, onClose }: Props) {
  const modality = useSessionStore((s) => s.modality);
  const customizedPrograms = useSessionStore((s) => s.customizedPrograms);
  const setCustomizedCode = useSessionStore((s) => s.setCustomizedCode);

  const initialCode = customizedPrograms[program.id] ?? program.code;
  const [code, setCode] = useState(initialCode);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewHandleRef = useRef<RenderHandle | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const plugin = modality ? getPlugin(modality) : null;
  const codeModality = modality ?? program.modality;
  const highlightedCode = useMemo(
    () => highlightCode(code.endsWith('\n') ? code : `${code}\n`, codeModality),
    [code, codeModality],
  );

  // Auto-focus the textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previewHandleRef.current?.cleanup();
    };
  }, []);

  const handlePreview = useCallback(() => {
    if (!plugin || !previewContainerRef.current) return;

    // Validate first
    if (plugin.validate) {
      const err = plugin.validate(code);
      if (err) {
        setPreviewError(err);
        return;
      }
    }

    setPreviewError(null);
    previewHandleRef.current?.cleanup();
    previewHandleRef.current = plugin.previewInModal(code, previewContainerRef.current);
  }, [code, plugin]);

  const handleUseAsParent = useCallback(() => {
    setCustomizedCode(program.id, code);
    onClose();
  }, [code, program.id, setCustomizedCode, onClose]);

  const handleEditorScroll = useCallback(() => {
    if (!textareaRef.current || !highlightRef.current) return;
    highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        previewHandleRef.current?.cleanup();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="modal-overlay customize-overlay"
      onClick={() => {
        previewHandleRef.current?.cleanup();
        onClose();
      }}
    >
      <div
        className="customize-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="customize-header">
          <h3>Customize Program</h3>
          <div className="customize-header-actions">
            <button className="preview-btn" onClick={handlePreview} title="Run and preview the edited code">
              ▶ Preview
            </button>
            <button className="use-parent-btn" onClick={handleUseAsParent} title="Save this version and use it as a parent for breeding">
              Use as Parent
            </button>
            <button
              className="close-btn"
              onClick={() => {
                previewHandleRef.current?.cleanup();
                onClose();
              }}
              title="Close without saving"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="customize-body">
          <div className="customize-editor">
            <div className="code-editor-stack">
              <pre
                ref={highlightRef}
                className="code-highlight"
                aria-hidden
              >
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              </pre>
              <textarea
                ref={textareaRef}
                className="code-textarea code-textarea-overlay"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleEditorScroll}
                wrap="off"
                spellCheck={false}
              />
            </div>
          </div>
          <div className="customize-preview">
            {previewError && (
              <div className="preview-error">{previewError}</div>
            )}
            <div
              className="preview-container"
              ref={previewContainerRef}
            >
              <div className="preview-placeholder">
                Press ▶ Preview to see your changes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
