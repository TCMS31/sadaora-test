import { HttpError } from '../../src/lib/http-error';
import { createMemoryDataStore } from '../../src/repositories/memory';
import { DataStore } from '../../src/repositories/types';
import { createProfileService, parseInterests } from '../../src/services/profile.service';

describe('parseInterests', () => {
  it('splits on commas and trims whitespace', () => {
    expect(parseInterests(' react , node ')).toEqual(['react', 'node']);
  });

  it('drops empty segments produced by stray commas', () => {
    expect(parseInterests('react,,node,')).toEqual(['react', 'node']);
  });

  it('de-duplicates case-insensitively, keeping the first spelling', () => {
    expect(parseInterests('React, react, REACT, node')).toEqual(['React', 'node']);
  });

  it('returns an empty list for undefined or blank input', () => {
    expect(parseInterests(undefined)).toEqual([]);
    expect(parseInterests('   ')).toEqual([]);
  });
});

describe('profile service', () => {
  let store: DataStore;
  let service: ReturnType<typeof createProfileService>;

  beforeEach(async () => {
    store = createMemoryDataStore();
    service = createProfileService(store);
  });

  async function seedUserWithProfile(email: string) {
    const user = await store.users.create({ email, passwordHash: 'x' });
    const profile = await service.save(user.id, {
      name: 'Grace Hopper',
      headline: 'Compiler pioneer',
      bio: 'COBOL, and the first documented computer bug.',
      interests: 'compilers, navy',
    });
    return { user, profile };
  }

  it('creates then updates a single profile per user', async () => {
    const { user, profile } = await seedUserWithProfile('grace@example.com');

    const updated = await service.save(user.id, {
      name: 'Grace B. Hopper',
      headline: 'Rear Admiral',
      bio: 'Standardising machine-independent languages.',
      interests: 'compilers',
    });

    expect(updated.id).toBe(profile.id);
    expect(updated.name).toBe('Grace B. Hopper');
    expect(await store.profiles.findByUserId(user.id)).toMatchObject({ name: 'Grace B. Hopper' });
  });

  it('keeps the existing photo when a save omits a new file', async () => {
    const { user } = await seedUserWithProfile('photo@example.com');
    await service.save(user.id, {
      name: 'A',
      headline: 'B',
      bio: 'C',
      photoPath: '/uploads/first.png',
    });

    const updated = await service.save(user.id, { name: 'A', headline: 'B', bio: 'C2' });
    expect(updated.photoUrl).toBe('/uploads/first.png');
  });

  it('rejects a second delete with 404 instead of throwing a driver error', async () => {
    const { user } = await seedUserWithProfile('delete@example.com');
    await service.remove(user.id);
    await expect(service.remove(user.id)).rejects.toMatchObject({ status: 404 });
  });

  it('refuses to like your own profile', async () => {
    const { user, profile } = await seedUserWithProfile('self@example.com');
    await expect(service.like(user.id, profile.id)).rejects.toBeInstanceOf(HttpError);
    await expect(service.like(user.id, profile.id)).rejects.toMatchObject({ status: 403 });
  });

  it('returns 404 for a like against a profile id that does not exist', async () => {
    const user = await store.users.create({ email: 'ghost@example.com', passwordHash: 'x' });
    await expect(service.like(user.id, 'no-such-profile')).rejects.toMatchObject({ status: 404 });
    await expect(service.unlike(user.id, 'no-such-profile')).rejects.toMatchObject({ status: 404 });
  });

  it('is idempotent: liking twice yields a count of one', async () => {
    const { profile } = await seedUserWithProfile('target@example.com');
    const viewer = await store.users.create({ email: 'viewer@example.com', passwordHash: 'x' });

    expect(await service.like(viewer.id, profile.id)).toEqual({ liked: true, likeCount: 1 });
    expect(await service.like(viewer.id, profile.id)).toEqual({ liked: true, likeCount: 1 });
    expect(await service.unlike(viewer.id, profile.id)).toEqual({ liked: false, likeCount: 0 });
    expect(await service.unlike(viewer.id, profile.id)).toEqual({ liked: false, likeCount: 0 });
  });

  it('clamps the page size to the configured maximum and the page to >= 1', async () => {
    const viewer = await store.users.create({ email: 'v@example.com', passwordHash: 'x' });
    const page = await service.feed(viewer.id, -3, 10_000);
    expect(page.page).toBe(1);
    expect(page.limit).toBe(50);
  });
});
