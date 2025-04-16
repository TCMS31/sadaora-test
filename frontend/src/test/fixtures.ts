import type { FeedProfile, Profile } from '../services/types';

export const API_URL = 'http://api.test/api';

export function makeProfile(overrides: Partial<FeedProfile> = {}): FeedProfile {
  return {
    id: 'profile-1',
    name: 'Amara Okonkwo',
    headline: 'Staff data engineer',
    bio: 'Ten years of moving large, messy datasets between systems.',
    photoUrl: null,
    interests: ['data engineering', 'postgres'],
    createdAt: '2025-04-01T10:00:00.000Z',
    likeCount: 3,
    likedByCurrentUser: false,
    ...overrides,
  };
}

export const MY_PROFILE: Profile = {
  id: 'me-1',
  name: 'Jordan Reyes',
  headline: 'Product engineer',
  bio: 'I build internal tools.',
  photoUrl: null,
  interests: ['developer tools', 'typescript'],
  createdAt: '2025-04-01T10:00:00.000Z',
};
