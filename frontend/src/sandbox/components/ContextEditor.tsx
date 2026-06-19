import { useEffect, useMemo, useState } from 'react';
import yaml from 'js-yaml';
import {
  type ContextManifest,
  type ContextVersionDetail,
  type PromptBundle,
  type SourceFile,
  sandboxContextsApi,
} from '../api/sandboxClient';
import { CodeEditor } from './CodeEditor';

type EditorTab = 'manifest' | 'prompts' | 'sources' | 'raw';

interface Props {
  modality: string;
  version: string;
  /** Notifies the parent the version's metadata changed (file count etc.). */
  onSaved?: () => void;
}

interface DraftState {
  manifest: ContextManifest;
  promptBundle: PromptBundle;
  sources: SourceFile[];
  dirty: {
    manifest: boolean;
    prompts: boolean;
    sources: Set<string>;
  };
}

export function ContextEditor({ modality, version, onSaved }: Props) {
  const [detail, setDetail] = useState<ContextVersionDetail | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [tab, setTab] = useState<EditorTab>('manifest');
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState<{ manifest: boolean; prompts: boolean }>({
    manifest: false,
    prompts: false,
  });

  useEffect(() => {
    setError(null);
    setDetail(null);
    setDraft(null);
    setActiveSource(null);
    sandboxContextsApi
      .get(modality, version)
      .then((d) => {
        setDetail(d);
        setDraft({
          manifest: d.manifest,
          promptBundle: d.prompt_bundle,
          sources: d.sources,
          dirty: { manifest: false, prompts: false, sources: new Set() },
        });
        setActiveSource(d.sources[0]?.id ?? null);
      })
      .catch((exc) =>
        setError(exc instanceof Error ? exc.message : 'Failed to load context'),
      );
  }, [modality, version]);

  const readOnly = detail?.is_app_default ?? false;

  const markManifestDirty = () =>
    setDraft((d) =>
      d ? { ...d, dirty: { ...d.dirty, manifest: true } } : d,
    );
  const markPromptsDirty = () =>
    setDraft((d) =>
      d ? { ...d, dirty: { ...d.dirty, prompts: true } } : d,
    );
  const markSourceDirty = (id: string) =>
    setDraft((d) => {
      if (!d) return d;
      const next = new Set(d.dirty.sources);
      next.add(id);
      return { ...d, dirty: { ...d.dirty, sources: next } };
    });

  const onManifestChange = (updater: (m: ContextManifest) => ContextManifest) => {
    setDraft((d) => {
      if (!d) return d;
      const next = updater(d.manifest);
      return { ...d, manifest: next };
    });
    markManifestDirty();
  };

  const onPromptBundleChange = (
    updater: (b: PromptBundle) => PromptBundle,
  ) => {
    setDraft((d) => {
      if (!d) return d;
      const next = updater(d.promptBundle);
      return { ...d, promptBundle: next };
    });
    markPromptsDirty();
  };

  const onSourceChange = (id: string, updater: (s: SourceFile) => SourceFile) => {
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        sources: d.sources.map((s) => (s.id === id ? updater(s) : s)),
      };
    });
    markSourceDirty(id);
  };

  const saveManifest = async () => {
    if (!draft || readOnly) return;
    setError(null);
    setSaving('manifest');
    try {
      // If advanced raw_yaml is provided, validate it
      if (advanced.manifest && draft.manifest.raw_yaml) {
        try {
          yaml.load(draft.manifest.raw_yaml);
        } catch (exc) {
          throw new Error('Invalid manifest YAML: ' + (exc as Error).message);
        }
      }
      const payload = { ...draft.manifest };
      if (!advanced.manifest) payload.raw_yaml = null;
      const next = await sandboxContextsApi.update(modality, version, {
        manifest: payload,
      });
      setDetail(next);
      setDraft({
        manifest: next.manifest,
        promptBundle: next.prompt_bundle,
        sources: next.sources,
        dirty: { manifest: false, prompts: draft.dirty.prompts, sources: draft.dirty.sources },
      });
      onSaved?.();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  const savePrompts = async () => {
    if (!draft || readOnly) return;
    setError(null);
    setSaving('prompts');
    try {
      if (advanced.prompts && draft.promptBundle.raw_yaml) {
        try {
          yaml.load(draft.promptBundle.raw_yaml);
        } catch (exc) {
          throw new Error('Invalid prompt_bundle YAML: ' + (exc as Error).message);
        }
      }
      const payload = { ...draft.promptBundle };
      if (!advanced.prompts) payload.raw_yaml = null;
      const next = await sandboxContextsApi.update(modality, version, {
        prompt_bundle: payload,
      });
      setDetail(next);
      setDraft((d) =>
        d
          ? {
              ...d,
              promptBundle: next.prompt_bundle,
              dirty: { ...d.dirty, prompts: false },
            }
          : d,
      );
      onSaved?.();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  const saveSource = async (id: string) => {
    if (!draft || readOnly) return;
    const src = draft.sources.find((s) => s.id === id);
    if (!src) return;
    setError(null);
    setSaving(id);
    try {
      const next = await sandboxContextsApi.update(modality, version, {
        sources: [src],
      });
      setDetail(next);
      setDraft((d) => {
        if (!d) return d;
        const dropped = new Set(d.dirty.sources);
        dropped.delete(id);
        return {
          ...d,
          sources: next.sources,
          dirty: { ...d.dirty, sources: dropped },
        };
      });
      onSaved?.();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  const dirtyTabs = useMemo(() => {
    if (!draft) return { manifest: false, prompts: false, sources: false };
    return {
      manifest: draft.dirty.manifest,
      prompts: draft.dirty.prompts,
      sources: draft.dirty.sources.size > 0,
    };
  }, [draft]);

  if (error) {
    return <div className="sbx-error-banner">{error}</div>;
  }
  if (!detail || !draft) {
    return <div className="sbx-empty">Loading context…</div>;
  }

  return (
    <div className="sbx-ctx-editor">
      <div className="sbx-card-toolbar">
        <strong>
          {detail.modality}/{detail.version}
        </strong>
        {readOnly && (
          <span className="sbx-pill is-default" title="App default — read-only">
            read-only
          </span>
        )}
        {detail.manifest && (
          <span className="sbx-pill" title="Default profile">
            profile: {detail.manifest.default_profile}
          </span>
        )}
      </div>

      <div className="sbx-ctx-editor-tabs">
        <EditorTabBtn id="manifest" label="Manifest" tab={tab} setTab={setTab} dirty={dirtyTabs.manifest} />
        <EditorTabBtn id="prompts" label="Prompt bundle" tab={tab} setTab={setTab} dirty={dirtyTabs.prompts} />
        <EditorTabBtn id="sources" label="Sources" tab={tab} setTab={setTab} dirty={dirtyTabs.sources} />
        <EditorTabBtn id="raw" label="Raw YAML" tab={tab} setTab={setTab} />
      </div>

      {tab === 'manifest' && (
        <ManifestPane
          manifest={draft.manifest}
          onChange={onManifestChange}
          advanced={advanced.manifest}
          onAdvancedChange={(v) => setAdvanced((a) => ({ ...a, manifest: v }))}
          readOnly={readOnly}
          dirty={dirtyTabs.manifest}
          saving={saving === 'manifest'}
          onSave={saveManifest}
        />
      )}

      {tab === 'prompts' && (
        <PromptsPane
          bundle={draft.promptBundle}
          onChange={onPromptBundleChange}
          advanced={advanced.prompts}
          onAdvancedChange={(v) => setAdvanced((a) => ({ ...a, prompts: v }))}
          readOnly={readOnly}
          dirty={dirtyTabs.prompts}
          saving={saving === 'prompts'}
          onSave={savePrompts}
        />
      )}

      {tab === 'sources' && (
        <SourcesPane
          sources={draft.sources}
          activeId={activeSource}
          setActiveId={setActiveSource}
          onChange={onSourceChange}
          dirtySources={draft.dirty.sources}
          savingId={saving}
          onSave={saveSource}
          readOnly={readOnly}
        />
      )}

      {tab === 'raw' && (
        <RawYamlPane manifest={draft.manifest} bundle={draft.promptBundle} />
      )}
    </div>
  );
}

function EditorTabBtn({
  id,
  label,
  tab,
  setTab,
  dirty,
}: {
  id: EditorTab;
  label: string;
  tab: EditorTab;
  setTab: (t: EditorTab) => void;
  dirty?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        'sbx-ctx-editor-tab' + (tab === id ? ' active' : '') + (dirty ? ' dirty' : '')
      }
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );
}

// ── Manifest pane ───────────────────────────────────────────────────────

function ManifestPane({
  manifest,
  onChange,
  advanced,
  onAdvancedChange,
  readOnly,
  dirty,
  saving,
  onSave,
}: {
  manifest: ContextManifest;
  onChange: (updater: (m: ContextManifest) => ContextManifest) => void;
  advanced: boolean;
  onAdvancedChange: (v: boolean) => void;
  readOnly: boolean;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div className="sbx-card-toolbar" style={{ justifyContent: 'space-between' }}>
        <label className="sbx-checkbox">
          <input
            type="checkbox"
            checked={advanced}
            onChange={(e) => onAdvancedChange(e.target.checked)}
          />
          Advanced (raw YAML)
        </label>
        <div className="sbx-row">
          {dirty && <span className="sbx-pill">unsaved changes</span>}
          <button
            type="button"
            className="sbx-btn is-primary"
            disabled={readOnly || !dirty || saving}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save manifest'}
          </button>
        </div>
      </div>

      {advanced ? (
        <CodeEditor
          value={manifest.raw_yaml ?? ''}
          onChange={(v) => onChange((m) => ({ ...m, raw_yaml: v }))}
          language="yaml"
          placeholder="# raw manifest.yaml"
        />
      ) : (
        <ManifestForm manifest={manifest} onChange={onChange} readOnly={readOnly} />
      )}
    </div>
  );
}

function ManifestForm({
  manifest,
  onChange,
  readOnly,
}: {
  manifest: ContextManifest;
  onChange: (updater: (m: ContextManifest) => ContextManifest) => void;
  readOnly: boolean;
}) {
  const profiles = Object.entries(manifest.profiles ?? {});
  const sources = Array.isArray(manifest.sources) ? manifest.sources : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div className="sbx-form-grid">
        <Field label="Modality">
          <input
            className="sbx-input"
            value={manifest.modality}
            disabled
            readOnly
          />
        </Field>
        <Field label="Schema version">
          <input
            className="sbx-input"
            type="number"
            value={manifest.version}
            disabled={readOnly}
            onChange={(e) =>
              onChange((m) => ({ ...m, version: Number(e.target.value) || 1 }))
            }
          />
        </Field>
        <Field label="Default profile">
          <input
            className="sbx-input"
            value={manifest.default_profile}
            disabled={readOnly}
            onChange={(e) =>
              onChange((m) => ({ ...m, default_profile: e.target.value }))
            }
          />
        </Field>
      </div>

      <div>
        <h3>Profiles</h3>
        <div className="sbx-form-grid">
          {profiles.length === 0 && <div className="sbx-empty">No profiles defined.</div>}
          {profiles.map(([name, def]) => {
            const includes = ((def as Record<string, unknown>).includes as string[]) ?? [];
            const description = ((def as Record<string, unknown>).description as string) ?? '';
            const extendsField = ((def as Record<string, unknown>).extends as string | undefined) ?? '';
            return (
              <div key={name} className="sbx-profile-card">
                <strong>{name}</strong>
                <Field label="Description">
                  <input
                    className="sbx-input"
                    value={description}
                    disabled={readOnly}
                    onChange={(e) =>
                      onChange((m) => ({
                        ...m,
                        profiles: {
                          ...(m.profiles ?? {}),
                          [name]: {
                            ...((m.profiles ?? {})[name] ?? {}),
                            description: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="Extends">
                  <input
                    className="sbx-input"
                    value={extendsField}
                    disabled={readOnly}
                    onChange={(e) =>
                      onChange((m) => ({
                        ...m,
                        profiles: {
                          ...(m.profiles ?? {}),
                          [name]: {
                            ...((m.profiles ?? {})[name] ?? {}),
                            extends: e.target.value || undefined,
                          },
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="Includes (source ids, comma-separated)">
                  <input
                    className="sbx-input"
                    value={includes.join(', ')}
                    disabled={readOnly}
                    onChange={(e) =>
                      onChange((m) => ({
                        ...m,
                        profiles: {
                          ...(m.profiles ?? {}),
                          [name]: {
                            ...((m.profiles ?? {})[name] ?? {}),
                            includes: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3>Sources ({sources.length})</h3>
        <p className="sbx-subtitle" style={{ margin: '0 0 0.4rem' }}>
          Source ids are referenced by profile <code>includes</code> lists. Use the
          “Sources” tab to edit the actual Markdown content.
        </p>
        <div className="sbx-form-grid">
          {sources.map((s, idx) => {
            const src = s as Record<string, unknown>;
            return (
              <div key={(src.id as string) ?? idx} className="sbx-source-form-card">
                <Field label="ID">
                  <input
                    className="sbx-input"
                    value={(src.id as string) ?? ''}
                    disabled={readOnly}
                    onChange={(e) =>
                      onChange((m) => updateSource(m, idx, 'id', e.target.value))
                    }
                  />
                </Field>
                <Field label="Path">
                  <input
                    className="sbx-input"
                    value={(src.path as string) ?? ''}
                    disabled={readOnly}
                    onChange={(e) =>
                      onChange((m) => updateSource(m, idx, 'path', e.target.value))
                    }
                  />
                </Field>
                <Field label="Description">
                  <input
                    className="sbx-input"
                    value={(src.description as string) ?? ''}
                    disabled={readOnly}
                    onChange={(e) =>
                      onChange((m) =>
                        updateSource(m, idx, 'description', e.target.value),
                      )
                    }
                  />
                </Field>
                <div className="sbx-row">
                  <label className="sbx-checkbox">
                    <input
                      type="checkbox"
                      checked={(src.enabled as boolean | undefined) ?? true}
                      disabled={readOnly}
                      onChange={(e) =>
                        onChange((m) => updateSource(m, idx, 'enabled', e.target.checked))
                      }
                    />
                    enabled
                  </label>
                  <span className="sbx-pill">
                    inject_into:{' '}
                    {Array.isArray(src.inject_into)
                      ? (src.inject_into as string[]).join(', ') || '—'
                      : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function updateSource(
  m: ContextManifest,
  idx: number,
  key: string,
  value: unknown,
): ContextManifest {
  const sources = Array.isArray(m.sources) ? [...m.sources] : [];
  if (!sources[idx]) sources[idx] = {};
  sources[idx] = { ...(sources[idx] as Record<string, unknown>), [key]: value };
  return { ...m, sources };
}

// ── Prompt bundle pane ──────────────────────────────────────────────────

function PromptsPane({
  bundle,
  onChange,
  advanced,
  onAdvancedChange,
  readOnly,
  dirty,
  saving,
  onSave,
}: {
  bundle: PromptBundle;
  onChange: (updater: (b: PromptBundle) => PromptBundle) => void;
  advanced: boolean;
  onAdvancedChange: (v: boolean) => void;
  readOnly: boolean;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div className="sbx-card-toolbar" style={{ justifyContent: 'space-between' }}>
        <label className="sbx-checkbox">
          <input
            type="checkbox"
            checked={advanced}
            onChange={(e) => onAdvancedChange(e.target.checked)}
          />
          Advanced (raw YAML)
        </label>
        <div className="sbx-row">
          {dirty && <span className="sbx-pill">unsaved changes</span>}
          <button
            type="button"
            className="sbx-btn is-primary"
            disabled={readOnly || !dirty || saving}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save prompts'}
          </button>
        </div>
      </div>

      {advanced ? (
        <CodeEditor
          value={bundle.raw_yaml ?? ''}
          onChange={(v) => onChange((b) => ({ ...b, raw_yaml: v }))}
          language="yaml"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <Field label="Role (system prompt prefix)">
            <textarea
              className="sbx-textarea"
              value={bundle.role}
              disabled={readOnly}
              rows={6}
              onChange={(e) => onChange((b) => ({ ...b, role: e.target.value }))}
            />
          </Field>
          <Field label="Seed prompt (uses {n})">
            <textarea
              className="sbx-textarea"
              value={bundle.seed_prompt}
              disabled={readOnly}
              rows={5}
              onChange={(e) => onChange((b) => ({ ...b, seed_prompt: e.target.value }))}
            />
          </Field>
          <Field label="Evolve prompt (uses {n})">
            <textarea
              className="sbx-textarea"
              value={bundle.evolve_prompt}
              disabled={readOnly}
              rows={5}
              onChange={(e) =>
                onChange((b) => ({ ...b, evolve_prompt: e.target.value }))
              }
            />
          </Field>
          <Field label="Variety suffix (optional, uses {n})">
            <textarea
              className="sbx-textarea"
              value={bundle.variety_suffix}
              disabled={readOnly}
              rows={4}
              onChange={(e) =>
                onChange((b) => ({ ...b, variety_suffix: e.target.value }))
              }
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ── Sources pane ────────────────────────────────────────────────────────

function SourcesPane({
  sources,
  activeId,
  setActiveId,
  onChange,
  dirtySources,
  savingId,
  onSave,
  readOnly,
}: {
  sources: SourceFile[];
  activeId: string | null;
  setActiveId: (id: string) => void;
  onChange: (id: string, updater: (s: SourceFile) => SourceFile) => void;
  dirtySources: Set<string>;
  savingId: string | null;
  onSave: (id: string) => void;
  readOnly: boolean;
}) {
  const active = sources.find((s) => s.id === activeId) ?? sources[0] ?? null;

  if (!active) {
    return <div className="sbx-empty">No source files defined.</div>;
  }

  return (
    <div className="sbx-source-list">
      <div className="sbx-source-rows">
        {sources.map((s) => (
          <button
            key={s.id}
            type="button"
            className={
              'sbx-source-row' + (active && s.id === active.id ? ' active' : '')
            }
            onClick={() => setActiveId(s.id)}
          >
            <div className="sbx-source-row-title">
              <span>{s.id}</span>
              {dirtySources.has(s.id) && <span className="sbx-pill">dirty</span>}
            </div>
            <span className="sbx-source-row-path">{s.path}</span>
          </button>
        ))}
      </div>
      <div className="sbx-source-editor">
        <div className="sbx-card-toolbar" style={{ justifyContent: 'space-between' }}>
          <div className="sbx-row">
            <strong>{active.id}</strong>
            <span className="sbx-pill">{active.path}</span>
          </div>
          <button
            type="button"
            className="sbx-btn is-primary"
            disabled={readOnly || !dirtySources.has(active.id) || savingId === active.id}
            onClick={() => onSave(active.id)}
          >
            {savingId === active.id ? 'Saving…' : 'Save file'}
          </button>
        </div>
        {active.description && (
          <p className="sbx-subtitle" style={{ margin: 0 }}>
            {active.description}
          </p>
        )}
        <CodeEditor
          className="sbx-md-textarea"
          value={active.text}
          onChange={(v) => onChange(active.id, (s) => ({ ...s, text: v }))}
          language="markdown"
        />
      </div>
    </div>
  );
}

// ── Raw YAML preview pane (read-only render of merged manifest + prompts) ──

function RawYamlPane({
  manifest,
  bundle,
}: {
  manifest: ContextManifest;
  bundle: PromptBundle;
}) {
  const manifestYaml = manifest.raw_yaml ?? safeDump(manifest);
  const bundleYaml = bundle.raw_yaml ?? safeDump({
    role: bundle.role,
    seed_prompt: bundle.seed_prompt,
    evolve_prompt: bundle.evolve_prompt,
    variety_suffix: bundle.variety_suffix,
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div>
        <h3>manifest.yaml</h3>
        <CodeEditor value={manifestYaml} onChange={() => {}} language="yaml" />
      </div>
      <div>
        <h3>prompts/prompt_bundle.yaml</h3>
        <CodeEditor value={bundleYaml} onChange={() => {}} language="yaml" />
      </div>
      <p className="sbx-subtitle">
        Raw view is read-only here. Use the “Advanced (raw YAML)” toggle inside
        Manifest or Prompt bundle tabs to edit YAML directly.
      </p>
    </div>
  );
}

function safeDump(value: unknown): string {
  try {
    return yaml.dump(value, { sortKeys: false, lineWidth: 100 });
  } catch {
    return JSON.stringify(value, null, 2);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="sbx-field">
      <span className="sbx-field-label">{label}</span>
      {children}
    </label>
  );
}
