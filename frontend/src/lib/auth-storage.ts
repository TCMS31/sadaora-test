const TOKEN_KEY = 'sadaora.token';

/**
 * Single owner of the persisted session. Components read and clear the token
 * through here rather than touching `localStorage` directly, which is what let
 * the original app log out by removing `token` while leaving `userId` behind.
 */
export const authStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      // Private browsing modes can throw on access.
      return null;
    }
  },

  set(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* non-persistent session is still usable for this tab */
    }
  },

  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to do */
    }
  },
};
