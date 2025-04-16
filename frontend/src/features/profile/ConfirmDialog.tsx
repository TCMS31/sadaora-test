import { useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    // Move focus into the dialog and let Escape dismiss it, neither of which
    // the original modal did.
    confirmRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-lg"
      >
        <h2 id="confirm-title" className="text-base font-semibold text-ink">
          {title}
        </h2>
        <p id="confirm-description" className="mt-2 text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button ref={confirmRef} variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
