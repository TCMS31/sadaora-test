import { Prisma, PrismaClient } from '@prisma/client';
import { LikeRepository } from '../types';

const UNIQUE_VIOLATION = 'P2002';

export function createPrismaLikeRepository(prisma: PrismaClient): LikeRepository {
  return {
    async add(profileId, likedById) {
      try {
        // The @@unique([profileId, likedById]) index is the source of truth.
        // The original check-then-create was a time-of-check/time-of-use race
        // that let a double-click insert two like rows.
        await prisma.like.create({ data: { profileId, likedById } });
        return true;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === UNIQUE_VIOLATION
        ) {
          return false;
        }
        throw error;
      }
    },

    async remove(profileId, likedById) {
      const { count } = await prisma.like.deleteMany({ where: { profileId, likedById } });
      return count > 0;
    },

    async countForProfile(profileId) {
      return prisma.like.count({ where: { profileId } });
    },
  };
}
