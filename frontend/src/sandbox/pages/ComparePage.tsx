import { useEffect, useMemo, useState } from 'react';
import {
  type ModalityKey,
  type SampleFilters,
  type SampleListResponse,
  type SamplesStats,
  sandboxSamplesApi,
} from '../api/sandboxClient';
import { FilterBar } from '../components/FilterBar';
import { SampleCard } from '../components/SampleCard';
import { SampleDetailModal } from '../components/SampleDetailModal';
import { useSandboxSamples } from '../hooks/useSandboxSamples';

interface Props {
  modality: ModalityKey;
}

interface Preset {
  label: string;
  filters: SampleFilters;
}

const PRESETS_LSKEY_PREFIX = 'sbx-presets:v1';

function loadPresets(modality: string): Preset[] {
  try {
    const raw = localStorage.getItem(`${PRESETS_LSKEY_PREFIX}:${modality}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function savePresets(modality: string, presets: Preset[]) {
  localStorage.setItem(`${PRESETS_LSKEY_PREFIX}:${modality}`, JSON.stringify(presets));
}

export function ComparePage({ modality }: Props) {
  const [filtersA, setFiltersA] = useState<SampleFilters>({ modality, per_page: 18 });
  const [filtersB, setFiltersB] = useState<SampleFilters>({ modality, per_page: 18 });
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets(modality));
  const [openSampleId, setOpenSampleId] = useState<string | null>(null);

  // Ensure modality is always present
  useEffect(() => {
    setFiltersA((f) => ({ ...f, modality, page: 1 }));
    setFiltersB((f) => ({ ...f, modality, page: 1 }));
    setPresets(loadPresets(modality));
  }, [modality]);

  const saveAsPreset = (which: 'A' | 'B', label: string) => {
    const current = which === 'A' ? filtersA : filtersB;
    const next = [...presets.filter((p) => p.label !== label), { label, filters: { ...current } }];
    setPresets(next);
    savePresets(modality, next);
  };

  const removePreset = (label: string) => {
    const next = presets.filter((p) => p.label !== label);
    setPresets(next);
    savePresets(modality, next);
  };

  return (
    <div className="sbx-page">
      <div className="sbx-page-header">
        <div>
          <h1>Compare &mdash; {modality}</h1>
          <p className="sbx-subtitle">
            Filter two slices of the cache side-by-side. Cards are interactive —
            click any card to inspect code, prompt, parents, and metadata.
          </p>
        </div>
      </div>

      {presets.length > 0 && (
        <section className="sbx-card">
          <h2>Presets</h2>
          <div className="sbx-preset-row">
            {presets.map((p) => (
              <span key={p.label} className="sbx-preset-chip" title="Click to apply to both sides">
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setFiltersA({ ...p.filters, modality, per_page: 18, page: 1 });
                  }}
                  title="Apply to left"
                >
                  ◀ {p.label}
                </span>
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setFiltersB({ ...p.filters, modality, per_page: 18, page: 1 });
                  }}
                  title="Apply to right"
                >
                  ▶
                </span>
                <button
                  type="button"
                  className="sbx-preset-chip-x"
                  onClick={() => removePreset(p.label)}
                  title="Remove preset"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="sbx-compare-layout">
        <CompareColumn
          title="Left"
          modality={modality}
          filters={filtersA}
          onChange={setFiltersA}
          onSavePreset={(label) => saveAsPreset('A', label)}
          onOpenSample={setOpenSampleId}
        />
        <CompareColumn
          title="Right"
          modality={modality}
          filters={filtersB}
          onChange={setFiltersB}
          onSavePreset={(label) => saveAsPreset('B', label)}
          onOpenSample={setOpenSampleId}
        />
      </div>

      <SampleDetailModal sampleId={openSampleId} onClose={() => setOpenSampleId(null)} />
    </div>
  );
}

function CompareColumn({
  title,
  modality,
  filters,
  onChange,
  onSavePreset,
  onOpenSample,
}: {
  title: string;
  modality: string;
  filters: SampleFilters;
  onChange: (next: SampleFilters) => void;
  onSavePreset: (label: string) => void;
  onOpenSample: (id: string) => void;
}) {
  const { data, loading } = useSandboxSamples(filters);
  const [stats, setStats] = useState<SamplesStats | null>(null);

  // Compute server-side stats for this filter set
  useEffect(() => {
    sandboxSamplesApi
      .stats({
        modality: filters.modality,
        context_version: filters.context_version,
        mode: filters.mode,
        model: filters.model,
        provider: filters.provider,
        use_guidance: filters.use_guidance,
        use_parents: filters.use_parents,
        date_from: filters.date_from,
        date_to: filters.date_to,
      })
      .then(setStats)
      .catch(() => setStats(null));
  }, [
    filters.modality,
    JSON.stringify(filters.context_version),
    JSON.stringify(filters.mode),
    JSON.stringify(filters.model),
    JSON.stringify(filters.provider),
    filters.use_guidance,
    filters.use_parents,
    filters.date_from,
    filters.date_to,
  ]);

  const page = filters.page ?? 1;
  const totalPages = useMemo(() => {
    if (data.total === 0 || data.per_page === 0) return 1;
    return Math.max(1, Math.ceil(data.total / data.per_page));
  }, [data]);

  return (
    <div className="sbx-compare-col">
      <div className="sbx-compare-col-header">
        <div>
          <h2>{title}</h2>
          {stats && (
            <div className="sbx-compare-counts">
              {stats.total} total · {stats.total_last_24h} last 24h · avg{' '}
              {Math.round(stats.avg_code_length)} chars
              {stats.avg_latency_ms ? ` · ${Math.round(stats.avg_latency_ms)} ms` : ''}
            </div>
          )}
        </div>
      </div>

      <FilterBar
        modality={modality}
        value={filters}
        onChange={onChange}
        onSavePreset={onSavePreset}
      />

      <div className="sbx-card">
        <div className="sbx-card-toolbar" style={{ justifyContent: 'space-between' }}>
          <strong>
            {data.total} sample{data.total === 1 ? '' : 's'}
          </strong>
          <div className="sbx-pagination">
            <button
              type="button"
              className="sbx-btn is-ghost"
              disabled={page <= 1}
              onClick={() => onChange({ ...filters, page: page - 1 })}
            >
              ‹ Prev
            </button>
            <span>
              page {page} / {totalPages}
            </span>
            <button
              type="button"
              className="sbx-btn is-ghost"
              disabled={page >= totalPages}
              onClick={() => onChange({ ...filters, page: page + 1 })}
            >
              Next ›
            </button>
          </div>
        </div>
        {loading && data.items.length === 0 ? (
          <div className="sbx-empty">Loading…</div>
        ) : data.items.length === 0 ? (
          <div className="sbx-empty">No samples match these filters.</div>
        ) : (
          <SamplesGrid items={data} onOpen={onOpenSample} />
        )}
      </div>
    </div>
  );
}

function SamplesGrid({
  items,
  onOpen,
}: {
  items: SampleListResponse;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="sbx-sample-grid sbx-sample-grid--wide">
      {items.items.map((s) => (
        <SampleCard
          key={s.id}
          sample={{
            id: s.id,
            modality: s.modality,
            code: s.code,
            context_version: s.context_version,
            model: s.model,
            source: s.source,
            error: s.error,
            versionLabel: s.context_version ?? 'app',
          }}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
