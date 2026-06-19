import { useCallback, useEffect, useState } from 'react';
import {
  type ContextVersionSummary,
  type ModalityKey,
  sandboxContextsApi,
} from '../api/sandboxClient';
import { ConfirmModal } from '../components/ConfirmModal';
import { ContextEditor } from '../components/ContextEditor';
import { Modal } from '../../components/Modal';

interface Props {
  modality: ModalityKey;
}

export function ContextsPage({ modality }: Props) {
  const [versions, setVersions] = useState<ContextVersionSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<{ source: string; label: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<ContextVersionSummary | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const list = await sandboxContextsApi.list(modality);
      setVersions(list);
      if (!selected || !list.find((v) => v.version === selected)) {
        setSelected(list[0]?.version ?? null);
      }
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to load contexts');
    } finally {
      setLoading(false);
    }
  }, [modality, selected]);

  useEffect(() => {
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modality]);

  const doDuplicate = async () => {
    if (!duplicating) return;
    setBulkBusy(true);
    try {
      const next = await sandboxContextsApi.duplicate(
        modality,
        duplicating.source,
        duplicating.label.trim() || undefined,
      );
      await refresh();
      setSelected(next.version);
      setDuplicating(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Duplicate failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirmingDelete) return;
    setBulkBusy(true);
    try {
      await sandboxContextsApi.remove(modality, confirmingDelete.version);
      setConfirmingDelete(null);
      await refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Delete failed');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="sbx-page">
      <div className="sbx-page-header">
        <div>
          <h1>Contexts &mdash; {modality}</h1>
          <p className="sbx-subtitle">
            Browse, duplicate, edit, or delete every context version under
            <code> context_lib/{modality}/</code>. The app default is read-only —
            duplicate it to start customizing.
          </p>
        </div>
        <div className="sbx-row">
          <button
            type="button"
            className="sbx-btn is-primary"
            disabled={!selected}
            onClick={() =>
              selected && setDuplicating({ source: selected, label: '' })
            }
          >
            Duplicate selected
          </button>
        </div>
      </div>

      {error && <div className="sbx-error-banner">{error}</div>}

      <div className="sbx-ctx-layout">
        <section className="sbx-card">
          <div className="sbx-card-toolbar" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Versions ({versions.length})</h2>
            <button
              type="button"
              className="sbx-btn is-ghost"
              onClick={refresh}
              disabled={loading}
              title="Refresh"
            >
              ⟳
            </button>
          </div>
          {loading ? (
            <div className="sbx-empty">Loading…</div>
          ) : versions.length === 0 ? (
            <div className="sbx-empty">No versions found.</div>
          ) : (
            <div className="sbx-ctx-list">
              {versions.map((v) => (
                <ContextRow
                  key={v.version}
                  v={v}
                  active={selected === v.version}
                  onSelect={() => setSelected(v.version)}
                  onDuplicate={() => setDuplicating({ source: v.version, label: '' })}
                  onDelete={() => setConfirmingDelete(v)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="sbx-card">
          {selected ? (
            <ContextEditor
              key={selected + ':' + modality}
              modality={modality}
              version={selected}
              onSaved={refresh}
            />
          ) : (
            <div className="sbx-empty">Select a context to view or edit.</div>
          )}
        </section>
      </div>

      {duplicating && (
        <Modal onClose={() => !bulkBusy && setDuplicating(null)} contentClassName="sbx-confirm">
          <div style={{ padding: '1rem 1.1rem 0.9rem' }}>
            <h2 style={{ margin: '0 0 0.6rem' }}>
              Duplicate “{duplicating.source}”
            </h2>
            <p className="sbx-confirm-text">
              A new <code>vN</code> folder will be created with all files copied
              from the source. The new version is fully editable and can be
              renamed below (label only).
            </p>
            <label className="sbx-field" style={{ marginTop: '0.6rem' }}>
              <span className="sbx-field-label">Label (optional)</span>
              <input
                className="sbx-input"
                value={duplicating.label}
                onChange={(e) =>
                  setDuplicating({ ...duplicating, label: e.target.value })
                }
                placeholder={`Copy of ${duplicating.source}`}
              />
            </label>
            <div className="sbx-confirm-actions">
              <button
                type="button"
                className="sbx-btn is-ghost"
                disabled={bulkBusy}
                onClick={() => setDuplicating(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sbx-btn is-primary"
                disabled={bulkBusy}
                onClick={doDuplicate}
              >
                {bulkBusy ? 'Duplicating…' : 'Duplicate'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmingDelete && (
        <ConfirmModal
          title={`Delete “${confirmingDelete.version}”?`}
          body={
            <>
              The folder is moved to{' '}
              <code>context_lib/_trash/{modality}/</code> so it can be recovered
              from disk if needed. Existing samples that referenced it remain
              intact in the cache.
            </>
          }
          confirmLabel={bulkBusy ? 'Deleting…' : 'Delete'}
          danger
          onConfirm={doDelete}
          onCancel={() => !bulkBusy && setConfirmingDelete(null)}
        />
      )}
    </div>
  );
}

function ContextRow({
  v,
  active,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  v: ContextVersionSummary;
  active: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const isDefault = v.is_app_default;
  const lastModified = v.last_modified
    ? new Date(v.last_modified).toLocaleString()
    : '—';
  return (
    <div
      className={'sbx-ctx-row' + (active ? ' active' : '')}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect();
      }}
    >
      <div className="sbx-ctx-row-title">
        <span>
          {v.version === 'default' ? 'app default' : v.version}
        </span>
        {isDefault && (
          <span className="sbx-pill is-default" title="App default (read-only)">
            read-only
          </span>
        )}
        {v.label && <span className="sbx-pill">{v.label}</span>}
      </div>
      <div className="sbx-ctx-row-meta">
        <span>{v.source_count} sources</span>
        <span>{v.file_count} files</span>
        <span title={lastModified}>{lastModified}</span>
      </div>
      <div className="sbx-ctx-row-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sbx-btn is-ghost" onClick={onSelect} title="Edit">
          Edit
        </button>
        <button type="button" className="sbx-btn" onClick={onDuplicate} title="Duplicate">
          Duplicate
        </button>
        {!isDefault && (
          <button
            type="button"
            className="sbx-btn is-danger"
            onClick={onDelete}
            title="Delete"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
