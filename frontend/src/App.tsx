import { useState, useCallback, useEffect } from 'react';
import { ModalitySelector } from './components/ModalitySelector';
import { ModelSelector } from './components/ModelSelector';
import { ProgramGrid } from './components/ProgramGrid';
import { GuidanceInput } from './components/GuidanceInput';
import { GenerationNav } from './components/GenerationNav';
import { CodeModal } from './components/CodeModal';
import { CustomizeModal } from './components/CustomizeModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { LogToasts } from './components/LogToasts';
import { useStrudelPlayer } from './hooks/useStrudelPlayer';
import { useEvolution } from './hooks/useEvolution';
import { useSessionStore } from './store/sessionStore';
import { Program } from './types';
import './App.css';

export default function App() {
  const modality = useSessionStore((s) => s.modality);
  const { play, stop, isReady } = useStrudelPlayer(modality === 'strudel');
  const { startNewSession, evolve } = useEvolution();

  const [modalProgram, setModalProgram] = useState<Program | null>(null);
  const [customizeProgram, setCustomizeProgram] = useState<Program | null>(null);
  const [initialPrompt, setInitialPrompt] = useState('');

  const generations = useSessionStore((s) => s.generations);
  const currentGeneration = useSessionStore((s) => s.currentGeneration);
  const selectedProgramIds = useSessionStore((s) => s.selectedProgramIds);
  const guidance = useSessionStore((s) => s.guidance);
  const session = useSessionStore((s) => s.session);
  const isEvolving = useSessionStore((s) => s.isEvolving);
  const isLoading = useSessionStore((s) => s.isLoading);
  const customizedPrograms = useSessionStore((s) => s.customizedPrograms);
  const setPlayingProgramId = useSessionStore((s) => s.setPlayingProgramId);

  const hasSession = session !== null;
  const hasModality = modality !== null;

  useEffect(() => {
    const cls = 'modality-non-strudel';
    if (modality !== 'strudel') {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }

    return () => {
      document.body.classList.remove(cls);
    };
  }, [modality]);

  const handlePlay = useCallback(
    (program: Program) => {
      const code = customizedPrograms[program.id] ?? program.code;
      play(code);
      setPlayingProgramId(program.id);
    },
    [play, setPlayingProgramId, customizedPrograms],
  );

  const handleStop = useCallback(() => {
    stop();
    setPlayingProgramId(null);
  }, [stop, setPlayingProgramId]);

  const handleEvolve = useCallback(() => {
    const programs = generations[currentGeneration] ?? [];
    const selected = programs.filter((p) => selectedProgramIds.has(p.id));
    if (selected.length === 0) return;
    handleStop();
    evolve(selected, guidance || undefined);
  }, [generations, currentGeneration, selectedProgramIds, guidance, evolve, handleStop]);

  const handleSelectModality = useCallback(
    (mod: string) => {
      startNewSession(mod, initialPrompt || undefined);
    },
    [startNewSession, initialPrompt],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>✦ Symbolic Breeder</h1>
        <div className="header-actions">
          {hasSession && (
            <span className="modality-badge">{modality}</span>
          )}
          <button
            onClick={() => {
              handleStop();
              useSessionStore.getState().reset();
              setInitialPrompt('');
            }}
          >
            New Session
          </button>
        </div>
      </header>

      {!hasSession && !isLoading ? (
        <div className="start-screen">
          <p className="start-subtitle">
            Evolve programs through selection — powered by LLM
          </p>
          <div className="start-prompt-group">
            <input
              type="text"
              className="start-prompt-input"
              placeholder='Optional theme: "ambient space", "neon geometry", "organic noise"…'
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && hasModality) {
                  startNewSession(modality!, initialPrompt || undefined);
                }
              }}
            />
          </div>
          <ModelSelector />
          <ModalitySelector onSelect={handleSelectModality} />
        </div>
      ) : (
        <>
          {session && (
            <p className="session-info">
              Generation {currentGeneration + 1} of &ldquo;{session.name}&rdquo;
            </p>
          )}

          {modality === 'strudel' && !isReady && (
            <div className="loading-banner">Loading Strudel audio engine…</div>
          )}

          {(isLoading || isEvolving) && (
            <LoadingOverlay
              message={
                isLoading
                  ? `Seeding generation 0…`
                  : `Evolving generation ${currentGeneration + 2}…`
              }
              hint={
                modality === 'shader'
                  ? 'The LLM is crafting shaders for you'
                  : 'The LLM is composing music for you'
              }
            />
          )}

          <main>
            <ProgramGrid
              onPlay={handlePlay}
              onStop={handleStop}
              onShowCode={setModalProgram}
              onCustomize={setCustomizeProgram}
            />
            <GuidanceInput />
            {generations.length > 0 && <GenerationNav onEvolve={handleEvolve} />}
          </main>
        </>
      )}

      <CodeModal program={modalProgram} onClose={() => setModalProgram(null)} />

      {customizeProgram && (
        <CustomizeModal
          program={customizeProgram}
          onClose={() => setCustomizeProgram(null)}
        />
      )}

      <LogToasts />
    </div>
  );
}
