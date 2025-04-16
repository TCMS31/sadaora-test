import { describe, expect, it } from 'vitest';
import { errorMessage, fieldErrors, isSessionExpired } from './api-error';

describe('errorMessage', () => {
  it('prefers the message from the API envelope', () => {
    expect(
      errorMessage({ status: 401, data: { error: { message: 'Invalid email or password' } } })
    ).toBe('Invalid email or password');
  });

  it('explains a transport failure in plain language', () => {
    expect(errorMessage({ status: 'FETCH_ERROR', error: 'TypeError' })).toMatch(
      /Could not reach the server/
    );
  });

  it('falls back when the response carries no envelope', () => {
    expect(errorMessage({ status: 500, data: 'boom' })).toBe('Request failed (500)');
  });

  it('returns the fallback for an unknown value', () => {
    expect(errorMessage(undefined, 'Login failed')).toBe('Login failed');
    expect(errorMessage('a string', 'Login failed')).toBe('Login failed');
  });
});

describe('fieldErrors', () => {
  it('extracts the per-field validation map', () => {
    expect(
      fieldErrors({ status: 400, data: { error: { details: { email: 'A valid email is required' } } } })
    ).toEqual({ email: 'A valid email is required' });
  });

  it('returns an empty map when there are no details', () => {
    expect(fieldErrors({ status: 500, data: {} })).toEqual({});
  });
});

describe('isSessionExpired', () => {
  it('treats 401 INVALID_TOKEN as an ended session', () => {
    expect(isSessionExpired({ status: 401, data: { error: { code: 'INVALID_TOKEN' } } })).toBe(true);
  });

  it('does not sign the member out for a 403 business rule', () => {
    // A 403 is "you cannot like your own profile", not "log in again".
    expect(isSessionExpired({ status: 403, data: { error: { code: 'FORBIDDEN' } } })).toBe(false);
  });

  it('does not sign the member out for failed login credentials', () => {
    expect(isSessionExpired({ status: 401, data: { error: { code: 'UNAUTHORIZED' } } })).toBe(false);
  });

  it('ignores every other status', () => {
    expect(isSessionExpired({ status: 404, data: {} })).toBe(false);
  });
});
