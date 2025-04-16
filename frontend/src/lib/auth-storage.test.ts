import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from './auth-storage';

describe('authStorage', () => {
  beforeEach(() => window.localStorage.clear());

  it('round-trips and clears a token', () => {
    expect(authStorage.get()).toBeNull();
    authStorage.set('abc');
    expect(authStorage.get()).toBe('abc');
    authStorage.clear();
    expect(authStorage.get()).toBeNull();
  });

  it('returns null instead of throwing when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(authStorage.get()).toBeNull();
    spy.mockRestore();
  });
});
