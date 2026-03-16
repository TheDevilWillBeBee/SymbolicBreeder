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

  function build(id: string): TreeNode {
    const prog = byId.get(id)!;
    const parentIds = prog.parentIds.filter((pid) => byId.has(pid));
    return {
      program: prog,
      children: parentIds.map((pid) => build(pid)),
    };
  }

  return build(root.id);
}

// ── Mini card for lineage — shaders play by default ──

function LineageCard({
  program,
  isShader,
  onShowCode,
  onPlayStrudel,
  isPlayingStrudel,
  onStopStrudel,
}: {
  program: LineageProgram;
  isShader: boolean;
  onShowCode: (p: LineageProgram) => void;
  onPlayStrudel?: (code: string) => void;
  isPlayingStrudel?: boolean;
  onStopStrudel?: () => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RenderHandle | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!isShader || !previewRef.current) return;
    handleRef.current?.cleanup();
    const plugin = getPlugin('shader');
    handleRef.current = plugin.render(program.code, previewRef.current);
    setPaused(false);
    return () => { handleRef.current?.cleanup(); handleRef.current = null; };
  }, [isShader, program.code]);

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
          <div className="lineage-card-preview shader-preview" ref={previewRef} />
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
                title="Reset shader to initial state"
              >
                ↺
              </button>
            </>
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
}: {
  node: TreeNode;
  isShader: boolean;
  onShowCode: (p: LineageProgram) => void;
  onPlayStrudel?: (code: string) => void;
  playingCode?: string | null;
  onStopStrudel?: () => void;
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

  useEffect(() => {
    if (detailId) fetchDetail(detailId);
  }, [detailId]);

  const isShader = program?.modality === 'shader';
  const { play, stop } = useStrudelPlayer(program?.modality === 'strudel');
  const [isPlaying, setIsPlaying] = useState(false);

  // Main preview
  const mainPreviewRef = useRef<HTMLDivElement>(null);
  const mainHandleRef = useRef<RenderHandle | null>(null);
  const [mainPaused, setMainPaused] = useState(false);

  useEffect(() => {
    if (!isShader || !mainPreviewRef.current || !program) return;
    mainHandleRef.current?.cleanup();
    const plugin = getPlugin('shader');
    mainHandleRef.current = plugin.render(program.code, mainPreviewRef.current);
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
            <div className="detail-preview shader-preview" ref={mainPreviewRef} />
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
            <span className="gallery-card-model">{program.llmModel}</span>
            <span className="detail-date">
              {new Date(program.createdAt).toLocaleDateString()}
            </span>
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
