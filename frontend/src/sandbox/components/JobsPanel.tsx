import { useState } from 'react';
import { type JobItem, sandboxJobsApi } from '../api/sandboxClient';
import { useSessionStore } from '../../store/sessionStore';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  jobs: JobItem[];
  onChanged: () => void;
}

export function JobsPanel({ jobs, onChanged }: Props) {
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const [confirmDelete, setConfirmDelete] = useState<JobItem | null>(null);

  if (jobs.length === 0) {
    return (
      <section className="sbx-card">
        <h2>Jobs</h2>
        <div className="sbx-empty">No jobs yet.</div>
      </section>
    );
  }

  return (
    <section className="sbx-card">
      <h2>Jobs ({jobs.length})</h2>
      <div className="sbx-jobs-panel">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onCancel={async () => {
              await sandboxJobsApi.cancel(job.id);
              onChanged();
            }}
            onRetry={async () => {
              await sandboxJobsApi.retry(job.id, llmConfig.apiKey);
              onChanged();
            }}
            onDelete={() => setConfirmDelete(job)}
          />
        ))}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete job?"
          body={
            <>
              Job <code>{confirmDelete.id.slice(0, 8)}</code> will be removed from
              this list. The samples it already produced remain in the cache.
              {(confirmDelete.status === 'running' || confirmDelete.status === 'pending') && (
                <>
                  <br />
                  <br />
                  The job is still active and will be cancelled first.
                </>
              )}
            </>
          }
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await sandboxJobsApi.remove(confirmDelete.id);
            setConfirmDelete(null);
            onChanged();
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </section>
  );
}

function JobCard({
  job,
  onCancel,
  onRetry,
  onDelete,
}: {
  job: JobItem;
  onCancel: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const pct =
    job.target_count > 0
      ? Math.round((job.completed_count / job.target_count) * 100)
      : 0;

  return (
    <div className={`sbx-job-card is-${job.status}`}>
      <div className="sbx-row" style={{ justifyContent: 'space-between' }}>
        <div className="sbx-job-status">
          <span className={`sbx-job-status-dot ${job.status}`} />
          {job.status}
        </div>
        <span className="sbx-job-meta">{new Date(job.created_at).toLocaleString()}</span>
      </div>
      <div style={{ fontWeight: 600 }}>
        {job.label ?? `${job.modality} · ${job.context_version ?? 'default'} · ${job.mode}`}
      </div>
      <div className="sbx-job-meta">
        {job.modality} · {job.context_version ?? 'default'} · {job.mode} ·{' '}
        {job.model}
      </div>
      <div className="sbx-progress">
        <div className="sbx-progress-bar">
          <div className="sbx-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="sbx-progress-label">
          {job.completed_count}/{job.target_count} ({pct}%)
          {job.failed_count > 0 ? ` · ${job.failed_count} failed` : ''}
        </div>
      </div>
      {job.error_message && (
        <div className="sbx-error-banner" style={{ fontSize: '0.78rem' }}>
          {job.error_message}
        </div>
      )}
      <div className="sbx-job-actions">
        {(job.status === 'running' || job.status === 'pending') && (
          <button type="button" className="sbx-btn is-danger" onClick={onCancel}>
            Cancel
          </button>
        )}
        {(job.status === 'failed' ||
          job.status === 'cancelled' ||
          job.status === 'interrupted' ||
          job.status === 'done') && (
          <button type="button" className="sbx-btn" onClick={onRetry}>
            Retry
          </button>
        )}
        {job.status !== 'running' && job.status !== 'pending' && (
          <button type="button" className="sbx-btn is-ghost" onClick={onDelete}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
