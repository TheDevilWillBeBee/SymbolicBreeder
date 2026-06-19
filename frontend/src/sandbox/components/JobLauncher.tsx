import { useEffect, useMemo, useState } from 'react';
import {
  type ContextVersionSummary,
  type JobCreateBody,
  type ModalityKey,
  type ParentItem,
  type PromptItem,
  sandboxContextsApi,
  sandboxJobsApi,
  sandboxParentsApi,
  sandboxPromptsApi,
} from '../api/sandboxClient';
import { useSessionStore } from '../../store/sessionStore';
import {
  ParentLibraryDrawer,
  PromptLibraryDrawer,
} from './LibraryDrawers';

interface Props {
  modality: ModalityKey;
  onJobCreated?: () => void;
}

export function JobLauncher({ modality, onJobCreated }: Props) {
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const [versions, setVersions] = useState<ContextVersionSummary[]>([]);
  const [contextVersion, setContextVersion] = useState<string>('default');
  const [mode, setMode] = useState<'seed' | 'evolve'>('seed');
  const [useGuidance, setUseGuidance] = useState(false);
  const [useParents, setUseParents] = useState(false);
  const [parentsPerSample, setParentsPerSample] = useState(1);
  const [count, setCount] = useState(50);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parentLibrary, setParentLibrary] = useState<ParentItem[]>([]);
  const [promptLibrary, setPromptLibrary] = useState<PromptItem[]>([]);
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set());
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());

  const [parentDrawerOpen, setParentDrawerOpen] = useState(false);
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);

  useEffect(() => {
    sandboxContextsApi.list(modality).then((list) => {
      setVersions(list);
      const present = list.find((v) => v.version === contextVersion);
      if (!present) setContextVersion('default');
    });
    sandboxParentsApi.list(modality).then((list) => {
      setParentLibrary(list);
      setSelectedParents((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((p) => p.id === id)) next.add(id);
        if (next.size === 0) for (const p of list) next.add(p.id); // default to all
        return next;
      });
    });
    sandboxPromptsApi.list(modality).then((list) => {
      setPromptLibrary(list);
      setSelectedPrompts((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((p) => p.id === id)) next.add(id);
        if (next.size === 0) for (const p of list) next.add(p.id);
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modality]);

  const promptPool = useMemo(
    () => promptLibrary.filter((p) => selectedPrompts.has(p.id)).map((p) => p.text),
    [promptLibrary, selectedPrompts],
  );
  const parentPool = useMemo(
    () =>
      parentLibrary
        .filter((p) => selectedParents.has(p.id))
        .map((p) => ({ id: p.id, code: p.code, label: p.label })),
    [parentLibrary, selectedParents],
  );

  const canLaunch =
    !busy &&
    !!llmConfig.model &&
    count > 0 &&
    (!useGuidance || promptPool.length > 0) &&
    (!useParents || parentPool.length > 0);

  const launch = async () => {
    if (!canLaunch) return;
    setBusy(true);
    setError(null);
    try {
      const body: JobCreateBody = {
        label: label.trim() || undefined,
        modality,
        context_version: contextVersion === 'default' ? null : contextVersion,
        context_profile: llmConfig.contextProfile,
        mode,
        use_guidance: useGuidance,
        use_parents: useParents,
        parents_per_sample: parentsPerSample,
        target_count: count,
        provider: llmConfig.provider,
        model: llmConfig.model,
        base_url: llmConfig.baseUrl?.trim() || undefined,
        prompt_pool: promptPool,
        parent_pool: parentPool,
      };
      await sandboxJobsApi.create(body, llmConfig.apiKey);
      onJobCreated?.();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to start job');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="sbx-card">
      <h2>Start a job</h2>

      {error && <div className="sbx-error-banner">{error}</div>}

      <label className="sbx-field">
        <span className="sbx-field-label">Label (optional)</span>
        <input
          className="sbx-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. v3 baseline @ 500"
        />
      </label>

      <label className="sbx-field" style={{ marginTop: '0.4rem' }}>
        <span className="sbx-field-label">Context version</span>
        <select
          className="sbx-select"
          value={contextVersion}
          onChange={(e) => setContextVersion(e.target.value)}
        >
          {versions.map((v) => (
            <option key={v.version} value={v.version}>
              {v.version === 'default' ? 'app default' : v.version}
              {v.label ? ` · ${v.label}` : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="sbx-form-grid" style={{ marginTop: '0.4rem' }}>
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
          <span className="sbx-field-label">Samples</span>
          <input
            className="sbx-input"
            type="number"
            min={1}
            max={5000}
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(5000, Number(e.target.value) || 1)))
            }
          />
        </label>
        {mode === 'evolve' && (
          <label className="sbx-field">
            <span className="sbx-field-label">Parents/sample</span>
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
          Use guidance
        </label>
        <button
          type="button"
          className="sbx-btn is-ghost"
          onClick={() => setPromptDrawerOpen(true)}
        >
          {useGuidance
            ? `${selectedPrompts.size}/${promptLibrary.length} prompts`
            : `Manage prompts (${promptLibrary.length})`}
        </button>
      </div>

      {mode === 'evolve' && (
        <div className="sbx-toggle-strip" style={{ marginTop: '0.4rem' }}>
          <label className="sbx-checkbox">
            <input
              type="checkbox"
              checked={useParents}
              onChange={(e) => setUseParents(e.target.checked)}
            />
            Use parents
          </label>
          <button
            type="button"
            className="sbx-btn is-ghost"
            onClick={() => setParentDrawerOpen(true)}
          >
            {useParents
              ? `${selectedParents.size}/${parentLibrary.length} parents`
              : `Manage parents (${parentLibrary.length})`}
          </button>
        </div>
      )}

      <div className="sbx-confirm-actions">
        <button
          type="button"
          className="sbx-btn is-primary"
          disabled={!canLaunch}
          onClick={launch}
        >
          {busy ? 'Starting…' : `Start job (${count} samples)`}
        </button>
      </div>

      {parentDrawerOpen && (
        <ParentLibraryDrawer
          modality={modality}
          pickerMode
          selectedIds={selectedParents}
          onLibraryChanged={setParentLibrary}
          onConfirmPick={(items) => {
            setSelectedParents(new Set(items.map((i) => i.id)));
            setParentDrawerOpen(false);
          }}
          onClose={() => setParentDrawerOpen(false)}
        />
      )}
      {promptDrawerOpen && (
        <PromptLibraryDrawer
          modality={modality}
          pickerMode
          selectedIds={selectedPrompts}
          onLibraryChanged={setPromptLibrary}
          onConfirmPick={(items) => {
            setSelectedPrompts(new Set(items.map((i) => i.id)));
            setPromptDrawerOpen(false);
          }}
          onClose={() => setPromptDrawerOpen(false)}
        />
      )}
    </section>
  );
}
