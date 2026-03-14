import { useRef, useEffect, useCallback, useState } from 'react';
import { Program, RenderHandle } from '../types';
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
  const handleRef = useRef<RenderHandle | null>(null);

  // Shader-specific: track paused state locally
  const [shaderPaused, setShaderPaused] = useState(false);

  // For shader cards, render WebGL canvas continuously
  useEffect(() => {
    if (!isShader || !previewRef.current) return;
    handleRef.current?.cleanup();
    const plugin = getPlugin(modality!);
    handleRef.current = plugin.render(displayCode, previewRef.current);
    setShaderPaused(false);
    return () => {
      handleRef.current?.cleanup();
      handleRef.current = null;
    };
  }, [isShader, displayCode, modality]);

  const handleToggleShaderPause = useCallback(() => {
    if (!handleRef.current) return;
    if (shaderPaused) {
      handleRef.current.resume?.();
      setShaderPaused(false);
    } else {
      handleRef.current.pause?.();
      setShaderPaused(true);
    }
  }, [shaderPaused]);

  const handleReset = useCallback(() => {
    handleRef.current?.reset?.();
    setShaderPaused(false);
  }, []);

  return (
    <div
      className={
        'program-card' +
        (isSelected ? ' selected' : '') +
        (isPlaying ? ' playing' : '') +
        (isShader && shaderPaused ? ' paused' : '')
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
          {isShader ? (
            <button
              className={'play-btn' + (shaderPaused ? '' : ' active')}
              onClick={handleToggleShaderPause}
              title={shaderPaused ? 'Resume' : 'Pause'}
            >
              {shaderPaused ? '▶' : '⏸'}
            </button>
          ) : (
            <button
              className={'play-btn' + (isPlaying ? ' active' : '')}
              onClick={() => (isPlaying ? onStop() : onPlay(program))}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          )}
          {isShader && (
            <button
              className="reset-btn"
              onClick={handleReset}
              title="Reset"
            >
              ↺
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
            aria-label="View code"
          >
            {'</>'}
          </button>
        </div>
      </div>
    </div>
  );
}
