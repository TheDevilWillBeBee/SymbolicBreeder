import { useRef, useEffect, useState } from 'react';
import { LineageProgram, RenderHandle } from '../../types';
import { getPlugin } from '../../modalityRegistry';
import { StrudelHighlight } from '../StrudelHighlight';
import { ManifoldToggle } from '../ManifoldToggle';

interface Props {
  program: LineageProgram;
  isShader: boolean;
  isVisual: boolean;
  onShowCode: (p: LineageProgram) => void;
  onPlayStrudel?: (code: string) => void;
  isPlayingStrudel?: boolean;
  onStopStrudel?: () => void;
  isPlayingVisual?: boolean;
  onPlayVisual?: (id: string) => void;
  onStopVisual?: () => void;
}

/**
 * A compact card for displaying one program in the lineage tree.
 *
 * Visual modalities (shader, openscad) show a static snapshot by default.
 * Clicking play swaps in a live render context. Only one lineage card should
 * be live at a time to stay within the browser's WebGL context limit
 * (main card + 1 lineage = 2 max simultaneous WebGL contexts).
 */
export function LineageCard({
  program,
  isShader,
  isVisual,
  onShowCode,
  onPlayStrudel,
  isPlayingStrudel,
  onStopStrudel,
  isPlayingVisual,
  onPlayVisual,
  onStopVisual,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RenderHandle | null>(null);
  const [paused, setPaused] = useState(false);
  const [useManifold, setUseManifold] = useState(true);

  const isStrudel = program.modality === 'strudel';
  const isOpenSCAD = program.modality === 'openscad';
  const isSvg = program.modality === 'svg';
  const hasVisualRender = !isStrudel && !isSvg;

  const svgPreviewRef = useRef<HTMLDivElement>(null);

  // Render a single-frame snapshot when not playing live
  useEffect(() => {
    if (!hasVisualRender || !canvasRef.current || isPlayingVisual) return;
    const canvas = canvasRef.current;
    const plugin = getPlugin(program.modality);
    let cancelled = false;

    // Try synchronous snapshot first (works if already compiled/cached)
    if (plugin.renderSnapshot) {
      const srcCanvas = plugin.renderSnapshot(program.code, 160, 160);
      if (srcCanvas) {
        canvas.width = srcCanvas.width;
        canvas.height = srcCanvas.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(srcCanvas, 0, 0);
        return;
      }
    }

    // If plugin supports async pre-compilation, compile then snapshot
    if (plugin.ensureCompiled) {
      plugin.ensureCompiled(program.code).then(() => {
        if (!cancelled && plugin.renderSnapshot) {
          const srcCanvas = plugin.renderSnapshot(program.code, 160, 160);
          if (srcCanvas && canvas) {
            canvas.width = srcCanvas.width;
            canvas.height = srcCanvas.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(srcCanvas, 0, 0);
          }
        }
      });
      return () => { cancelled = true; };
    }

    // Fallback: render off-screen, capture after a short delay
    const container = document.createElement('div');
    container.style.width = '160px';
    container.style.height = '160px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const handle = plugin.render(program.code, container);
    const timer = setTimeout(() => {
      const srcCanvas = container.querySelector('canvas');
      if (srcCanvas && canvas) {
        canvas.width = srcCanvas.width;
        canvas.height = srcCanvas.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(srcCanvas, 0, 0);
      }
      handle.cleanup();
      document.body.removeChild(container);
    }, 2000);

    return () => {
      clearTimeout(timer);
      handle.cleanup();
      if (container.parentNode) document.body.removeChild(container);
    };
  }, [hasVisualRender, program.code, program.modality, isPlayingVisual]);

  // SVG inline preview
  useEffect(() => {
    if (program.modality !== 'svg' || !svgPreviewRef.current) return;
    const plugin = getPlugin('svg');
    const handle = plugin.render(program.code, svgPreviewRef.current);
    return () => { handle.cleanup(); };
  }, [program.modality, program.code]);

  // Live render when playing
  useEffect(() => {
    if (!hasVisualRender || !isPlayingVisual || !liveRef.current) return;
    handleRef.current?.cleanup();
    const plugin = getPlugin(program.modality);
    handleRef.current = plugin.render(program.code, liveRef.current, { useManifold });
    setPaused(false);
    return () => { handleRef.current?.cleanup(); handleRef.current = null; };
  }, [hasVisualRender, isPlayingVisual, program.code, program.modality, useManifold]);

  const handleToggle = () => {
    if (!handleRef.current) return;
    if (paused) { handleRef.current.resume?.(); setPaused(false); }
    else { handleRef.current.pause?.(); setPaused(true); }
  };

  const handleReset = () => { handleRef.current?.reset?.(); setPaused(false); };

  return (
    <div className="lineage-card">
      {hasVisualRender ? (
        <div className="lineage-card-preview-wrapper">
          {isPlayingVisual ? (
            <div className={'lineage-card-preview ' + program.modality + '-preview'} ref={liveRef} />
          ) : (
            <canvas className="lineage-card-snapshot" ref={canvasRef} />
          )}
          {isOpenSCAD && <ManifoldToggle checked={useManifold} onChange={setUseManifold} />}
        </div>
      ) : program.modality === 'svg' ? (
        <div className="lineage-card-preview-wrapper">
          <div className="lineage-card-preview svg-preview" ref={svgPreviewRef} />
        </div>
      ) : (
        <div className="lineage-card-preview strudel-preview">
          <StrudelHighlight code={program.code} />
          {isPlayingStrudel && <div className="strudel-playing-indicator">&#9834;</div>}
        </div>
      )}
      <div className="lineage-card-controls">
        <div className="lineage-card-controls-left">
          {hasVisualRender ? (
            isPlayingVisual ? (
              <>
                <button
                  className={'play-btn play-btn-sm' + (paused ? '' : ' active')}
                  onClick={handleToggle}
                  title={paused ? 'Resume' : 'Pause'}
                >
                  {paused ? '\u25B6' : '\u23F8'}
                </button>
                <button className="reset-btn reset-btn-sm" onClick={handleReset} title="Reset">↺</button>
                <button
                  className="play-btn play-btn-sm"
                  onClick={() => onStopVisual?.()}
                  title="Stop live preview"
                >&#x25A0;</button>
              </>
            ) : (
              <button
                className="play-btn play-btn-sm"
                onClick={() => onPlayVisual?.(program.id)}
                title="Play live preview"
              >{'\u25B6'}</button>
            )
          ) : !isVisual ? (
            <button
              className={'play-btn play-btn-sm' + (isPlayingStrudel ? ' active' : '')}
              onClick={() => isPlayingStrudel ? onStopStrudel?.() : onPlayStrudel?.(program.code)}
              title={isPlayingStrudel ? 'Stop playback' : 'Play this music program'}
            >
              {isPlayingStrudel ? '\u23F8' : '\u25B6'}
            </button>
          ) : null}
        </div>
        <button className="code-btn code-btn-sm" onClick={() => onShowCode(program)} title="View source code">
          {'</>'}
        </button>
      </div>
      <div className="lineage-card-labels">
        <span className="lineage-card-gen">Gen {program.generation}</span>
      </div>
    </div>
  );
}
