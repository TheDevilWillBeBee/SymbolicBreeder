import { useEffect, useState } from 'react';
import { GalleryCard } from '../../components/GalleryCard';
import { Modal } from '../../components/Modal';
import type { SampleItem } from '../api/sandboxClient';
import type { SharedProgram } from '../../types';
import { sandboxSamplesApi } from '../api/sandboxClient';

type Tab = 'preview' | 'code' | 'prompt' | 'parents' | 'meta';

interface Props {
  sampleId: string | null;
  onClose: () => void;
}

export function SampleDetailModal({ sampleId, onClose }: Props) {
  const [sample, setSample] = useState<SampleItem | null>(null);
  const [tab, setTab] = useState<Tab>('preview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sampleId) {
      setSample(null);
      setError(null);
      return;
    }
    setSample(null);
    setError(null);
    sandboxSamplesApi
      .get(sampleId)
      .then(setSample)
      .catch((exc) =>
        setError(exc instanceof Error ? exc.message : 'Failed to load sample'),
      );
  }, [sampleId]);

  if (!sampleId) return null;

  return (
    <Modal onClose={onClose} contentClassName="sbx-sample-modal">
      <div className="sbx-sample-modal-header">
        <div>
          <strong>Sample</strong>
          {sample && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              {sample.modality} · {sample.context_version ?? 'default'} · {sample.model}
            </span>
          )}
        </div>
        <button type="button" className="sbx-btn is-ghost" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="sbx-sample-modal-tabs">
        <Tab id="preview" label="Preview" current={tab} setTab={setTab} />
        <Tab id="code" label="Code" current={tab} setTab={setTab} />
        <Tab id="prompt" label="Prompt" current={tab} setTab={setTab} />
        <Tab id="parents" label="Parents" current={tab} setTab={setTab} />
        <Tab id="meta" label="Meta" current={tab} setTab={setTab} />
      </div>
      <div className="sbx-sample-modal-body">
        {error && <div className="sbx-error-banner">{error}</div>}
        {!sample && !error && <div className="sbx-empty">Loading…</div>}
        {sample && (
          <>
            {tab === 'preview' && <PreviewPane sample={sample} />}
            {tab === 'code' && (
              <pre className="sbx-sample-modal-code">{sample.code || '(empty)'}</pre>
            )}
            {tab === 'prompt' && (
              <>
                {sample.prompt && (
                  <div style={{ marginBottom: '0.7rem' }}>
                    <h3>Guidance</h3>
                    <pre className="sbx-sample-modal-code">{sample.prompt}</pre>
                  </div>
                )}
                <h3>Flattened prompt</h3>
                <pre className="sbx-sample-modal-code">
                  {sample.prompt_flat || '(no prompt captured)'}
                </pre>
              </>
            )}
            {tab === 'parents' && <ParentsPane sample={sample} />}
            {tab === 'meta' && <MetaPane sample={sample} />}
          </>
        )}
      </div>
    </Modal>
  );
}

function Tab({
  id,
  label,
  current,
  setTab,
}: {
  id: Tab;
  label: string;
  current: Tab;
  setTab: (t: Tab) => void;
}) {
  return (
    <button
      type="button"
      className={'sbx-sample-modal-tab' + (current === id ? ' active' : '')}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );
}

function PreviewPane({ sample }: { sample: SampleItem }) {
  const fakeShared: SharedProgram = {
    id: `sandbox-sample-${sample.id}`,
    programId: sample.id,
    sharerName: `Sample ${sample.id.slice(0, 6)}`,
    modality: sample.modality,
    code: sample.code,
    lineage: [
      {
        id: sample.id,
        code: sample.code,
        modality: sample.modality,
        generation: 0,
        parentIds: [],
        guidance: sample.prompt ?? '',
        llmModel: sample.model,
        contextProfile: sample.context_profile,
      },
    ],
    llmModel: sample.model,
    createdAt: sample.created_at,
  };
  return (
    <div className="sbx-sample-modal-preview">
      <GalleryCard program={fakeShared} previewOnly />
    </div>
  );
}

function ParentsPane({ sample }: { sample: SampleItem }) {
  const parents = sample.parents_json ?? [];
  if (!parents.length) {
    return <div className="sbx-empty">No parents — this is a seed sample.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {parents.map((p, idx) => {
        const code = (p as Record<string, unknown>).code as string | undefined;
        const label = (p as Record<string, unknown>).label as string | undefined;
        return (
          <div key={idx}>
            <h3>{label ? label : `Parent ${idx + 1}`}</h3>
            <pre className="sbx-sample-modal-code">{code ?? ''}</pre>
          </div>
        );
      })}
    </div>
  );
}

function MetaPane({ sample }: { sample: SampleItem }) {
  return (
    <dl className="sbx-sample-modal-meta">
      <dt>ID</dt>
      <dd>{sample.id}</dd>
      <dt>Created</dt>
      <dd>{new Date(sample.created_at).toLocaleString()}</dd>
      <dt>Modality</dt>
      <dd>{sample.modality}</dd>
      <dt>Context version</dt>
      <dd>{sample.context_version ?? 'default'}</dd>
      <dt>Profile</dt>
      <dd>{sample.context_profile}</dd>
      <dt>Mode</dt>
      <dd>{sample.mode}</dd>
      <dt>Use guidance</dt>
      <dd>{sample.use_guidance ? 'yes' : 'no'}</dd>
      <dt>Use parents</dt>
      <dd>{sample.use_parents ? 'yes' : 'no'}</dd>
      <dt>Provider / Model</dt>
      <dd>{sample.provider} / {sample.model}</dd>
      {sample.base_url && (
        <>
          <dt>Base URL</dt>
          <dd>{sample.base_url}</dd>
        </>
      )}
      <dt>Source</dt>
      <dd>{sample.source}</dd>
      {sample.latency_ms != null && (
        <>
          <dt>Latency</dt>
          <dd>{sample.latency_ms} ms</dd>
        </>
      )}
      {sample.job_id && (
        <>
          <dt>Job</dt>
          <dd style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{sample.job_id}</dd>
        </>
      )}
      {sample.quick_test_session_id && (
        <>
          <dt>Quick test</dt>
          <dd style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{sample.quick_test_session_id}</dd>
        </>
      )}
      {sample.error && (
        <>
          <dt>Error</dt>
          <dd style={{ color: 'rgb(220,38,38)' }}>{sample.error}</dd>
        </>
      )}
    </dl>
  );
}
