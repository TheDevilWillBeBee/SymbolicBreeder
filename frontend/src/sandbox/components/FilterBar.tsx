import { useEffect, useState } from 'react';
import {
  type ContextVersionSummary,
  type SampleFilters,
  sandboxContextsApi,
  sandboxSamplesApi,
} from '../api/sandboxClient';

interface Props {
  modality: string;
  value: SampleFilters;
  onChange: (next: SampleFilters) => void;
  onSavePreset?: (label: string) => void;
}

export function FilterBar({ modality, value, onChange, onSavePreset }: Props) {
  const [versions, setVersions] = useState<ContextVersionSummary[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [presetLabel, setPresetLabel] = useState('');

  useEffect(() => {
    sandboxContextsApi.list(modality).then(setVersions).catch(() => {});
    sandboxSamplesApi
      .distinct('model', modality)
      .then((r) => setModels(r.values))
      .catch(() => {});
    sandboxSamplesApi
      .distinct('mode', modality)
      .then((r) => setModes(r.values))
      .catch(() => {});
  }, [modality]);

  const toggleVersion = (v: string) => {
    const cur = value.context_version ?? [];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    onChange({ ...value, context_version: next });
  };

  const toggleMode = (m: string) => {
    const cur = value.mode ?? [];
    const next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
    onChange({ ...value, mode: next });
  };

  const setModel = (m: string) => {
    onChange({ ...value, model: m ? [m] : [] });
  };

  const setDateFrom = (d: string) => {
    onChange({ ...value, date_from: d || undefined });
  };

  const setDateTo = (d: string) => {
    onChange({ ...value, date_to: d || undefined });
  };

  const reset = () => {
    onChange({ modality });
  };

  return (
    <div className="sbx-filter-bar">
      <div className="sbx-filter-grid">
        <label className="sbx-field">
          <span className="sbx-field-label">Free-text search</span>
          <input
            className="sbx-input"
            value={value.search ?? ''}
            onChange={(e) => onChange({ ...value, search: e.target.value || undefined })}
            placeholder="Search code, prompt, model…"
          />
        </label>
        <label className="sbx-field">
          <span className="sbx-field-label">Prompt contains</span>
          <input
            className="sbx-input"
            value={value.prompt_contains ?? ''}
            onChange={(e) =>
              onChange({ ...value, prompt_contains: e.target.value || undefined })
            }
            placeholder="Guidance substring…"
          />
        </label>
        <label className="sbx-field">
          <span className="sbx-field-label">Model</span>
          <select
            className="sbx-select"
            value={value.model?.[0] ?? ''}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="">All</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="sbx-field">
          <span className="sbx-field-label">Date from</span>
          <input
            className="sbx-input"
            type="date"
            value={value.date_from?.slice(0, 10) ?? ''}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label className="sbx-field">
          <span className="sbx-field-label">Date to</span>
          <input
            className="sbx-input"
            type="date"
            value={value.date_to?.slice(0, 10) ?? ''}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
      </div>

      <div>
        <span className="sbx-field-label">Context versions</span>
        <div className="sbx-chips" style={{ marginTop: '0.2rem' }}>
          {versions.map((v) => {
            const cur = value.context_version ?? [];
            return (
              <button
                key={v.version}
                type="button"
                className={'sbx-chip' + (cur.includes(v.version) ? ' active' : '')}
                onClick={() => toggleVersion(v.version)}
              >
                {v.version === 'default' ? 'app' : v.version}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="sbx-field-label">Modes</span>
        <div className="sbx-chips" style={{ marginTop: '0.2rem' }}>
          {(modes.length ? modes : ['seed', 'evolve']).map((m) => {
            const cur = value.mode ?? [];
            return (
              <button
                key={m}
                type="button"
                className={'sbx-chip' + (cur.includes(m) ? ' active' : '')}
                onClick={() => toggleMode(m)}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sbx-toggle-strip">
        <label className="sbx-checkbox">
          <input
            type="checkbox"
            checked={value.use_guidance === true}
            onChange={(e) => onChange({ ...value, use_guidance: e.target.checked ? true : undefined })}
          />
          With guidance only
        </label>
        <label className="sbx-checkbox">
          <input
            type="checkbox"
            checked={value.use_parents === true}
            onChange={(e) => onChange({ ...value, use_parents: e.target.checked ? true : undefined })}
          />
          With parents only
        </label>
      </div>

      <div className="sbx-filter-actions">
        <button type="button" className="sbx-btn is-ghost" onClick={reset}>
          Reset
        </button>
        {onSavePreset && (
          <div className="sbx-row">
            <input
              className="sbx-input"
              value={presetLabel}
              onChange={(e) => setPresetLabel(e.target.value)}
              placeholder="Preset name"
              style={{ width: 140 }}
            />
            <button
              type="button"
              className="sbx-btn"
              disabled={!presetLabel.trim()}
              onClick={() => {
                onSavePreset(presetLabel.trim());
                setPresetLabel('');
              }}
            >
              Save preset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
