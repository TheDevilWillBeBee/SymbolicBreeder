import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useGalleryStore } from '../store/galleryStore';
import { useNavStore } from '../store/navStore';
import { useSessionStore } from '../store/sessionStore';
import { useStrudelPlayer } from '../hooks/useStrudelPlayer';
import { getPlugin } from '../modalityRegistry';
import { StrudelHighlight } from './StrudelHighlight';
import { highlightCode } from '../utils/syntaxHighlight';
import { LineageProgram, RenderHandle } from '../types';

// ── Tree building ──

interface TreeNode {
  program: LineageProgram;
  children: TreeNode[];
}

function buildTree(lineage: LineageProgram[]): TreeNode | null {
  if (lineage.length === 0) return null;
  const byId = new Map(lineage.map((p) => [p.id, p]));

  const root = lineage.reduce((a, b) => (a.generation >= b.generation ? a : b));
  const visited = new Set<string>();

  function build(id: string): TreeNode | null {
    if (visited.has(id)) return null;
    visited.add(id);
    const prog = byId.get(id)!;
    const parentIds = prog.parentIds.filter((pid) => byId.has(pid));
    return {
      program: prog,
      children: parentIds.map((pid) => build(pid)).filter((n): n is TreeNode => n !== null),
    };
  }

  return build(root.id);
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
  isPlayingShader,
  onPlayShader,
  onStopShader,
}: {
  program: LineageProgram;
  isShader: boolean;
  onShowCode: (p: LineageProgram) => void;
  onPlayStrudel?: (code: string) => void;
  isPlayingStrudel?: boolean;
  onStopStrudel?: () => void;
  isPlayingShader?: boolean;
  onPlayShader?: (id: string) => void;
  onStopShader?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RenderHandle | null>(null);
  const [paused, setPaused] = useState(false);

  // Render a single-frame snapshot for shaders
  useEffect(() => {
    if (!isShader || !canvasRef.current || isPlayingShader) return;
    const canvas = canvasRef.current;
    const container = document.createElement('div');
    container.style.width = '160px';
    container.style.height = '160px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const plugin = getPlugin('shader');
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
    }, 200);

    return () => {
      clearTimeout(timer);
      handle.cleanup();
      if (container.parentNode) document.body.removeChild(container);
    };
  }, [isShader, program.code, isPlayingShader]);

  // Live WebGL context when playing
  useEffect(() => {
    if (!isShader || !isPlayingShader || !liveRef.current) return;
    handleRef.current?.cleanup();
    const plugin = getPlugin('shader');
    handleRef.current = plugin.render(program.code, liveRef.current);
    setPaused(false);
    return () => { handleRef.current?.cleanup(); handleRef.current = null; };
  }, [isShader, isPlayingShader, program.code]);

  const handleToggle = () => {
    if (!handleRef.current) return;
    if (paused) { handleRef.current.resume?.(); setPaused(false); }
    else { handleRef.current.pause?.(); setPaused(true); }
  };

  const handleReset = () => { handleRef.current?.reset?.(); setPaused(false); };

  return (
    <div className="lineage-card">
      {isShader ? (
        <div className="lineage-card-preview-wrapper">
          {isPlayingShader ? (
            <div className="lineage-card-preview shader-preview" ref={liveRef} />
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
          {isShader ? (
            isPlayingShader ? (
              <>
                <button
                  className={'play-btn play-btn-sm' + (paused ? '' : ' active')}
                  onClick={handleToggle}
                  title={paused ? 'Resume shader' : 'Pause shader'}
                >
                  {paused ? '\u25B6' : '\u23F8'}
                </button>
                <button
                  className="reset-btn reset-btn-sm"
                  onClick={handleReset}
                  title="Reset shader"
                >↺</button>
                <button
                  className="play-btn play-btn-sm"
                  onClick={() => onStopShader?.()}
                  title="Stop live shader"
                >&#x25A0;</button>
              </>
            ) : (
              <button
                className="play-btn play-btn-sm"
                onClick={() => onPlayShader?.(program.id)}
                title="Play shader live"
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

// ── Tree renderer ──

function TreeView({
  node,
  isShader,
  onShowCode,
  onPlayStrudel,
  playingCode,
  onStopStrudel,
  playingShaderId,
  onPlayShader,
  onStopShader,
}: {
  node: TreeNode;
  isShader: boolean;
  onShowCode: (p: LineageProgram) => void;
  onPlayStrudel?: (code: string) => void;
  playingCode?: string | null;
  onStopStrudel?: () => void;
  playingShaderId?: string | null;
  onPlayShader?: (id: string) => void;
  onStopShader?: () => void;
}) {
  return (
    <div className="lineage-tree-node">
      <LineageCard
        program={node.program}
        isShader={isShader}
        onShowCode={onShowCode}
        onPlayStrudel={onPlayStrudel}
        isPlayingStrudel={playingCode === node.program.code}
        onStopStrudel={onStopStrudel}
        isPlayingShader={playingShaderId === node.program.id}
        onPlayShader={onPlayShader}
        onStopShader={onStopShader}
      />
      {node.children.length > 0 && (
        <>
          <div className="lineage-edge-down" />
          <div className="lineage-children">
            {node.children.map((child) => (
              <div key={child.program.id} className="lineage-child-branch">
                <div className="lineage-edge-up" />
                <TreeView
                  node={child}
                  isShader={isShader}
                  onShowCode={onShowCode}
                  onPlayStrudel={onPlayStrudel}
                  playingCode={playingCode}
                  onStopStrudel={onStopStrudel}
                  playingShaderId={playingShaderId}
                  onPlayShader={onPlayShader}
                  onStopShader={onStopShader}
                />
              </div>
            ))}
          </div>
        </>
      )}
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
  const [playingShaderId, setPlayingShaderId] = useState<string | null>(null);

  const handlePlayShader = useCallback((id: string) => {
    setPlayingShaderId(id);
  }, []);

  const handleStopShader = useCallback(() => {
    setPlayingShaderId(null);
  }, []);

  useEffect(() => {
    if (detailId) fetchDetail(detailId);
  }, [detailId]);

  const isShader = program?.modality === 'shader';
  const { play, stop } = useStrudelPlayer(program?.modality === 'strudel');
  const [isPlaying, setIsPlaying] = useState(false);

  // Main preview — use callback ref so shader renders even when div appears after fetch
  const mainHandleRef = useRef<RenderHandle | null>(null);
  const mainPreviewRef = useRef<HTMLDivElement>(null);
  const [mainPaused, setMainPaused] = useState(false);
  const prevCodeRef = useRef<string | null>(null);

  const mainRefCallback = useCallback((node: HTMLDivElement | null) => {
    mainPreviewRef.current = node;
    if (node && isShader && program) {
      mainHandleRef.current?.cleanup();
      const plugin = getPlugin('shader');
      mainHandleRef.current = plugin.render(program.code, node);
      prevCodeRef.current = program.code;
      setMainPaused(false);
    }
  }, [isShader, program]);

  // Re-render shader if code changes while div already exists
  useEffect(() => {
    if (!isShader || !mainPreviewRef.current || !program) return;
    if (prevCodeRef.current === program.code) return;
    mainHandleRef.current?.cleanup();
    const plugin = getPlugin('shader');
    mainHandleRef.current = plugin.render(program.code, mainPreviewRef.current);
    prevCodeRef.current = program.code;
    setMainPaused(false);
    return () => { mainHandleRef.current?.cleanup(); mainHandleRef.current = null; };
  }, [isShader, program?.code]);

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
    store.setSession({
      id: crypto.randomUUID(),
      name: `From ${program.sharerName}'s program`,
      modality: program.modality,
      createdAt: new Date().toISOString(),
    });
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

  const tree = useMemo(() => {
    if (!program) return null;
    return buildTree(program.lineage);
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
          {isShader ? (
            <div className="detail-preview shader-preview" ref={mainRefCallback} />
          ) : (
            <div className="detail-preview strudel-preview">
              <StrudelHighlight code={program.code} />
              {isPlaying && <div className="strudel-playing-indicator">&#9834;</div>}
            </div>
          )}
          <div className="detail-controls">
            <div className="detail-controls-left">
              {isShader ? (
                <>
                  <button
                    className={'play-btn' + (mainPaused ? '' : ' active')}
                    onClick={handleMainToggle}
                    title={mainPaused ? 'Resume shader animation' : 'Pause shader animation'}
                  >
                    {mainPaused ? '\u25B6' : '\u23F8'}
                  </button>
                  <button
                    className="reset-btn"
                    onClick={handleMainReset}
                    title="Reset shader to initial state"
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
            <span className="gallery-card-model">Evolved using: {program.llmModel || 'Mock'}</span>
          </div>
        </div>
      </div>

      {tree && program.lineage.length > 1 && (
        <div className="detail-lineage">
          <h3>Lineage</h3>
          <p className="lineage-subtitle">
            Evolution tree showing how this program was bred
          </p>
          <div className="lineage-tree">
            <TreeView
              node={tree}
              isShader={isShader}
              onShowCode={setCodeModalProgram}
              onPlayStrudel={handlePlayStrudel}
              playingCode={playingCode}
              onStopStrudel={handleStop}
              playingShaderId={playingShaderId}
              onPlayShader={handlePlayShader}
              onStopShader={handleStopShader}
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
