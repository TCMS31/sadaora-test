import { config } from '../config/env';
import { HttpError } from '../lib/http-error';
import { DataStore, FeedPage, ProfileRecord } from '../repositories/types';

export interface SaveProfileInput {
  name: string;
  headline: string;
  bio: string;
  interests?: string;
  photoPath?: string;
}

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

/** `"react, node ,, react"` -> `["react", "node"]`. */
export function parseInterests(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag) return false;
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function createProfileService(store: DataStore) {
  async function requireProfile(profileId: string): Promise<ProfileRecord> {
    const profile = await store.profiles.findById(profileId);
    if (!profile) throw HttpError.notFound('Profile not found');
    return profile;
  }

  return {
    async getMine(userId: string): Promise<ProfileRecord> {
      const profile = await store.profiles.findByUserId(userId);
      if (!profile) throw HttpError.notFound('Profile not found');
      return profile;
    },

    async save(userId: string, input: SaveProfileInput): Promise<ProfileRecord> {
      return store.profiles.upsertForUser(userId, {
        name: input.name.trim(),
        headline: input.headline.trim(),
        bio: input.bio.trim(),
        interests: parseInterests(input.interests),
        ...(input.photoPath ? { photoUrl: input.photoPath } : {}),
      });
    },

    async remove(userId: string): Promise<void> {
      const deleted = await store.profiles.deleteByUserId(userId);
      // The original called `prisma.profile.delete` unconditionally: deleting
      // twice threw P2025 and, with no async error handling, hung the request.
      if (!deleted) throw HttpError.notFound('Profile not found');
    },

    async feed(
      userId: string,
      page: number,
      limit: number
    ): Promise<FeedPage & { page: number; limit: number }> {
      const safeLimit = Math.min(Math.max(limit, 1), config.maxFeedPageSize);
      const safePage = Math.max(page, 1);
      const result = await store.profiles.listFeed({
        viewerId: userId,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      });
      return { ...result, page: safePage, limit: safeLimit };
    },

    async like(userId: string, profileId: string): Promise<LikeResult> {
      const profile = await requireProfile(profileId);
      if (profile.userId === userId) {
        throw HttpError.forbidden('You cannot like your own profile');
      }
      // Idempotent: a double-tap is not an error, it is a no-op. The response
      // always carries the authoritative count so the client can reconcile an
      // optimistic update instead of drifting away from the server.
      await store.likes.add(profileId, userId);
      return { liked: true, likeCount: await store.likes.countForProfile(profileId) };
    },

    async unlike(userId: string, profileId: string): Promise<LikeResult> {
      await requireProfile(profileId);
      await store.likes.remove(profileId, userId);
      return { liked: false, likeCount: await store.likes.countForProfile(profileId) };
    },
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;
