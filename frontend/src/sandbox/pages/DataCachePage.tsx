import { useCallback, useEffect, useState } from 'react';
import {
  type ModalityKey,
  type SampleFilters,
  type SamplesStats,
  sandboxSamplesApi,
} from '../api/sandboxClient';
import { useSandboxJobs } from '../hooks/useSandboxJobs';
import { ChartsGrid } from '../components/ChartsGrid';
import { JobLauncher } from '../components/JobLauncher';
import { JobsPanel } from '../components/JobsPanel';

interface Props {
  modality: ModalityKey;
}

export function DataCachePage({ modality }: Props) {
  const { jobs, refresh: refreshJobs } = useSandboxJobs(modality);
  const [stats, setStats] = useState<SamplesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters: SampleFilters = { modality };

  const refreshStats = useCallback(async () => {
    setError(null);
    try {
      const next = await sandboxSamplesApi.stats(filters);
      setStats(next);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modality]);

  useEffect(() => {
    refreshStats();
    const id = setInterval(refreshStats, 6000);
    return () => clearInterval(id);
  }, [refreshStats]);

  const handleJobCreated = () => {
    refreshJobs();
    refreshStats();
  };

  const totalSamples = stats?.total ?? 0;
  const total24h = stats?.total_last_24h ?? 0;
  const total7d = stats?.total_last_7d ?? 0;
  const avgCode = stats ? Math.round(stats.avg_code_length) : 0;
  const avgLatency = stats?.avg_latency_ms ? Math.round(stats.avg_latency_ms) : null;

  return (
    <div className="sbx-page">
      <div className="sbx-page-header">
        <div>
          <h1>Data Cache &mdash; {modality}</h1>
          <p className="sbx-subtitle">
            Launch background jobs to grow the sample cache and watch the charts
            evolve. Every sample is fully annotated (model, context, mode,
            prompt, parents) and queryable from Compare.
          </p>
        </div>
        <div className="sbx-row">
          <button type="button" className="sbx-btn is-ghost" onClick={refreshStats}>
            ⟳ Refresh stats
          </button>
        </div>
      </div>

      {error && <div className="sbx-error-banner">{error}</div>}

      <section className="sbx-kpi-strip">
        <Kpi label="Total cached" value={totalSamples} />
        <Kpi label="Last 24h" value={total24h} />
        <Kpi label="Last 7 days" value={total7d} />
        <Kpi label="Avg code (chars)" value={avgCode} />
        <Kpi
          label="Avg latency"
          value={avgLatency !== null ? `${avgLatency} ms` : '—'}
        />
        <Kpi
          label="Active jobs"
          value={
            jobs.filter((j) => j.status === 'running' || j.status === 'pending').length
          }
        />
      </section>

      <div className="sbx-dc-layout">
        <section className="sbx-card" style={{ minHeight: 280 }}>
          <h2>Charts</h2>
          {loading && !stats ? <div className="sbx-empty">Loading…</div> : <ChartsGrid stats={stats} />}
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <JobLauncher modality={modality} onJobCreated={handleJobCreated} />
          <JobsPanel jobs={jobs} onChanged={refreshJobs} />
        </aside>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="sbx-kpi">
      <div className="sbx-kpi-label">{label}</div>
      <div className="sbx-kpi-value">{value}</div>
    </div>
  );
}
