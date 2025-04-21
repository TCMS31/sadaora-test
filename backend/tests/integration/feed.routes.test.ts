import { Express } from 'express';
import request from 'supertest';
import { buildTestApp, createProfile, registerUser, TestUser } from '../helpers/app';

let app: Express;
let viewer: TestUser;

beforeAll(async () => {
  ({ app } = buildTestApp());
  viewer = await registerUser(app, 'viewer@example.com');
  await createProfile(app, viewer, { name: 'Viewer Themselves' });

  // Twelve other profiles, created in order so `createdAt desc` is meaningful.
  for (let i = 1; i <= 12; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const other = await registerUser(app, `member${i}@example.com`);
    // eslint-disable-next-line no-await-in-loop
    await createProfile(app, other, { name: `Member ${String(i).padStart(2, '0')}` });
  }
});

describe('GET /api/profile/feed', () => {
  it('excludes the viewer’s own profile', async () => {
    const response = await viewer.auth(request(app).get('/api/profile/feed?limit=50')).expect(200);
    const names = response.body.data.map((p: { name: string }) => p.name);

    expect(names).not.toContain('Viewer Themselves');
    expect(response.body.meta.total).toBe(12);
  });

  it('returns pagination metadata derived from the real total', async () => {
    const response = await viewer.auth(request(app).get('/api/profile/feed?page=1&limit=5')).expect(200);

    expect(response.body.data).toHaveLength(5);
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 5,
      total: 12,
      totalPages: 3,
      hasMore: true,
    });
  });

  it('reports hasMore=false on the final page even when it is exactly full', async () => {
    const full = await viewer.auth(request(app).get('/api/profile/feed?page=2&limit=6')).expect(200);

    expect(full.body.data).toHaveLength(6);
    expect(full.body.meta.hasMore).toBe(false);
  });

  it('returns disjoint pages with no duplicates across the whole feed', async () => {
    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        viewer.auth(request(app).get(`/api/profile/feed?page=${page}&limit=5`))
      )
    );
    const ids = pages.flatMap((page) => page.body.data.map((p: { id: string }) => p.id));

    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
  });

  it('clamps an absurd limit rather than letting a client ask for the whole table', async () => {
    const response = await viewer
      .auth(request(app).get('/api/profile/feed?page=1&limit=100000'))
      .expect(200);

    expect(response.body.meta.limit).toBe(50);
  });

  it('falls back to page 1 for a non-numeric page parameter', async () => {
    const response = await viewer.auth(request(app).get('/api/profile/feed?page=abc')).expect(200);
    expect(response.body.meta.page).toBe(1);
  });

  it('never leaks the raw like rows or the owning user id', async () => {
    const response = await viewer.auth(request(app).get('/api/profile/feed')).expect(200);

    for (const profile of response.body.data) {
      expect(profile).not.toHaveProperty('likes');
      expect(profile).not.toHaveProperty('userId');
      expect(profile).toHaveProperty('likeCount');
      expect(profile).toHaveProperty('likedByCurrentUser');
    }
  });

  it('returns an empty page, not an error, past the end of the feed', async () => {
    const response = await viewer.auth(request(app).get('/api/profile/feed?page=99')).expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.meta.hasMore).toBe(false);
  });
});
