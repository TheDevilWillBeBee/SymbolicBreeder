import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useGalleryStore } from '../store/galleryStore';
import { useNavStore } from '../store/navStore';
import { useSessionStore } from '../store/sessionStore';
import { useStrudelPlayer } from '../hooks/useStrudelPlayer';
import { getPlugin } from '../modalityRegistry';
import { StrudelHighlight } from './StrudelHighlight';
import { highlightCode } from '../utils/syntaxHighlight';
import { LineageProgram, RenderHandle } from '../types';

// ── Layered DAG building ──

interface GenerationLayer {
  generation: number;
  programs: LineageProgram[];
}

interface TransitionNode {
  guidance?: string;
  llmModel?: string;
  contextProfile?: string;
  parentIds: string[]; // IDs in the layer below (lower gen = parents)
  childIds: string[];  // IDs in this layer (higher gen = produced programs)
}

interface LayeredDAG {
  layers: GenerationLayer[];       // sorted descending by generation
  transitions: (TransitionNode | null)[]; // transitions[i] between layers[i] and layers[i+1]
}

function buildLayeredDAG(lineage: LineageProgram[]): LayeredDAG | null {
  if (lineage.length === 0) return null;

  // Group by generation
  const genMap = new Map<number, LineageProgram[]>();
  for (const p of lineage) {
    const arr = genMap.get(p.generation) || [];
    arr.push(p);
    genMap.set(p.generation, arr);
  }

  // Sort generations descending (highest first = top of display)
  const gens = [...genMap.keys()].sort((a, b) => b - a);
  const layers: GenerationLayer[] = gens.map((g) => ({ generation: g, programs: genMap.get(g)! }));

  // Build transitions between adjacent layers
  const transitions: (TransitionNode | null)[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const upperLayer = layers[i]; // higher gen (children = produced programs)
    const lowerLayer = layers[i + 1]; // lower gen (parents)
    const lowerIds = new Set(lowerLayer.programs.map((p) => p.id));

    // Collect parent IDs from upper layer that exist in lower layer
    const parentIds = new Set<string>();
    for (const p of upperLayer.programs) {
      for (const pid of p.parentIds) {
        if (lowerIds.has(pid)) parentIds.add(pid);
      }
    }

    // Metadata comes from the upper layer (the produced generation)
    const rep = upperLayer.programs[0];
    transitions.push({
      guidance: rep.guidance,
      llmModel: rep.llmModel,
      contextProfile: rep.contextProfile,
      parentIds: [...parentIds],
      childIds: upperLayer.programs.map((p) => p.id),
    });
  }
  // Gen 0 (bottom layer) also gets a transition showing its own metadata
  const bottomLayer = layers[layers.length - 1];
  const bottomRep = bottomLayer.programs[0];
  if (bottomRep.llmModel || bottomRep.guidance || bottomRep.contextProfile) {
    transitions.push({
      guidance: bottomRep.guidance,
      llmModel: bottomRep.llmModel,
      contextProfile: bottomRep.contextProfile,
      parentIds: [],
      childIds: bottomLayer.programs.map((p) => p.id),
    });
  } else {
    transitions.push(null);
  }

  return { layers, transitions };
}

// ── Mini card for lineage ──
// Shaders show a static snapshot by default. Clicking play swaps in a live
// WebGL context; only one lineage shader can be live at a time so we stay
// within the browser's context limit (main card + 1 lineage = 2 max).

