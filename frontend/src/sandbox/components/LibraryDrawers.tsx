import { useEffect, useState } from 'react';
import {
  type ParentItem,
  type PromptItem,
  sandboxParentsApi,
  sandboxPromptsApi,
} from '../api/sandboxClient';
import { Modal } from '../../components/Modal';

interface ParentDrawerProps {
  modality: string;
  /** Already-selected items will be highlighted. */
  selectedIds?: Set<string>;
  /** Inline custom (no DB id) entries shown above the DB list. */
  inlineParents?: Array<{ key: string; code: string; label?: string }>;
  onToggleSelect?: (item: ParentItem) => void;
  /** Called after the user adds, edits, or removes — parents library changed. */
  onLibraryChanged?: (items: ParentItem[]) => void;
  onClose: () => void;
  /** When set, drawer becomes a picker (multiple-select then "Done"). */
  pickerMode?: boolean;
  onConfirmPick?: (items: ParentItem[]) => void;
}

export function ParentLibraryDrawer({
  modality,
  selectedIds,
  onToggleSelect,
  onLibraryChanged,
  onClose,
  pickerMode = false,
  onConfirmPick,
}: ParentDrawerProps) {
  const [items, setItems] = useState<ParentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set(selectedIds));

  const refresh = async () => {
    setError(null);
    try {
      const list = await sandboxParentsApi.list(modality);
      setItems(list);
      onLibraryChanged?.(list);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modality]);

  const add = async () => {
    if (!draftCode.trim()) return;
    setBusy(true);
    try {
      await sandboxParentsApi.create(modality, {
        label: draftLabel.trim() || 'Untitled',
        code: draftCode,
      });
      setDraftLabel('');
      setDraftCode('');
      await refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await sandboxParentsApi.remove(modality, id);
      await refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  const togglePicked = (item: ParentItem) => {
    if (pickerMode) {
      setPicked((p) => {
        const next = new Set(p);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    }
    onToggleSelect?.(item);
  };

  return (
    <Modal onClose={onClose} contentClassName="sbx-drawer-modal">
      <div style={{ padding: '0.9rem 1.1rem', minWidth: 'min(92vw, 720px)' }}>
        <div className="sbx-card-toolbar" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Parent library &mdash; {modality}</h2>
          <button type="button" className="sbx-btn is-ghost" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="sbx-error-banner">{error}</div>}

        <div className="sbx-card" style={{ marginBottom: '0.7rem' }}>
          <h3>Add new</h3>
          <div className="sbx-form-grid">
            <label className="sbx-field">
              <span className="sbx-field-label">Label</span>
              <input
                className="sbx-input"
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                placeholder="e.g. Bass-focused starter"
              />
            </label>
          </div>
          <label className="sbx-field" style={{ marginTop: '0.45rem' }}>
            <span className="sbx-field-label">Code</span>
            <textarea
              className="sbx-textarea"
              value={draftCode}
              onChange={(e) => setDraftCode(e.target.value)}
              rows={5}
              placeholder="Paste a starter program here…"
            />
          </label>
          <div className="sbx-row" style={{ marginTop: '0.45rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="sbx-btn is-primary"
              disabled={busy || !draftCode.trim()}
              onClick={add}
            >
              Add to library
            </button>
          </div>
        </div>

        <h3>Library ({items.length})</h3>
        {loading ? (
          <div className="sbx-empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="sbx-empty">Empty. Add a parent above.</div>
        ) : (
          <div className="sbx-drawer">
            {items.map((item) => {
              const isSelected = pickerMode ? picked.has(item.id) : selectedIds?.has(item.id);
              return (
                <div
                  key={item.id}
                  className={'sbx-drawer-row' + (isSelected ? ' active' : '')}
                  style={
                    isSelected
                      ? { borderColor: 'var(--accent)' }
                      : undefined
                  }
                >
                  <div className="sbx-drawer-row-head">
                    <span>{item.label}</span>
                    <div className="sbx-row">
                      {(pickerMode || onToggleSelect) && (
                        <button
                          type="button"
                          className={'sbx-btn' + (isSelected ? ' is-primary' : '')}
                          onClick={() => togglePicked(item)}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="sbx-btn is-danger"
                        onClick={() => remove(item.id)}
                        disabled={busy}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="sbx-drawer-row-text">{item.code}</div>
                </div>
              );
            })}
          </div>
        )}

        {pickerMode && (
          <div className="sbx-confirm-actions">
            <button type="button" className="sbx-btn is-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="sbx-btn is-primary"
              onClick={() => {
                const chosen = items.filter((it) => picked.has(it.id));
                onConfirmPick?.(chosen);
              }}
            >
              Use selected ({picked.size})
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface PromptDrawerProps {
  modality: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (item: PromptItem) => void;
  onLibraryChanged?: (items: PromptItem[]) => void;
  onClose: () => void;
  pickerMode?: boolean;
  onConfirmPick?: (items: PromptItem[]) => void;
}

export function PromptLibraryDrawer({
  modality,
  selectedIds,
  onToggleSelect,
  onLibraryChanged,
  onClose,
  pickerMode = false,
  onConfirmPick,
}: PromptDrawerProps) {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftText, setDraftText] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set(selectedIds));

  const refresh = async () => {
    setError(null);
    try {
      const list = await sandboxPromptsApi.list(modality);
      setItems(list);
      onLibraryChanged?.(list);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modality]);

  const add = async () => {
    if (!draftText.trim()) return;
    setBusy(true);
    try {
      await sandboxPromptsApi.create(modality, {
        label: draftLabel.trim() || undefined,
        text: draftText,
      });
      setDraftLabel('');
      setDraftText('');
      await refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await sandboxPromptsApi.remove(modality, id);
      await refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  const togglePicked = (item: PromptItem) => {
    if (pickerMode) {
      setPicked((p) => {
        const next = new Set(p);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    }
    onToggleSelect?.(item);
  };

  return (
    <Modal onClose={onClose} contentClassName="sbx-drawer-modal">
      <div style={{ padding: '0.9rem 1.1rem', minWidth: 'min(92vw, 720px)' }}>
        <div className="sbx-card-toolbar" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Prompt library &mdash; {modality}</h2>
          <button type="button" className="sbx-btn is-ghost" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="sbx-error-banner">{error}</div>}

        <div className="sbx-card" style={{ marginBottom: '0.7rem' }}>
          <h3>Add new</h3>
          <label className="sbx-field">
            <span className="sbx-field-label">Label (optional)</span>
            <input
              className="sbx-input"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder="e.g. Warm and melodic"
            />
          </label>
          <label className="sbx-field" style={{ marginTop: '0.45rem' }}>
            <span className="sbx-field-label">Prompt text</span>
            <textarea
              className="sbx-textarea"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={3}
              placeholder="Direction the LLM should follow…"
            />
          </label>
          <div className="sbx-row" style={{ marginTop: '0.45rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="sbx-btn is-primary"
              disabled={busy || !draftText.trim()}
              onClick={add}
            >
              Add to library
            </button>
          </div>
        </div>

        <h3>Library ({items.length})</h3>
        {loading ? (
          <div className="sbx-empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="sbx-empty">Empty. Add a prompt above.</div>
        ) : (
          <div className="sbx-drawer">
            {items.map((item) => {
              const isSelected = pickerMode ? picked.has(item.id) : selectedIds?.has(item.id);
              return (
                <div
                  key={item.id}
                  className="sbx-drawer-row"
                  style={isSelected ? { borderColor: 'var(--accent)' } : undefined}
                >
                  <div className="sbx-drawer-row-head">
                    <span>{item.label || 'Untitled'}</span>
                    <div className="sbx-row">
                      {(pickerMode || onToggleSelect) && (
                        <button
                          type="button"
                          className={'sbx-btn' + (isSelected ? ' is-primary' : '')}
                          onClick={() => togglePicked(item)}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="sbx-btn is-danger"
                        onClick={() => remove(item.id)}
                        disabled={busy}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="sbx-drawer-row-text">{item.text}</div>
                </div>
              );
            })}
          </div>
        )}

        {pickerMode && (
          <div className="sbx-confirm-actions">
            <button type="button" className="sbx-btn is-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="sbx-btn is-primary"
              onClick={() => {
                const chosen = items.filter((it) => picked.has(it.id));
                onConfirmPick?.(chosen);
              }}
            >
              Use selected ({picked.size})
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
