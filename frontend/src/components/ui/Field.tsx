import { useId } from 'react';
import type { ReactElement, ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactElement;
}

/**
 * Associates a label, an optional hint and an error message with the control,
 * so screen readers announce validation failures instead of the user only
 * seeing red text.
 */
export function Field({ label, error, hint, children }: FieldProps): ReactNode {
  const id = useId();
  const messageId = error || hint ? `${id}-message` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children({
        id,
        ...(error ? { 'aria-invalid': true as const } : {}),
        ...(messageId ? { 'aria-describedby': messageId } : {}),
      })}
      {(error || hint) && (
        <p
          id={messageId}
          className={error ? 'text-sm text-danger' : 'text-sm text-ink-muted'}
          role={error ? 'alert' : undefined}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand aria-[invalid=true]:border-danger';
