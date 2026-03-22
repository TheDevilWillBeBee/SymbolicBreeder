import { useEffect } from 'react';

interface ModalProps {
  onClose: () => void;
  /** Extra CSS class applied to the modal-content div (e.g. "share-modal") */
  contentClassName?: string;
  /** Extra CSS class applied to the overlay div (e.g. "customize-overlay") */
  overlayClassName?: string;
  children: React.ReactNode;
}

/**
 * Base modal shell: semi-transparent overlay, centered content box.
 * - Clicking the overlay backdrop closes the modal.
 * - Pressing Escape closes the modal.
 * - Clicking inside the content box stops event propagation.
 */
export function Modal({ onClose, contentClassName, overlayClassName, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const overlayClass = ['modal-overlay', overlayClassName].filter(Boolean).join(' ');
  const contentClass = ['modal-content', contentClassName].filter(Boolean).join(' ');

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={contentClass} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
