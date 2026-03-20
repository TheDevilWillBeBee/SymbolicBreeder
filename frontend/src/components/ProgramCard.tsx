import { useRef, useEffect, useCallback, useState } from 'react';
import { Program, RenderHandle } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { getPlugin } from '../modalityRegistry';
import { StrudelHighlight } from './StrudelHighlight';

interface Props {
  program: Program;
  onPlay: (program: Program) => void;
  onStop: () => void;
  onShowCode: (program: Program) => void;
  onCustomize: (program: Program) => void;
  onShare?: (program: Program) => void;
}

export function ProgramCard({
  program,
  onPlay,
  onStop,
  onShowCode,
  onCustomize,
  onShare,
}: Props) {
  const playingProgramId = useSessionStore((s) => s.playingProgramId);
  const selectedProgramIds = useSessionStore((s) => s.selectedProgramIds);
  const toggleProgramSelection = useSessionStore((s) => s.toggleProgramSelection);
  const customizedPrograms = useSessionStore((s) => s.customizedPrograms);
  const modality = useSessionStore((s) => s.modality);

  const isPlaying = playingProgramId === program.id;
  const isSelected = selectedProgramIds.has(program.id);
  const isShader = modality === 'shader';
  const isVisual = modality === 'shader' || modality === 'svg';

  // Use customized code if available
  const displayCode = customizedPrograms[program.id] ?? program.code;
  const isCustomized = program.id in customizedPrograms;

  const previewRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RenderHandle | null>(null);

  // Shader-specific: track paused state locally
  const [shaderPaused, setShaderPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  // For visual modalities (shader, svg), render preview continuously
  useEffect(() => {
    if (!isVisual || !previewRef.current) return;
    handleRef.current?.cleanup();
    const plugin = getPlugin(modality!);
    handleRef.current = plugin.render(displayCode, previewRef.current);
    setShaderPaused(false);
    return () => {
      handleRef.current?.cleanup();
      handleRef.current = null;
    };
  }, [isVisual, displayCode, modality]);

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

  const handleCopy = useCallback(() => {
    let code = displayCode;
    if (isShader) {
      const isBuffer = /iChannel0/.test(code);
      // Add Shadertoy setup instructions for buffer shaders
      if (isBuffer) {
        code =
          '// Shadertoy setup: paste into "Buffer A" tab,\n' +
          '// then set iChannel0 = Buffer A (self-feedback).\n' +
          '// Create an "Image" tab with: void mainImage(out vec4 o, in vec2 f) { o = texture(iChannel0, f/iResolution.xy); }\n' +
          '// and set its iChannel0 = Buffer A.\n\n' +
          code;
      }
    }
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [displayCode, isShader]);

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
      {isVisual ? (
        <div
          className={`program-card-preview ${modality}-preview`}
          ref={previewRef}
          onClick={() => toggleProgramSelection(program.id)}
        />
      ) : (
        <div
          className="program-card-preview strudel-preview"
          onClick={() => toggleProgramSelection(program.id)}
        >
          <StrudelHighlight code={displayCode} />
          {isPlaying && <div className="strudel-playing-indicator">♪</div>}
        </div>
      )}

      {/* Controls */}
      <div className="program-card-controls">
        <div className="program-card-left">
          {isShader ? (
            <button
              className={'play-btn' + (shaderPaused ? '' : ' active')}
              onClick={handleToggleShaderPause}
              title={shaderPaused ? 'Resume shader animation' : 'Pause shader animation'}
            >
              {shaderPaused ? '▶' : '⏸'}
            </button>
          ) : modality !== 'svg' ? (
            <button
              className={'play-btn' + (isPlaying ? ' active' : '')}
              onClick={() => (isPlaying ? onStop() : onPlay(program))}
              title={isPlaying ? 'Stop playback' : 'Play this music program'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          ) : null}
          {isShader && (
            <button
              className="reset-btn"
              onClick={handleReset}
              title="Reset shader to initial state"
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
            className={'copy-btn' + (copied ? ' copied' : '')}
            onClick={handleCopy}
            title="Copy code to clipboard"
          >
            {copied ? '✓' : '⧉'}
          </button>
          <button
            className="customize-btn"
            onClick={() => onCustomize(program)}
            title="Edit and customize this program's code"
          >
            ✎
          </button>
          <button
            className="code-btn"
            onClick={() => onShowCode(program)}
            title="View full source code"
            aria-label="View code"
          >
            {'</>'}
          </button>
          {onShare && (
            <button
              className="share-btn"
              onClick={() => onShare(program)}
              title="Share this program to the gallery"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
