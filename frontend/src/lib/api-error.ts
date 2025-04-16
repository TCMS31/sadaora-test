import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

export type ApiError = FetchBaseQueryError | SerializedError | undefined;

/**
 * `unwrap()` rejects with `unknown`, so narrow once here rather than casting
 * at every call site.
 */
function asApiError(error: unknown): ApiError {
  if (!error || typeof error !== 'object') return undefined;
  if ('status' in error || 'message' in error) return error as ApiError;
  return undefined;
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: Record<string, string> };
}

/**
 * The API always answers a failure with `{ error: { code, message, details } }`.
 * This turns any RTK Query failure — including a transport error, where there
 * is no envelope at all — into a message safe to render.
 */
export function errorMessage(raw: unknown, fallback = 'Something went wrong'): string {
  const error = asApiError(raw);
  if (!error) return fallback;

  if ('status' in error) {
    if (error.status === 'FETCH_ERROR') {
      return 'Could not reach the server. Is the API running?';
    }
    const body = error.data as ErrorEnvelope | undefined;
    if (body?.error?.message) return body.error.message;
    return `Request failed (${String(error.status)})`;
  }

  return error.message ?? fallback;
}

/** Field-level validation messages, keyed by form field name. */
export function fieldErrors(raw: unknown): Record<string, string> {
  const error = asApiError(raw);
  if (!error || !('status' in error)) return {};
  const body = error.data as ErrorEnvelope | undefined;
  return body?.error?.details ?? {};
}

/**
 * True only for an ended session. A 403 means the member is signed in but not
 * allowed to perform this action (liking their own profile, for example) and
 * must NOT trigger a sign-out.
 */
export function isSessionExpired(raw: unknown): boolean {
  const error = asApiError(raw);
  if (!error || !('status' in error) || error.status !== 401) return false;
  const body = error.data as ErrorEnvelope | undefined;
  return body?.error?.code !== 'UNAUTHORIZED';
}
