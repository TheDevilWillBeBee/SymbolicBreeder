import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useGalleryStore } from '../store/galleryStore';
import { useNavStore } from '../store/navStore';
import { useSessionStore } from '../store/sessionStore';
import { useStrudelPlayer } from '../hooks/useStrudelPlayer';
import { getPlugin } from '../modalityRegistry';
import { StrudelHighlight } from './StrudelHighlight';
import { RenderHandle } from '../types';
import { ManifoldToggle } from './ManifoldToggle';
import { buildLayeredDAG } from '../utils/buildLayeredDAG';
import { LayeredTreeView } from './detail/LayeredTreeView';
import { LineageCodeModal } from './detail/LineageCodeModal';
import type { LineageProgram } from '../types';

export function ProgramDetailPage() {
  const detailId = useNavStore((s) => s.detailProgramId);
  const goToGallery = useNavStore((s) => s.goToGallery);
  const goToBreeding = useNavStore((s) => s.goToBreeding);
  const program = useGalleryStore((s) => s.selectedProgram);
  const fetchDetail = useGalleryStore((s) => s.fetchProgramDetail);
  const isLoading = useGalleryStore((s) => s.isLoading);

  const [codeModalProgram, setCodeModalProgram] = useState<LineageProgram | null>(null);
  const [playingCode, setPlayingCode] = useState<string | null>(null);
  const [playingVisualId, setPlayingVisualId] = useState<string | null>(null);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);

  const handlePlayVisual = useCallback((id: string) => setPlayingVisualId(id), []);
  const handleStopVisual = useCallback(() => setPlayingVisualId(null), []);

  useEffect(() => {
    if (detailId) fetchDetail(detailId);
  }, [detailId]);

  const isShader = program?.modality === 'shader';
  const isStrudel = program?.modality === 'strudel';
  const isOpenSCAD = program?.modality === 'openscad';
  const isVisual = program?.modality === 'shader' || program?.modality === 'svg' || program?.modality === 'openscad';
  const hasVisualRender = !isStrudel && !!program;
  const { play, stop } = useStrudelPlayer(isStrudel);
  const [isPlaying, setIsPlaying] = useState(false);

  // Main preview — callback ref ensures render starts even when the div
  // appears asynchronously (after the gallery fetch completes).
  const mainHandleRef = useRef<RenderHandle | null>(null);
  const mainPreviewRef = useRef<HTMLDivElement | null>(null);
  const [mainPaused, setMainPaused] = useState(false);
  const [useManifold, setUseManifold] = useState(true);
  const prevCodeRef = useRef<string | null>(null);
  const prevManifoldRef = useRef(true);

  const mainRefCallback = useCallback((node: HTMLDivElement | null) => {
    mainPreviewRef.current = node;
    if (node && hasVisualRender && program) {
      mainHandleRef.current?.cleanup();
      const plugin = getPlugin(program.modality);
      mainHandleRef.current = plugin.render(program.code, node, { useManifold });
      prevCodeRef.current = program.code;
      setMainPaused(false);
    }
  }, [hasVisualRender, program, useManifold]);

  // Re-render when code or manifold setting changes while the div already exists
  useEffect(() => {
    if (!hasVisualRender || !mainPreviewRef.current || !program) return;
    if (prevCodeRef.current === program.code && prevManifoldRef.current === useManifold) return;
    mainHandleRef.current?.cleanup();
    const plugin = getPlugin(program.modality);
    mainHandleRef.current = plugin.render(program.code, mainPreviewRef.current, { useManifold });
    prevCodeRef.current = program.code;
    prevManifoldRef.current = useManifold;
    setMainPaused(false);
    return () => { mainHandleRef.current?.cleanup(); mainHandleRef.current = null; };
  }, [hasVisualRender, program?.code, program?.modality, useManifold]);

  const handlePlay = useCallback(() => {
    if (!program || isVisual) return;
    play(program.code);
    setIsPlaying(true);
    setPlayingCode(program.code);
  }, [program, isVisual, play]);

  const handleStop = useCallback(() => {
    stop();
    setIsPlaying(false);
    setPlayingCode(null);
  }, [stop]);

  const handlePlayStrudel = useCallback((code: string) => {
    play(code);
    setIsPlaying(code === program?.code);
    setPlayingCode(code);
  }, [play, program]);

  const handleBack = useCallback(() => {
    handleStop();
    goToGallery();
  }, [handleStop, goToGallery]);

  const handleMainToggle = useCallback(() => {
    if (!mainHandleRef.current) return;
    if (mainPaused) { mainHandleRef.current.resume?.(); setMainPaused(false); }
    else { mainHandleRef.current.pause?.(); setMainPaused(true); }
  }, [mainPaused]);

  const handleMainReset = useCallback(() => {
    mainHandleRef.current?.reset?.();
    setMainPaused(false);
  }, []);

  const handleBreed = useCallback(() => {
    if (!program) return;
    handleStop();
    const store = useSessionStore.getState();
    store.reset();
    store.setModality(program.modality);
    store.addGeneration([{
      id: crypto.randomUUID(),
      code: program.code,
      modality: program.modality,
      generation: 0,
      parentIds: [],
      sessionId: '',
      createdAt: new Date().toISOString(),
    }]);
    goToBreeding();
  }, [program, handleStop, goToBreeding]);

  const dag = useMemo(() => {
    if (!program) return null;
    return buildLayeredDAG(program.lineage);
  }, [program]);

  if (isLoading) {
    return <div className="detail-loading">Loading program...</div>;
  }

  if (!program) {
    return (
      <div className="detail-not-found">
        <p>Program not found.</p>
        <button onClick={handleBack}>Back to Gallery</button>
      </div>
    );
  }

  return (
    <div className="program-detail-page">
      <button className="detail-back-btn" onClick={handleBack} title="Return to gallery">
        &larr; Back to Gallery
      </button>

      <div className="detail-main">
        <div className="detail-main-card">
          {hasVisualRender ? (
            <div className="detail-preview-wrapper">
              <div className={'detail-preview ' + program.modality + '-preview'} ref={mainRefCallback} />
              {isOpenSCAD && <ManifoldToggle checked={useManifold} onChange={setUseManifold} />}
            </div>
          ) : (
            <div className="detail-preview strudel-preview">
              <StrudelHighlight code={program.code} />
              {isPlaying && <div className="strudel-playing-indicator">&#9834;</div>}
            </div>
          )}
          <div className="detail-controls">
            <div className="detail-controls-left">
              {hasVisualRender ? (
                <>
                  <button
                    className={'play-btn' + (mainPaused ? '' : ' active')}
                    onClick={handleMainToggle}
                    title={mainPaused ? 'Resume' : 'Pause'}
                  >
                    {mainPaused ? '\u25B6' : '\u23F8'}
                  </button>
                  <button className="reset-btn" onClick={handleMainReset} title="Reset to initial state">
                    ↺
                  </button>
                </>
              ) : !isVisual ? (
                <button
                  className={'play-btn' + (isPlaying ? ' active' : '')}
                  onClick={isPlaying ? handleStop : handlePlay}
                  title={isPlaying ? 'Stop playback' : 'Play this music program'}
                >
                  {isPlaying ? '\u23F8 Stop' : '\u25B6 Play'}
                </button>
              ) : null}
            </div>
            <button className="breed-btn breed-btn-lg" onClick={handleBreed} title="Start a new breeding session using this program as seed">
              Breed from this
            </button>
          </div>
          <div className="detail-labels">
            <span className="gallery-card-sharer">{program.sharerName}</span>
            <span className="detail-date">
              {new Date(program.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="detail-labels">
            <span className="gallery-card-model">
              Evolved using: {(() => {
                const models = new Set(program.lineage.map((p) => p.llmModel).filter(Boolean));
                if (models.size === 0) return program.llmModel || 'Mock';
                if (models.size === 1) return [...models][0];
                return 'Several models';
              })()}
            </span>
            {(() => {
              const levels = new Set(program.lineage.map((p) => p.contextProfile).filter(Boolean));
              if (levels.size === 0) return null;
              const label = levels.size === 1 ? [...levels][0] : 'Multiple levels';
              return <span className="detail-complexity">{label}</span>;
            })()}
          </div>
        </div>
      </div>

      {dag && program.lineage.length > 1 && (
        <div className="detail-lineage">
          <div className="lineage-header">
            <div>
              <h3>Lineage</h3>
              <p className="lineage-subtitle">
                Evolution tree showing how this program was bred
              </p>
            </div>
            <label className="lineage-toggle">
              <input
                type="checkbox"
                checked={showEdgeLabels}
                onChange={(e) => setShowEdgeLabels(e.target.checked)}
              />
              <span>Show evolution details</span>
            </label>
          </div>
          <div className="lineage-tree">
            <LayeredTreeView
              dag={dag}
              isShader={isShader}
              isVisual={isVisual}
              showDetails={showEdgeLabels}
              onShowCode={setCodeModalProgram}
              onPlayStrudel={handlePlayStrudel}
              playingCode={playingCode}
              onStopStrudel={handleStop}
              playingVisualId={playingVisualId}
              onPlayVisual={handlePlayVisual}
              onStopVisual={handleStopVisual}
            />
          </div>
        </div>
      )}

      <LineageCodeModal
        program={codeModalProgram}
        onClose={() => setCodeModalProgram(null)}
      />
    </div>
  );
}
