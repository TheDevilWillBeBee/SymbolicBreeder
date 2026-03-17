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
import { ShareModal } from './components/ShareModal';
import { GalleryPage } from './components/GalleryPage';
import { ProgramDetailPage } from './components/ProgramDetailPage';
import { AboutPage } from './components/AboutPage';
import { useStrudelPlayer } from './hooks/useStrudelPlayer';
import { useEvolution } from './hooks/useEvolution';
import { useSessionStore } from './store/sessionStore';
import { useNavStore } from './store/navStore';
import { useGalleryStore } from './store/galleryStore';
import { Program } from './types';
import './App.css';

export default function App() {
  const modality = useSessionStore((s) => s.modality);
  const { play, stop, isReady } = useStrudelPlayer(modality === 'strudel');
  const { startNewSession, evolve } = useEvolution();

  const [theme, setTheme] = useState(() => localStorage.getItem('symbolicBreeder_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('symbolicBreeder_theme', theme);
  }, [theme]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [modalProgram, setModalProgram] = useState<Program | null>(null);
  const [customizeProgram, setCustomizeProgram] = useState<Program | null>(null);
  const [shareProgram, setShareProgram] = useState<Program | null>(null);
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

  const view = useNavStore((s) => s.view);
  const goToLanding = useNavStore((s) => s.goToLanding);
  const goToBreeding = useNavStore((s) => s.goToBreeding);
  const goToGallery = useNavStore((s) => s.goToGallery);
  const goToAbout = useNavStore((s) => s.goToAbout);

  const hasSession = session !== null;
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const [modelPanelOpen, setModelPanelOpen] = useState(false);

  const galleryModality = useGalleryStore((s) => s.modality);
  const detailProgram = useGalleryStore((s) => s.selectedProgram);

  // Strudel engine needed in breeding with strudel, or gallery/detail when viewing strudel programs.
  const needsStrudel =
    (view === 'breeding' && modality === 'strudel') ||
    (view === 'gallery' && galleryModality === 'strudel') ||
    (view === 'program-detail' && detailProgram?.modality === 'strudel');

  useEffect(() => {
    const cls = 'modality-non-strudel';
    if (!needsStrudel) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }

    return () => {
      document.body.classList.remove(cls);
    };
  }, [needsStrudel]);

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
      goToBreeding();
    },
    [startNewSession, initialPrompt, goToBreeding],
  );

  const handleNewSession = useCallback(() => {
    handleStop();
    useSessionStore.getState().reset();
    setInitialPrompt('');
    goToLanding();
  }, [handleStop, goToLanding]);

  // Render the active view content
  const renderView = () => {
    if (view === 'gallery') return <GalleryPage />;
    if (view === 'program-detail') return <ProgramDetailPage />;
    if (view === 'about') return <AboutPage />;

    // Landing or breeding
    if (view === 'landing' && (!hasSession || !isLoading)) {
      return (
        <div className="start-screen">
          <div className="start-hero">
            <p className="start-subtitle">
              Breed programs through artificial selection
            </p>
            <p className="start-description">
              Inspired by <em>PicBreeder</em>, Symbolic Breeder evolves programs
              &mdash; music and visuals &mdash; using large language models as
              the variation engine. Select what you find interesting, and
              discover what no one planned for.
            </p>
          </div>

          <div className="start-prompt-group">
            <label className="start-prompt-label" htmlFor="theme-input">
              Theme <span className="start-prompt-optional">(optional)</span>
            </label>
            <input
              id="theme-input"
              type="text"
              className="start-prompt-input"
              placeholder='"ambient space", "neon geometry", "organic noise"...'
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && modality) {
                  startNewSession(modality!, initialPrompt || undefined);
                  goToBreeding();
                }
              }}
            />
          </div>

          <ModalitySelector onSelect={handleSelectModality} />

          <button className="gallery-link-btn" onClick={goToGallery} title="Browse programs shared by others">
            Explore Gallery
          </button>
        </div>
      );
    }

    // Breeding view
    return (
      <>
        {session && (
          <p className="session-info">
            Generation {currentGeneration + 1} of &ldquo;{session.name}&rdquo;
          </p>
        )}

        {modality === 'strudel' && !isReady && (
          <div className="loading-banner">Loading Strudel audio engine...</div>
        )}

        {(isLoading || isEvolving) && (
          <LoadingOverlay
            message={
              isLoading
                ? `Seeding generation 0...`
                : `Evolving generation ${currentGeneration + 2}...`
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
            onShare={setShareProgram}
          />
          <GuidanceInput />
          {generations.length > 0 && <GenerationNav onEvolve={handleEvolve} />}
        </main>
      </>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row-top">
          <h1 className="app-title" onClick={goToLanding} title="Go to home page">
            &#10022; Symbolic Breeder
          </h1>
          <button
            className={'header-model-toggle' + (modelPanelOpen ? ' open' : '') + (!llmConfig.apiKey ? ' no-key' : '')}
            onClick={() => setModelPanelOpen((v) => !v)}
            title="Model settings"
          >
            {!llmConfig.apiKey && <span className="header-model-warning">&#9888;</span>}
            <span className="header-model-label">{llmConfig.provider}/{llmConfig.model}</span>
            <span className="header-model-arrow">{modelPanelOpen ? '\u25B4' : '\u25BE'}</span>
          </button>
          <button
            className={'hamburger-btn' + (menuOpen ? ' open' : '')}
            onClick={() => setMenuOpen((v) => !v)}
            title="Menu"
            aria-label="Toggle menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <div className="header-actions header-actions-desktop">
            {view === 'breeding' && hasSession && (
              <span className="modality-badge">{modality}</span>
            )}
            <button className="header-nav-btn" onClick={goToGallery} title="Browse programs shared by others">
              Gallery
            </button>
            {view === 'breeding' && (
              <button onClick={handleNewSession} title="Start a new breeding session">
                New Session
              </button>
            )}
            <button
              className="theme-toggle"
              onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '\u2600' : '\u263D'}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="header-mobile-menu">
            {view === 'breeding' && hasSession && (
              <span className="modality-badge">{modality}</span>
            )}
            <button className="header-nav-btn" onClick={() => { goToGallery(); setMenuOpen(false); }}>
              Gallery
            </button>
            {view === 'breeding' && (
              <button onClick={() => { handleNewSession(); setMenuOpen(false); }}>
                New Session
              </button>
            )}
            <button
              className="theme-toggle"
              onClick={() => { setTheme((t) => t === 'dark' ? 'light' : 'dark'); setMenuOpen(false); }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '\u2600' : '\u263D'}
            </button>
          </div>
        )}
      </header>

      {modelPanelOpen && (
        <div className="header-model-panel">
          <ModelSelector />
        </div>
      )}

      {renderView()}

      <CodeModal program={modalProgram} onClose={() => setModalProgram(null)} />

      {customizeProgram && (
        <CustomizeModal
          program={customizeProgram}
          onClose={() => setCustomizeProgram(null)}
        />
      )}

      {shareProgram && (
        <ShareModal
          program={shareProgram}
          onClose={() => setShareProgram(null)}
        />
      )}

      <LogToasts />

      <footer className="app-footer">
        <span>
          Created by{' '}
          <a href="https://pajouheshgar.github.io" target="_blank" rel="noopener noreferrer">
            Ehsan Pajouheshgar
          </a>
        </span>
        <span className="footer-sep">&middot;</span>
        <button className="footer-link" onClick={goToAbout}>About</button>
        <span className="footer-sep">&middot;</span>
        <a href="https://github.com/TheDevilWillBeBee/SymbolicBreeder" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