function LineageCard({
  program,
  isShader,
  onShowCode,
  onPlayStrudel,
  isPlayingStrudel,
  onStopStrudel,
  isPlayingVisual,
  onPlayVisual,
  onStopVisual,
}: {
  program: LineageProgram;
  isShader: boolean;
  onShowCode: (p: LineageProgram) => void;
  onPlayStrudel?: (code: string) => void;
  isPlayingStrudel?: boolean;
  onStopStrudel?: () => void;
  isPlayingVisual?: boolean;
  onPlayVisual?: (id: string) => void;
  onStopVisual?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RenderHandle | null>(null);
  const [paused, setPaused] = useState(false);

  const isStrudel = program.modality === 'strudel';
  const hasVisualRender = !isStrudel;

  // Render a single-frame snapshot for visual modalities (when not playing live)
  useEffect(() => {
    if (!hasVisualRender || !canvasRef.current || isPlayingVisual) return;
    const canvas = canvasRef.current;
    const plugin = getPlugin(program.modality);

    if (plugin.renderSnapshot) {
      const srcCanvas = plugin.renderSnapshot(program.code, 160, 160);
      if (srcCanvas) {
        canvas.width = srcCanvas.width;
        canvas.height = srcCanvas.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(srcCanvas, 0, 0);
      }
      return;
    }

    // Fallback: off-screen render
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

  // Live WebGL/Three.js context when playing
  useEffect(() => {
    if (!hasVisualRender || !isPlayingVisual || !liveRef.current) return;
    handleRef.current?.cleanup();
    const plugin = getPlugin(program.modality);
    handleRef.current = plugin.render(program.code, liveRef.current);
    setPaused(false);
    return () => { handleRef.current?.cleanup(); handleRef.current = null; };
  }, [hasVisualRender, isPlayingVisual, program.code, program.modality]);

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
                <button
                  className="reset-btn reset-btn-sm"
                  onClick={handleReset}
                  title="Reset"
                >↺</button>
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
          ) : (
            <button
              className={'play-btn play-btn-sm' + (isPlayingStrudel ? ' active' : '')}
              onClick={() => isPlayingStrudel ? onStopStrudel?.() : onPlayStrudel?.(program.code)}
              title={isPlayingStrudel ? 'Stop playback' : 'Play this music program'}
            >
              {isPlayingStrudel ? '\u23F8' : '\u25B6'}
            </button>
          )}
        </div>
        <button
          className="code-btn code-btn-sm"
          onClick={() => onShowCode(program)}
          title="View source code"
        >
          {'</>'}
        </button>
      </div>
      <div className="lineage-card-labels">
        <span className="lineage-card-gen">Gen {program.generation}</span>
      </div>
    </div>
  );
}

// ── Transition card (shared evolution metadata between generations) ──

function TransitionCard({ transition }: { transition: TransitionNode }) {
  const guidance = transition.guidance || '';
  const truncated = guidance.length > 120 ? guidance.slice(0, 120) + '...' : guidance;

  return (
    <div className="transition-card">
      <div className="transition-card-row">
        {transition.llmModel && (
          <span className="transition-model">{transition.llmModel}</span>
        )}
        {transition.contextProfile && (
          <span className="transition-profile">{transition.contextProfile}</span>
        )}
      </div>
      <div className="transition-guidance" title={guidance || undefined}>
        {truncated || 'No guidance'}
      </div>
    </div>
  );
}

// ── Layered DAG renderer ──

