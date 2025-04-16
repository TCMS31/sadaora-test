import { PrismaClient } from '@prisma/client';
import { FeedPage, FeedQuery, ProfileRecord, ProfileRepository } from '../types';

export function createPrismaProfileRepository(prisma: PrismaClient): ProfileRepository {
  return {
    async findByUserId(userId) {
      return prisma.profile.findUnique({ where: { userId } }) as Promise<ProfileRecord | null>;
    },

    async findById(id) {
      return prisma.profile.findUnique({ where: { id } }) as Promise<ProfileRecord | null>;
    },

    async upsertForUser(userId, input) {
      const data = {
        name: input.name,
        headline: input.headline,
        bio: input.bio,
        interests: input.interests,
        ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
      };

      // A single upsert instead of the original find-then-branch, which raced
      // two concurrent saves into a unique-constraint violation.
      return prisma.profile.upsert({
        where: { userId },
        create: { ...data, userId, photoUrl: input.photoUrl ?? null },
        update: data,
      }) as Promise<ProfileRecord>;
    },

    async deleteByUserId(userId) {
      // Likes referencing this profile must go first: the foreign key is
      // ON DELETE CASCADE in the schema, but the transaction keeps the
      // behaviour explicit and identical across drivers.
      const profile = await prisma.profile.findUnique({ where: { userId } });
      if (!profile) return false;

      await prisma.$transaction([
        prisma.like.deleteMany({ where: { profileId: profile.id } }),
        prisma.profile.delete({ where: { userId } }),
      ]);
      return true;
    },

    async listFeed({ viewerId, skip, take }: FeedQuery): Promise<FeedPage> {
      // `_count` aggregates like rows in Postgres instead of shipping every
      // Like row to Node just to call `.length` on it, and the viewer's own
      // like is a single bounded sub-select rather than a per-row query.
      const [rows, total] = await prisma.$transaction([
        prisma.profile.findMany({
          where: { userId: { not: viewerId } },
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: {
            _count: { select: { likes: true } },
            likes: { where: { likedById: viewerId }, select: { id: true }, take: 1 },
          },
        }),
        prisma.profile.count({ where: { userId: { not: viewerId } } }),
      ]);

      return {
        total,
        items: rows.map((row) => ({
          id: row.id,
          userId: row.userId,
          name: row.name,
          headline: row.headline,
          bio: row.bio,
          photoUrl: row.photoUrl,
          interests: row.interests,
          createdAt: row.createdAt,
          likeCount: row._count.likes,
          likedByViewer: row.likes.length > 0,
        })),
      };
    },
  };
}
