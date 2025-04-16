import { HttpError } from '../lib/http-error';
import { hashPassword, verifyPassword } from '../lib/passwords';
import { signAccessToken } from '../lib/tokens';
import { DataStore } from '../repositories/types';

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

export function createAuthService(store: DataStore) {
  const normalise = (email: string): string => email.trim().toLowerCase();

  return {
    async signup({ email, password }: Credentials): Promise<AuthResult> {
      const normalised = normalise(email);
      const existing = await store.users.findByEmail(normalised);
      if (existing) {
        throw HttpError.conflict('An account with that email already exists');
      }

      const user = await store.users.create({
        email: normalised,
        passwordHash: await hashPassword(password),
      });

      return { token: signAccessToken({ userId: user.id }), user: { id: user.id, email: user.email } };
    },

    async login({ email, password }: Credentials): Promise<AuthResult> {
      const user = await store.users.findByEmail(normalise(email));
      // Same message and same code path for "no such user" and "wrong
      // password" so the endpoint cannot be used to enumerate accounts.
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw HttpError.unauthorized('Invalid email or password');
      }

      return { token: signAccessToken({ userId: user.id }), user: { id: user.id, email: user.email } };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
