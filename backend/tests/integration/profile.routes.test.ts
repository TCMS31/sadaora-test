import request from 'supertest';
import { buildTestApp, createProfile, registerUser, SAMPLE_PROFILE } from '../helpers/app';

const { app } = buildTestApp();

describe('profile routes', () => {
  it('rejects every profile route without a bearer token', async () => {
    await request(app).get('/api/profile/me').expect(401);
    await request(app).get('/api/profile/feed').expect(401);
    await request(app).post('/api/profile').expect(401);
    await request(app).delete('/api/profile').expect(401);
  });

  it('rejects a token that was not signed by this server with 401 INVALID_TOKEN', async () => {
    const response = await request(app)
      .get('/api/profile/me')
      .set('Authorization', 'Bearer not.a.real.token')
      .expect(401);

    // A distinct code so the client can tell "your session ended" apart from
    // "you are not allowed to do that".
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 404 before a profile exists, then the saved profile', async () => {
    const user = await registerUser(app);
    await user.auth(request(app).get('/api/profile/me')).expect(404);

    await createProfile(app, user);

    const response = await user.auth(request(app).get('/api/profile/me')).expect(200);
    expect(response.body).toMatchObject({
      name: SAMPLE_PROFILE.name,
      headline: SAMPLE_PROFILE.headline,
      interests: ['mathematics', 'engines', 'poetry'],
    });
  });

  it('rejects a save with missing fields instead of writing a half-built row', async () => {
    const user = await registerUser(app);
    const response = await user
      .auth(request(app).post('/api/profile'))
      .field('name', '')
      .field('headline', 'x')
      .expect(400);

    expect(response.body.error.details).toMatchObject({ name: expect.any(String) });
    await user.auth(request(app).get('/api/profile/me')).expect(404);
  });

  it('returns the same absolute photoUrl shape from save and from read', async () => {
    const user = await registerUser(app);
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d4948445200000001000000010806000000',
      'hex'
    );

    const saved = await user
      .auth(request(app).post('/api/profile'))
      .field('name', 'Photo User')
      .field('headline', 'Has a photo')
      .field('bio', 'A bio.')
      .field('interests', 'photography')
      .attach('photo', png, { filename: 'avatar.png', contentType: 'image/png' })
      .expect(200);

    const read = await user.auth(request(app).get('/api/profile/me')).expect(200);

    // Absolute, origin-qualified, and identical from both endpoints. supertest
    // binds an ephemeral port per request, so compare the path, not the origin.
    expect(saved.body.photoUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/uploads\/photo-[0-9a-f-]+\.png$/);
    expect(new URL(read.body.photoUrl).pathname).toBe(new URL(saved.body.photoUrl).pathname);
    // ...and the extension comes from the MIME type, not the uploaded filename.
    expect(read.body.photoUrl).not.toContain('avatar');
  });

  it('refuses a non-image upload', async () => {
    const user = await registerUser(app);
    const response = await user
      .auth(request(app).post('/api/profile'))
      .field('name', 'Script Kiddie')
      .field('headline', 'x')
      .field('bio', 'y')
      .attach('photo', Buffer.from('<script>alert(1)</script>'), {
        filename: 'payload.html',
        contentType: 'text/html',
      })
      .expect(400);

    expect(response.body.error.message).toMatch(/Unsupported image type/);
  });

  it('refuses an upload above the size limit with 413', async () => {
    const user = await registerUser(app);
    await user
      .auth(request(app).post('/api/profile'))
      .field('name', 'Big Upload')
      .field('headline', 'x')
      .field('bio', 'y')
      .attach('photo', Buffer.alloc(200 * 1024, 1), {
        filename: 'big.png',
        contentType: 'image/png',
      })
      .expect(413);
  });

  it('deletes a profile once and reports 404 on a second delete', async () => {
    const user = await registerUser(app);
    await createProfile(app, user);

    await user.auth(request(app).delete('/api/profile')).expect(204);
    await user.auth(request(app).get('/api/profile/me')).expect(404);
    await user.auth(request(app).delete('/api/profile')).expect(404);
  });
});
