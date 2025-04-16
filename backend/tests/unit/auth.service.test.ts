import { createMemoryDataStore } from '../../src/repositories/memory';
import { DataStore } from '../../src/repositories/types';
import { createAuthService } from '../../src/services/auth.service';

describe('auth service', () => {
  let store: DataStore;
  let service: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    store = createMemoryDataStore();
    service = createAuthService(store);
  });

  it('stores a bcrypt hash, never the plaintext password', async () => {
    await service.signup({ email: 'ada@example.com', password: 'correct horse battery' });
    const stored = await store.users.findByEmail('ada@example.com');

    expect(stored!.passwordHash).not.toBe('correct horse battery');
    expect(stored!.passwordHash.startsWith('$2')).toBe(true);
  });

  it('normalises the email so casing cannot create a duplicate account', async () => {
    await service.signup({ email: 'Ada@Example.com ', password: 'correct horse battery' });
    await expect(
      service.signup({ email: 'ada@example.com', password: 'another password' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('logs in with the stored credentials', async () => {
    await service.signup({ email: 'ada@example.com', password: 'correct horse battery' });
    const result = await service.login({ email: 'ADA@example.com', password: 'correct horse battery' });
    expect(typeof result.token).toBe('string');
    expect(result.user.email).toBe('ada@example.com');
  });

  it('gives the same error for an unknown account and a wrong password', async () => {
    await service.signup({ email: 'ada@example.com', password: 'correct horse battery' });

    const unknown = await service.login({ email: 'nobody@example.com', password: 'x' }).catch((e) => e);
    const wrong = await service.login({ email: 'ada@example.com', password: 'wrong' }).catch((e) => e);

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.message).toBe(wrong.message);
  });
});
