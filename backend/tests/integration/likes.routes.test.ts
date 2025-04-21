import { Express } from 'express';
import request from 'supertest';
import { buildTestApp, createProfile, registerUser, TestUser } from '../helpers/app';

let app: Express;
let author: TestUser;
let viewer: TestUser;
let profileId: string;

beforeEach(async () => {
  ({ app } = buildTestApp());
  author = await registerUser(app, 'author@example.com');
  viewer = await registerUser(app, 'liker@example.com');
  ({ id: profileId } = await createProfile(app, author, { name: 'Liked Author' }));
});

describe('likes', () => {
  it('returns the authoritative count so the client can reconcile its optimistic update', async () => {
    const response = await viewer
      .auth(request(app).post(`/api/profile/${profileId}/like`))
      .expect(200);

    expect(response.body).toEqual({ liked: true, likeCount: 1 });
  });

  it('is idempotent: a double tap does not double-count', async () => {
    await viewer.auth(request(app).post(`/api/profile/${profileId}/like`)).expect(200);
    const second = await viewer
      .auth(request(app).post(`/api/profile/${profileId}/like`))
      .expect(200);

    expect(second.body).toEqual({ liked: true, likeCount: 1 });
  });

  it('counts one like per user, not per request', async () => {
    const third = await registerUser(app, 'third@example.com');
    await viewer.auth(request(app).post(`/api/profile/${profileId}/like`)).expect(200);
    const response = await third
      .auth(request(app).post(`/api/profile/${profileId}/like`))
      .expect(200);

    expect(response.body.likeCount).toBe(2);
  });

  it('unlikes, and unliking again is a no-op rather than a false success on nothing', async () => {
    await viewer.auth(request(app).post(`/api/profile/${profileId}/like`)).expect(200);

    expect((await viewer.auth(request(app).delete(`/api/profile/${profileId}/like`))).body).toEqual({
      liked: false,
      likeCount: 0,
    });
    expect((await viewer.auth(request(app).delete(`/api/profile/${profileId}/like`))).body).toEqual({
      liked: false,
      likeCount: 0,
    });
  });

  it('refuses a self-like with 403', async () => {
    const response = await author
      .auth(request(app).post(`/api/profile/${profileId}/like`))
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 for a like against an id that does not exist', async () => {
    await viewer.auth(request(app).post('/api/profile/does-not-exist/like')).expect(404);
    await viewer.auth(request(app).delete('/api/profile/does-not-exist/like')).expect(404);
  });

  it('surfaces the like state in the feed for the viewer only', async () => {
    const bystander = await registerUser(app, 'bystander@example.com');
    await viewer.auth(request(app).post(`/api/profile/${profileId}/like`)).expect(200);

    const asViewer = await viewer.auth(request(app).get('/api/profile/feed')).expect(200);
    const asBystander = await bystander.auth(request(app).get('/api/profile/feed')).expect(200);

    expect(asViewer.body.data.find((p: { id: string }) => p.id === profileId)).toMatchObject({
      likeCount: 1,
      likedByCurrentUser: true,
    });
    expect(asBystander.body.data.find((p: { id: string }) => p.id === profileId)).toMatchObject({
      likeCount: 1,
      likedByCurrentUser: false,
    });
  });
});
