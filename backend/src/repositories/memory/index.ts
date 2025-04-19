import { randomUUID } from 'crypto';
import {
  DataStore,
  FeedPage,
  FeedQuery,
  LikeRepository,
  ProfileInput,
  ProfileRecord,
  ProfileRepository,
  UserRecord,
  UserRepository,
} from '../types';

interface LikeRecord {
  profileId: string;
  likedById: string;
}

interface Tables {
  users: Map<string, UserRecord>;
  profiles: Map<string, ProfileRecord>;
  likes: LikeRecord[];
}

function createUserRepository(tables: Tables): UserRepository {
  return {
    async findByEmail(email) {
      const normalised = email.toLowerCase();
      return (
        [...tables.users.values()].find((user) => user.email.toLowerCase() === normalised) ?? null
      );
    },
    async findById(id) {
      return tables.users.get(id) ?? null;
    },
    async create({ email, passwordHash }) {
      const user: UserRecord = { id: randomUUID(), email, passwordHash };
      tables.users.set(user.id, user);
      return user;
    },
  };
}

function createProfileRepository(tables: Tables): ProfileRepository {
  const byUser = (userId: string): ProfileRecord | undefined =>
    [...tables.profiles.values()].find((profile) => profile.userId === userId);

  return {
    async findByUserId(userId) {
      return byUser(userId) ?? null;
    },

    async findById(id) {
      return tables.profiles.get(id) ?? null;
    },

    async upsertForUser(userId: string, input: ProfileInput) {
      const existing = byUser(userId);
      const profile: ProfileRecord = existing
        ? {
            ...existing,
            name: input.name,
            headline: input.headline,
            bio: input.bio,
            interests: input.interests,
            photoUrl: input.photoUrl !== undefined ? input.photoUrl : existing.photoUrl,
          }
        : {
            id: randomUUID(),
            userId,
            name: input.name,
            headline: input.headline,
            bio: input.bio,
            interests: input.interests,
            photoUrl: input.photoUrl ?? null,
            createdAt: new Date(),
          };

      tables.profiles.set(profile.id, profile);
      return profile;
    },

    async deleteByUserId(userId) {
      const existing = byUser(userId);
      if (!existing) return false;
      tables.profiles.delete(existing.id);
      tables.likes = tables.likes.filter((like) => like.profileId !== existing.id);
      return true;
    },

    async listFeed({ viewerId, skip, take }: FeedQuery): Promise<FeedPage> {
      const visible = [...tables.profiles.values()]
        .filter((profile) => profile.userId !== viewerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id));

      return {
        total: visible.length,
        items: visible.slice(skip, skip + take).map((profile) => ({
          ...profile,
          likeCount: tables.likes.filter((like) => like.profileId === profile.id).length,
          likedByViewer: tables.likes.some(
            (like) => like.profileId === profile.id && like.likedById === viewerId
          ),
        })),
      };
    },
  };
}

function createLikeRepository(tables: Tables): LikeRepository {
  return {
    async add(profileId, likedById) {
      const already = tables.likes.some(
        (like) => like.profileId === profileId && like.likedById === likedById
      );
      if (already) return false;
      tables.likes.push({ profileId, likedById });
      return true;
    },

    async remove(profileId, likedById) {
      const before = tables.likes.length;
      tables.likes = tables.likes.filter(
        (like) => !(like.profileId === profileId && like.likedById === likedById)
      );
      return tables.likes.length < before;
    },

    async countForProfile(profileId) {
      return tables.likes.filter((like) => like.profileId === profileId).length;
    },
  };
}

/**
 * An in-process `DataStore`. It satisfies exactly the same contracts as the
 * Prisma driver, so the integration suite and the seeded demo server exercise
 * the real routes, middleware, validation and services with no database.
 */
export function createMemoryDataStore(): DataStore {
  const tables: Tables = { users: new Map(), profiles: new Map(), likes: [] };
  return {
    users: createUserRepository(tables),
    profiles: createProfileRepository(tables),
    likes: createLikeRepository(tables),
  };
}
