import { useRef, useEffect, useCallback } from 'react';
import { Program } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { getPlugin } from '../modalityRegistry';

interface Props {
  program: Program;
  onPlay: (program: Program) => void;
  onStop: () => void;
  onShowCode: (program: Program) => void;
  onCustomize: (program: Program) => void;
}

export function ProgramCard({
  program,
  onPlay,
  onStop,
  onShowCode,
  onCustomize,
}: Props) {
  const playingProgramId = useSessionStore((s) => s.playingProgramId);
  const selectedProgramIds = useSessionStore((s) => s.selectedProgramIds);
  const toggleProgramSelection = useSessionStore((s) => s.toggleProgramSelection);
  const customizedPrograms = useSessionStore((s) => s.customizedPrograms);
  const modality = useSessionStore((s) => s.modality);

  const isPlaying = playingProgramId === program.id;
  const isSelected = selectedProgramIds.has(program.id);
  const isShader = modality === 'shader';

  // Use customized code if available
  const displayCode = customizedPrograms[program.id] ?? program.code;
  const isCustomized = program.id in customizedPrograms;

  const previewRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // For shader cards, render WebGL canvas continuously
  useEffect(() => {
    if (!isShader || !previewRef.current) return;
    cleanupRef.current?.();
    const plugin = getPlugin(modality!);
    cleanupRef.current = plugin.render(displayCode, previewRef.current);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isShader, displayCode, modality]);

  const lines = displayCode.split('\n');
  const preview = lines.slice(0, 4).join('\n');
  const hasMore = lines.length > 4;

  return (
    <div
      className={
        'program-card' +
        (isSelected ? ' selected' : '') +
        (isPlaying ? ' playing' : '')
      }
    >
      {/* Preview area */}
      {isShader ? (
        <div
          className="program-card-preview shader-preview"
          ref={previewRef}
          onClick={() => toggleProgramSelection(program.id)}
        />
      ) : (
        <div
          className="program-card-preview strudel-preview"
          onClick={() => toggleProgramSelection(program.id)}
        >
          <div className="strudel-icon">{isPlaying ? '🔊' : '♪'}</div>
        </div>
      )}

      {/* Controls */}
      <div className="program-card-controls">
        <div className="program-card-left">
          {modality === 'strudel' && (
            <button
              className="play-btn"
              onClick={() => (isPlaying ? onStop() : onPlay(program))}
              title={isPlaying ? 'Stop' : 'Play'}
            >
              {isPlaying ? '⏹' : '▶'}
            </button>
          )}
          <label className="select-toggle">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleProgramSelection(program.id)}
            />
            Select
          </label>
          {isCustomized && <span className="customized-badge">edited</span>}
        </div>
        <div className="program-card-right">
          <button
            className="customize-btn"
            onClick={() => onCustomize(program)}
            title="Customize code"
          >
            ✎
          </button>
          <button
            className="code-btn"
            onClick={() => onShowCode(program)}
            title="View code"
          >
            { }
          </button>
        </div>
      </div>
    </div>
  );
}
