import { useEffect, useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { ModelSelector } from '../../components/ModelSelector';
import { formatLLMLabel } from '../../utils/llmLabel';
import { modalityRegistry } from '../../modalityRegistry';
import { type SandboxTab, useSandboxNav } from '../sandboxStore';
import type { ModalityKey } from '../api/sandboxClient';

const TABS: Array<{ key: SandboxTab; label: string; hint: string }> = [
  { key: 'contexts', label: 'Contexts', hint: 'View / modify the context library' },
  { key: 'quick-test', label: 'Quick Test', hint: 'Compare a few samples per context' },
  { key: 'data-cache', label: 'Data Cache', hint: 'Build large sample caches in background' },
  { key: 'compare', label: 'Compare', hint: 'Filter and compare cached samples' },
];

export function SandboxHeader() {
  const modality = useSandboxNav((s) => s.modality);
  const tab = useSandboxNav((s) => s.tab);
  const setTab = useSandboxNav((s) => s.setTab);
  const setModality = useSandboxNav((s) => s.setModality);
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const apiKey = llmConfig.apiKey;

  const [modelPanelOpen, setModelPanelOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('symbolicBreeder_theme') || 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('symbolicBreeder_theme', theme);
  }, [theme]);

  const llmLabel = formatLLMLabel(
    llmConfig.provider,
    llmConfig.model,
    llmConfig.baseUrl?.trim() || undefined,
  ).toLowerCase();

  const plugin = modality ? modalityRegistry[modality] : null;

  return (
    <header className="sbx-header">
      <div className="sbx-header-row">
        <button
          type="button"
          className="sbx-brand"
          onClick={() => setModality(null)}
          title="Back to modality selector"
        >
          <span className="sbx-brand-spark">&#10022;</span>
          <span className="sbx-brand-text">SymBreeder Sandbox</span>
        </button>

        {modality && plugin && (
          <div className="sbx-mod-pill">
            <ModalityPicker current={modality} onPick={(m) => setModality(m)} />
          </div>
        )}

        <div className="sbx-header-spacer" />

        <button
          className={
            'header-model-toggle' +
            (modelPanelOpen ? ' open' : '') +
            (!apiKey ? ' no-key' : '')
          }
          onClick={() => setModelPanelOpen((v) => !v)}
          title="Model settings"
        >
          {!apiKey && <span className="header-model-warning">&#9888;</span>}
          <span className="header-model-label">{llmLabel}</span>
          <span className="header-model-arrow">{modelPanelOpen ? '\u25B4' : '\u25BE'}</span>
        </button>

        <a className="header-nav-btn" href="/" title="Open the main breeding app">
          Main App
        </a>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '\u2600' : '\u263D'}
        </button>
      </div>

      {modelPanelOpen && (
        <div className="header-model-panel sbx-model-panel">
          <ModelSelector />
        </div>
      )}

      {modality && (
        <nav className="sbx-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={'sbx-tab' + (tab === t.key ? ' active' : '')}
              onClick={() => setTab(t.key)}
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

function ModalityPicker({
  current,
  onPick,
}: {
  current: ModalityKey;
  onPick: (m: ModalityKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const plugins = Object.values(modalityRegistry);
  return (
    <div className="sbx-mod-picker">
      <button
        type="button"
        className="sbx-mod-picker-btn"
        onClick={() => setOpen((v) => !v)}
        title="Change modality"
      >
        <span className="sbx-mod-icon">
          {modalityRegistry[current]?.icon ?? '◆'}
        </span>
        <span className="sbx-mod-label">
          {modalityRegistry[current]?.label ?? current}
        </span>
        <span className="sbx-mod-arrow">{open ? '\u25B4' : '\u25BE'}</span>
      </button>
      {open && (
        <div className="sbx-mod-menu" onMouseLeave={() => setOpen(false)}>
          {plugins.map((p) => (
            <button
              key={p.key}
              type="button"
              className={
                'sbx-mod-menu-item' + (p.key === current ? ' active' : '')
              }
              onClick={() => {
                onPick(p.key as ModalityKey);
                setOpen(false);
              }}
            >
              <span className="sbx-mod-icon">{p.icon}</span>
              <span className="sbx-mod-label">{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
