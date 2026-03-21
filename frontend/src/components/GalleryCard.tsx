import { useRef, useEffect, useCallback, useState } from 'react';
import { SharedProgram, RenderHandle, LineageProgram } from '../types';
import { getPlugin } from '../modalityRegistry';
import { StrudelHighlight } from './StrudelHighlight';
import { useNavStore } from '../store/navStore';
import { ManifoldToggle } from './ManifoldToggle';

function summarizeLineageModels(lineage: LineageProgram[]): string {
  const models = new Set(lineage.map((p) => p.llmModel).filter(Boolean));
  if (models.size === 0) return 'Unknown';
  if (models.size === 1) return [...models][0]!;
  return 'Several models';
}

function summarizeLineageComplexity(lineage: LineageProgram[]): string {
  const levels = new Set(lineage.map((p) => p.contextProfile).filter(Boolean));
  if (levels.size === 0) return '';
  if (levels.size === 1) return [...levels][0]!;
  return 'Multiple levels';
}

interface Props {
  program: SharedProgram;
  onPlay?: (code: string) => void;
  onStop?: () => void;
  isPlaying?: boolean;
  onBreed?: (program: SharedProgram) => void;
}

export function GalleryCard({ program, onPlay, onStop, isPlaying, onBreed }: Props) {
  const isStrudel = program.modality === 'strudel';
  const isOpenSCAD = program.modality === 'openscad';
  const hasVisualRender = !isStrudel;
  const previewRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RenderHandle | null>(null);
  const [visualPaused, setVisualPaused] = useState(false);
  const [useManifold, setUseManifold] = useState(true);

  useEffect(() => {
    if (!hasVisualRender || !previewRef.current) return;
    handleRef.current?.cleanup();
    const plugin = getPlugin(program.modality);
    handleRef.current = plugin.render(program.code, previewRef.current, { useManifold });
    setVisualPaused(false);
    return () => {
      handleRef.current?.cleanup();
      handleRef.current = null;
    };
  }, [hasVisualRender, program.code, program.modality, useManifold]);

  const handleTogglePause = useCallback(() => {
    if (!handleRef.current) return;
    if (visualPaused) {
      handleRef.current.resume?.();
      setVisualPaused(false);
    } else {
      handleRef.current.pause?.();
      setVisualPaused(true);
    }
  }, [visualPaused]);

  const handleReset = useCallback(() => {
    handleRef.current?.reset?.();
    setVisualPaused(false);
  }, []);

  const goToDetail = useNavStore((s) => s.goToDetail);

  const handleCardClick = useCallback(() => {
    goToDetail(program.id);
  }, [goToDetail, program.id]);

  return (
    <div className={'gallery-card' + (isPlaying ? ' playing' : '')}>
      {hasVisualRender ? (
        <div className="gallery-card-preview-wrapper" onClick={handleCardClick}>
          <div className={'gallery-card-preview ' + program.modality + '-preview'} ref={previewRef} />
          {isOpenSCAD && <ManifoldToggle checked={useManifold} onChange={setUseManifold} />}
        </div>
      ) : (
        <div className="gallery-card-preview strudel-preview" onClick={handleCardClick}>
          <StrudelHighlight code={program.code} />
          {isPlaying && <div className="strudel-playing-indicator">&#9834;</div>}
        </div>
      )}

      {/* Controls row: play/pause+reset left, breed right */}
      <div className="gallery-card-controls">
        <div className="gallery-card-controls-left">
          {hasVisualRender ? (
            <>
              <button
                className={'play-btn' + (visualPaused ? '' : ' active')}
                onClick={(e) => { e.stopPropagation(); handleTogglePause(); }}
                title={visualPaused ? 'Resume' : 'Pause'}
              >
                {visualPaused ? '\u25B6' : '\u23F8'}
              </button>
              <button
                className="reset-btn"
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                title="Reset to initial state"
              >
                ↺
              </button>
            </>
          ) : (
            <button
              className={'play-btn' + (isPlaying ? ' active' : '')}
              onClick={(e) => {
                e.stopPropagation();
                isPlaying ? onStop?.() : onPlay?.(program.code);
              }}
              title={isPlaying ? 'Stop playback' : 'Play this music program'}
            >
              {isPlaying ? '\u23F8' : '\u25B6'}
            </button>
          )}
        </div>
        {onBreed && (
          <button
            className="breed-btn"
            onClick={(e) => { e.stopPropagation(); onBreed(program); }}
            title="Start a new breeding session from this program"
          >
            Breed
          </button>
        )}
      </div>

      {/* Labels rows: non-interactive */}
      <div className="gallery-card-labels">
        <span className="gallery-card-sharer">{program.sharerName}</span>
      </div>
      <div className="gallery-card-labels">
        <span className="gallery-card-model">
          Evolved using: {program.lineage.some((p) => p.llmModel) ? summarizeLineageModels(program.lineage) : (program.llmModel || 'Mock')}
        </span>
        {(() => {
          const complexity = summarizeLineageComplexity(program.lineage);
          return complexity ? <span className="gallery-card-complexity">{complexity}</span> : null;
        })()}
      </div>
    </div>
  );
}
