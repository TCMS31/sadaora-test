import type { ReactNode } from 'react';
import { Button } from './Button';

export function Callout({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const styles =
    tone === 'error'
      ? 'border-danger/30 bg-danger-soft text-danger'
      : 'border-brand/25 bg-brand-soft text-brand-strong';

  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10 text-center"
    >
      <h3 className="text-base font-semibold text-danger">We could not load this</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-danger/90">{message}</p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/** Matches the shape of a feed card so the layout does not jump on load. */
export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-line bg-surface p-5">
      <div className="flex gap-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-line" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-40 animate-pulse rounded bg-line" />
          <div className="h-3 w-56 animate-pulse rounded bg-line" />
          <div className="h-3 w-full animate-pulse rounded bg-line" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-line" />
        </div>
      </div>
    </div>
  );
}
