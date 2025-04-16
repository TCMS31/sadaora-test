/**
 * Each case here corresponds to a defect in the original submission. They are
 * kept together so the reason they exist stays visible.
 */
import { Express } from 'express';
import request from 'supertest';
import { buildTestApp, createProfile, registerUser } from '../helpers/app';

let app: Express;

beforeEach(() => {
  ({ app } = buildTestApp());
});

describe('regressions', () => {
  it('deleting a profile that has likes responds instead of hanging', async () => {
    // Original: `prisma.profile.delete` hit an ON DELETE RESTRICT foreign key,
    // the rejection escaped the un-awaited async handler, and the request
    // never received a response.
    const author = await registerUser(app, 'author@example.com');
    const liker = await registerUser(app, 'liker@example.com');
    const { id } = await createProfile(app, author);

    await liker.auth(request(app).post(`/api/profile/${id}/like`)).expect(200);
    await author.auth(request(app).delete('/api/profile')).expect(204);

    const feed = await liker.auth(request(app).get('/api/profile/feed')).expect(200);
    expect(feed.body.data).toEqual([]);
  });

  it('an unknown route returns a JSON 404, not Express’s HTML page', async () => {
    const response = await request(app).get('/api/nope').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('a malformed JSON body returns 400, not 500', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ')
      .expect(400);

    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('/api/profile/feed is not captured by the /:id route pattern', async () => {
    const user = await registerUser(app);
    const response = await user.auth(request(app).get('/api/profile/feed')).expect(200);
    expect(response.body).toHaveProperty('meta');
  });

  it('exposes a health endpoint that does not require a token', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toMatchObject({ status: 'ok', driver: 'memory' });
  });

  it('sets security headers and does not advertise Express', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('never returns an internal driver message to the client', async () => {
    const user = await registerUser(app);
    const response = await user.auth(request(app).get('/api/profile/me')).expect(404);

    expect(JSON.stringify(response.body)).not.toMatch(/prisma|postgres|\/Users\//i);
  });
});
