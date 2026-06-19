import { useEffect, useMemo, useState } from 'react';
import {
  type ContextVersionSummary,
  type ModalityKey,
  type ParentItem,
  type PromptItem,
  type SampleItem,
  sandboxContextsApi,
  sandboxParentsApi,
  sandboxPromptsApi,
  streamQuickTest,
} from '../api/sandboxClient';
import { useSessionStore } from '../../store/sessionStore';
import { setApiLLMConfig } from '../../api/client';
import { SampleCard } from '../components/SampleCard';
import { SampleDetailModal } from '../components/SampleDetailModal';
import {
  ParentLibraryDrawer,
  PromptLibraryDrawer,
} from '../components/LibraryDrawers';

interface Props {
  modality: ModalityKey;
}

type Mode = 'seed' | 'evolve';

type GridResult = Record<string, SampleItem[]>;

export function QuickTestPage({ modality }: Props) {
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const [versions, setVersions] = useState<ContextVersionSummary[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>(['default']);
  const [mode, setMode] = useState<Mode>('seed');
  const [useGuidance, setUseGuidance] = useState(false);
  const [useParents, setUseParents] = useState(false);
  const [parentsPerSample, setParentsPerSample] = useState(1);
  const [count, setCount] = useState(4);

  const [parentDrawerOpen, setParentDrawerOpen] = useState(false);
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);
  const [parentPool, setParentPool] = useState<ParentItem[]>([]);
  const [promptPool, setPromptPool] = useState<PromptItem[]>([]);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [phase, setPhase] = useState<string>('');
  const [results, setResults] = useState<GridResult>({});
  const [openSampleId, setOpenSampleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sandboxContextsApi
      .list(modality)
      .then((list) => {
        setVersions(list);
        const valid = list.map((v) => v.version);
        setSelectedVersions((prev) => {
          const kept = prev.filter((v) => valid.includes(v));
          return kept.length > 0 ? kept : valid.includes('default') ? ['default'] : valid.slice(0, 1);
        });
      })
      .catch((exc) => setError(exc instanceof Error ? exc.message : 'Failed to load contexts'));
  }, [modality]);

  useEffect(() => {
    sandboxParentsApi.list(modality).then(setParentPool).catch(() => {});
    sandboxPromptsApi.list(modality).then(setPromptPool).catch(() => {});
  }, [modality]);

  const toggleVersion = (v: string) => {
    setSelectedVersions((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  const canRun = useMemo(() => {
    if (running) return false;
    if (selectedVersions.length === 0) return false;
    if (!llmConfig.model) return false;
    if (useGuidance && promptPool.length === 0) return false;
    if (useParents && parentPool.length === 0) return false;
    return true;
  }, [
    running,
    selectedVersions,
    llmConfig.model,
    useGuidance,
    useParents,
    promptPool.length,
    parentPool.length,
  ]);

  const run = async () => {
    if (!canRun) return;
    setApiLLMConfig(llmConfig);
    setRunning(true);
    setError(null);
    setProgress({ completed: 0, total: selectedVersions.length * count });
    setResults(() => {
      const empty: GridResult = {};
      for (const v of selectedVersions) empty[v] = [];
      return empty;
    });
    setPhase('Connecting…');

    try {
      await streamQuickTest(
        {
          modality,
          context_versions: selectedVersions,
          context_profile: llmConfig.contextProfile,
          mode,
          use_guidance: useGuidance,
          use_parents: useParents,
          parents_per_sample: parentsPerSample,
          count,
          provider: llmConfig.provider,
          model: llmConfig.model,
          base_url: llmConfig.baseUrl?.trim() || undefined,
          prompt_pool: promptPool.map((p) => p.text),
          parent_pool: parentPool.map((p) => ({ id: p.id, code: p.code, label: p.label })),
        },
        llmConfig.apiKey,
        {
          onSample: (ev) => {
            const sample = ev.sample;
            const enriched: SampleItem = {
              id: sample.id,
              job_id: null,
              quick_test_session_id: null,
              modality: sample.modality,
              context_version: sample.context_version === 'default' ? null : sample.context_version,
              context_profile: llmConfig.contextProfile,
              mode,
              use_guidance: useGuidance,
              use_parents: useParents,
              provider: sample.provider,
              model: sample.model,
              base_url: llmConfig.baseUrl?.trim() || undefined,
              prompt: sample.prompt,
              prompt_flat: sample.prompt_flat,
              parents_json: sample.parents,
              code: sample.code,
              error: sample.error,
              latency_ms: sample.latency_ms,
              source: sample.source,
              created_at: sample.created_at,
            };
            setResults((prev) => ({
              ...prev,
              [ev.context_version]: [...(prev[ev.context_version] ?? []), enriched],
            }));
            setProgress({ completed: ev.completed, total: ev.total });
            setPhase(`Generating ${ev.completed}/${ev.total}…`);
          },
          onDone: (info) => {
            setPhase(`Done · ${info.completed}/${info.total}`);
          },
          onError: (msg) => {
            setPhase(msg);
          },
        },
      );
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const progressPct =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const cols = Math.max(1, Math.min(selectedVersions.length, 4));

  return (
    <div className="sbx-page">
      <div className="sbx-page-header">
        <div>
          <h1>Quick Test &mdash; {modality}</h1>
          <p className="sbx-subtitle">
            Pick one or more context versions, choose a mode, and generate a small
            comparable batch. Samples are stored in the cache too, so you can find
            them again later.
          </p>
        </div>
        <div className="sbx-row">
          <button
            type="button"
            className="sbx-btn is-primary"
            disabled={!canRun}
            onClick={run}
          >
            {running ? 'Generating…' : 'Run quick test'}
          </button>
        </div>
      </div>

      {error && <div className="sbx-error-banner">{error}</div>}

      <section className="sbx-card">
        <h2>Context versions</h2>
        <div className="sbx-chips">
          {versions.map((v) => (
            <button
              key={v.version}
              type="button"
              className={
                'sbx-chip' + (selectedVersions.includes(v.version) ? ' active' : '')
              }
              onClick={() => toggleVersion(v.version)}
            >
              {selectedVersions.includes(v.version) ? '\u2713 ' : ''}
              {v.version === 'default' ? 'app default' : v.version}
              {v.label ? ` · ${v.label}` : ''}
            </button>
          ))}
        </div>
      </section>

      <section className="sbx-card">
        <h2>Settings</h2>
        <div className="sbx-form-grid">
          <label className="sbx-field">
            <span className="sbx-field-label">Mode</span>
            <div className="sbx-chips">
              <button
                type="button"
                className={'sbx-chip' + (mode === 'seed' ? ' active' : '')}
                onClick={() => {
                  setMode('seed');
                  setUseParents(false);
                }}
              >
                Seed
              </button>
              <button
                type="button"
                className={'sbx-chip' + (mode === 'evolve' ? ' active' : '')}
                onClick={() => setMode('evolve')}
              >
                Evolve
              </button>
            </div>
          </label>
          <label className="sbx-field">
            <span className="sbx-field-label">Samples per version</span>
            <input
              className="sbx-input"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            />
          </label>
          {mode === 'evolve' && (
            <label className="sbx-field">
              <span className="sbx-field-label">Parents per sample</span>
              <input
                className="sbx-input"
                type="number"
                min={1}
                max={4}
                value={parentsPerSample}
                onChange={(e) =>
                  setParentsPerSample(Math.max(1, Math.min(4, Number(e.target.value) || 1)))
                }
              />
            </label>
          )}
        </div>

        <div className="sbx-toggle-strip" style={{ marginTop: '0.6rem' }}>
          <label className="sbx-checkbox">
            <input
              type="checkbox"
              checked={useGuidance}
              onChange={(e) => setUseGuidance(e.target.checked)}
            />
            Use guidance (random pick from prompt library)
          </label>
          <button
            type="button"
            className="sbx-btn is-ghost"
            onClick={() => setPromptDrawerOpen(true)}
          >
            Manage prompts ({promptPool.length})
          </button>
          {mode === 'evolve' && (
            <>
              <label className="sbx-checkbox">
                <input
                  type="checkbox"
                  checked={useParents}
                  onChange={(e) => setUseParents(e.target.checked)}
                />
                Use parents (random pick from parent library)
              </label>
              <button
                type="button"
                className="sbx-btn is-ghost"
                onClick={() => setParentDrawerOpen(true)}
              >
                Manage parents ({parentPool.length})
              </button>
            </>
          )}
        </div>
      </section>

      {(running || progress.completed > 0) && (
        <section className="sbx-card">
          <div className="sbx-progress">
            <div className="sbx-progress-bar">
              <div className="sbx-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="sbx-progress-label">
              {progress.completed}/{Math.max(progress.total, 1)} samples ({progressPct}%)
              {phase ? ` \u2014 ${phase}` : ''}
            </div>
          </div>
        </section>
      )}

      {selectedVersions.length > 0 && (
        <section className="sbx-card">
          <h2>Results</h2>
          <div
            className="sbx-qt-grid"
            style={{ ['--cols' as string]: String(cols) } as React.CSSProperties}
          >
            {selectedVersions.map((v) => {
              const rows = results[v] ?? [];
              return (
                <div key={v} className="sbx-qt-column">
                  <div className="sbx-qt-column-header">
                    <span>{v === 'default' ? 'app default' : v}</span>
                    <span className="sbx-pill">{rows.length}</span>
                  </div>
                  {rows.length === 0 ? (
                    <div className="sbx-empty">No samples yet.</div>
                  ) : (
                    <div className="sbx-sample-grid">
                      {rows.map((sample) => (
                        <SampleCard
                          key={sample.id}
                          sample={{
                            ...sample,
                            versionLabel: v === 'default' ? 'app' : v,
                          }}
                          onOpen={(id) => setOpenSampleId(id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {parentDrawerOpen && (
        <ParentLibraryDrawer
          modality={modality}
          onLibraryChanged={setParentPool}
          onClose={() => setParentDrawerOpen(false)}
        />
      )}
      {promptDrawerOpen && (
        <PromptLibraryDrawer
          modality={modality}
          onLibraryChanged={setPromptPool}
          onClose={() => setPromptDrawerOpen(false)}
        />
      )}

      <SampleDetailModal sampleId={openSampleId} onClose={() => setOpenSampleId(null)} />
    </div>
  );
}