function LayeredTreeView({
  dag,
  isShader,
  showDetails,
  onShowCode,
  onPlayStrudel,
  playingCode,
  onStopStrudel,
  playingVisualId,
  onPlayVisual,
  onStopVisual,
}: {
  dag: LayeredDAG;
  isShader: boolean;
  showDetails: boolean;
  onShowCode: (p: LineageProgram) => void;
  onPlayStrudel?: (code: string) => void;
  playingCode?: string | null;
  onStopStrudel?: () => void;
  playingVisualId?: string | null;
  onPlayVisual?: (id: string) => void;
  onStopVisual?: () => void;
}) {
  return (
    <div className="layered-tree">
      {dag.layers.map((layer, i) => (
        <div key={layer.generation} className="layered-tree-section">
          {/* Generation row of cards */}
          <div className="generation-row">
            {layer.programs.map((p) => (
              <LineageCard
                key={p.id}
                program={p}
                isShader={isShader}
                onShowCode={onShowCode}
                onPlayStrudel={onPlayStrudel}
                isPlayingStrudel={playingCode === p.code}
                onStopStrudel={onStopStrudel}
                isPlayingVisual={playingVisualId === p.id}
                onPlayVisual={onPlayVisual}
                onStopVisual={onStopVisual}
              />
            ))}
          </div>

          {/* Edge + transition to next generation */}
          {dag.transitions[i] && (
            <div className="generation-edge">
              {/* Fan-in lines from cards above */}
              <div className="edge-fan">
                {layer.programs.length > 1 && (
                  <div className="edge-stubs">
                    {layer.programs.map((p) => (
                      <div key={p.id} className="edge-stub">
                        <div className="edge-stub-line" />
                      </div>
                    ))}
                  </div>
                )}
                {layer.programs.length > 1 && <div className="edge-bar" />}
                <div className="edge-trunk" />
              </div>

              {/* Transition node with shared metadata */}
              {showDetails && <TransitionCard transition={dag.transitions[i]!} />}

              {/* Fan-out lines to cards below (skip if no next layer) */}
              {dag.layers[i + 1] && (
                <div className="edge-fan">
                  <div className="edge-trunk" />
                  {dag.layers[i + 1].programs.length > 1 && (
                    <>
                      <div className="edge-bar" />
                      <div className="edge-stubs">
                        {dag.layers[i + 1].programs.map((p) => (
                          <div key={p.id} className="edge-stub">
                            <div className="edge-stub-line" />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Code modal for lineage ──

function LineageCodeModal({ program, onClose }: { program: LineageProgram | null; onClose: () => void }) {
  const highlighted = useMemo(() => {
    if (!program) return '';
    const code = program.code.endsWith('\n') ? program.code : `${program.code}\n`;
    return highlightCode(code, program.modality);
  }, [program]);

  if (!program) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
}

// ── Main detail page ──

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

  const handlePlayVisual = useCallback((id: string) => {
    setPlayingVisualId(id);
  }, []);

  const handleStopVisual = useCallback(() => {
    setPlayingVisualId(null);
  }, []);

  useEffect(() => {
    if (detailId) fetchDetail(detailId);
  }, [detailId]);

  const isShader = program?.modality === 'shader';
  const isStrudel = program?.modality === 'strudel';
  const hasVisualRender = !isStrudel && !!program;
  const { play, stop } = useStrudelPlayer(isStrudel);
  const [isPlaying, setIsPlaying] = useState(false);

  // Main preview — use callback ref so visual modality renders even when div appears after fetch
  const mainHandleRef = useRef<RenderHandle | null>(null);
  const mainPreviewRef = useRef<HTMLDivElement | null>(null);
  const [mainPaused, setMainPaused] = useState(false);
  const prevCodeRef = useRef<string | null>(null);

  const mainRefCallback = useCallback((node: HTMLDivElement | null) => {
    mainPreviewRef.current = node;
    if (node && hasVisualRender && program) {
      mainHandleRef.current?.cleanup();
      const plugin = getPlugin(program.modality);
      mainHandleRef.current = plugin.render(program.code, node);
      prevCodeRef.current = program.code;
      setMainPaused(false);
    }
  }, [hasVisualRender, program]);

  // Re-render if code changes while div already exists
  useEffect(() => {
    if (!hasVisualRender || !mainPreviewRef.current || !program) return;
    if (prevCodeRef.current === program.code) return;
    mainHandleRef.current?.cleanup();
    const plugin = getPlugin(program.modality);
    mainHandleRef.current = plugin.render(program.code, mainPreviewRef.current);
    prevCodeRef.current = program.code;
    setMainPaused(false);
    return () => { mainHandleRef.current?.cleanup(); mainHandleRef.current = null; };
  }, [hasVisualRender, program?.code, program?.modality]);

  const handlePlay = useCallback(() => {
    if (!program || isShader) return;
    play(program.code);
    setIsPlaying(true);
    setPlayingCode(program.code);
  }, [program, isShader, play]);

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

  // Stop playback when navigating back
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
    // Don't create a local session — let the backend create one on first evolve
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
            <div className={'detail-preview ' + program.modality + '-preview'} ref={mainRefCallback} />
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
                  <button
                    className="reset-btn"
                    onClick={handleMainReset}
                    title="Reset to initial state"
                  >
                    ↺
                  </button>
                </>
              ) : (
                <button
                  className={'play-btn' + (isPlaying ? ' active' : '')}
                  onClick={isPlaying ? handleStop : handlePlay}
                  title={isPlaying ? 'Stop playback' : 'Play this music program'}
                >
                  {isPlaying ? '\u23F8 Stop' : '\u25B6 Play'}
                </button>
              )}
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
