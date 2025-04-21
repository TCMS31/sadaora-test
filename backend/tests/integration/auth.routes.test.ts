import request from 'supertest';
import { buildTestApp } from '../helpers/app';

const { app } = buildTestApp();

describe('POST /api/auth/signup', () => {
  it('creates an account and returns a token plus the public user fields', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'signup@example.com', password: 'correct horse battery' })
      .expect(201);

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toEqual({ id: expect.any(String), email: 'signup@example.com' });
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  it('rejects an empty body with a field-level 400 rather than a 500', async () => {
    const response = await request(app).post('/api/auth/signup').send({}).expect(400);

    expect(response.body.error.code).toBe('BAD_REQUEST');
    expect(response.body.error.details).toEqual({
      email: expect.any(String),
      password: expect.any(String),
    });
  });

  it('rejects a password shorter than eight characters', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'short@example.com', password: 'short' })
      .expect(400);

    expect(response.body.error.details.password).toMatch(/8 and 128/);
  });

  it('rejects a malformed email address', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'not-an-email', password: 'correct horse battery' })
      .expect(400);
  });

  it('returns 409 for a duplicate account', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dupe@example.com', password: 'correct horse battery' })
      .expect(201);

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dupe@example.com', password: 'correct horse battery' })
      .expect(409);

    expect(response.body.error.code).toBe('CONFLICT');
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'login@example.com', password: 'correct horse battery' })
      .expect(201);
  });

  it('returns a token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'correct horse battery' })
      .expect(200);

    expect(response.body.token).toEqual(expect.any(String));
  });

  it('returns 401 with no token for a wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong password' })
      .expect(401);

    expect(response.body).not.toHaveProperty('token');
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('does not let an attacker distinguish an unknown account', async () => {
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'correct horse battery' })
      .expect(401);

    expect(unknown.body.error.message).toBe('Invalid email or password');
  });
});
