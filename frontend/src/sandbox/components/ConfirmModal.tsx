import { Modal } from '../../components/Modal';

interface Props {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal onClose={onCancel} contentClassName="sbx-confirm">
      <div style={{ padding: '1rem 1.1rem 0.9rem' }}>
        <h2 style={{ margin: '0 0 0.6rem' }}>{title}</h2>
        <div className="sbx-confirm-text">{body}</div>
        <div className="sbx-confirm-actions">
          <button type="button" className="sbx-btn is-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={'sbx-btn ' + (danger ? 'is-danger' : 'is-primary')}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
