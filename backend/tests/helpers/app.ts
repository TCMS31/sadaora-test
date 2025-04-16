import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createMemoryDataStore } from '../../src/repositories/memory';
import { DataStore } from '../../src/repositories/types';

export interface TestContext {
  app: Express;
  store: DataStore;
}

export function buildTestApp(): TestContext {
  const store = createMemoryDataStore();
  return { app: createApp({ store }), store };
}

export interface TestUser {
  token: string;
  userId: string;
  email: string;
  auth: (req: request.Test) => request.Test;
}

let sequence = 0;

/** Registers a user through the real HTTP surface and returns its token. */
export async function registerUser(app: Express, email?: string): Promise<TestUser> {
  sequence += 1;
  const address = email ?? `user${sequence}@example.com`;
  const response = await request(app)
    .post('/api/auth/signup')
    .send({ email: address, password: 'correct horse battery' })
    .expect(201);

  const { token, user } = response.body;
  return {
    token,
    userId: user.id,
    email: user.email,
    auth: (req) => req.set('Authorization', `Bearer ${token}`),
  };
}

export const SAMPLE_PROFILE = {
  name: 'Ada Lovelace',
  headline: 'Analytical engine programmer',
  bio: 'Writing the first algorithm intended for a machine.',
  interests: 'mathematics, engines, poetry',
};

export async function createProfile(
  app: Express,
  user: TestUser,
  overrides: Partial<typeof SAMPLE_PROFILE> = {}
): Promise<{ id: string }> {
  const response = await user
    .auth(request(app).post('/api/profile'))
    .field('name', overrides.name ?? SAMPLE_PROFILE.name)
    .field('headline', overrides.headline ?? SAMPLE_PROFILE.headline)
    .field('bio', overrides.bio ?? SAMPLE_PROFILE.bio)
    .field('interests', overrides.interests ?? SAMPLE_PROFILE.interests)
    .expect(200);

  return response.body;
}
