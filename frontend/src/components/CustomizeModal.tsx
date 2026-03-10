import { useState, useRef, useEffect, useCallback } from 'react';
import { Program } from '../types';
import { getPlugin } from '../modalityRegistry';
import { useSessionStore } from '../store/sessionStore';

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
  const cleanupRef = useRef<(() => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const plugin = modality ? getPlugin(modality) : null;

  // Auto-focus the textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
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
    cleanupRef.current?.();
    cleanupRef.current = plugin.previewInModal(code, previewContainerRef.current);
  }, [code, plugin]);

  const handleUseAsParent = useCallback(() => {
    setCustomizedCode(program.id, code);
    onClose();
  }, [code, program.id, setCustomizedCode, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanupRef.current?.();
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
        cleanupRef.current?.();
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
            <button className="preview-btn" onClick={handlePreview}>
              ▶ Preview
            </button>
            <button className="use-parent-btn" onClick={handleUseAsParent}>
              Use as Parent
            </button>
            <button
              className="close-btn"
              onClick={() => {
                cleanupRef.current?.();
                onClose();
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="customize-body">
          <div className="customize-editor">
            <textarea
              ref={textareaRef}
              className="code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
            />
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
