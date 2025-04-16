import { PrismaClient } from '@prisma/client';
import { UserRecord, UserRepository } from '../types';

export function createPrismaUserRepository(prisma: PrismaClient): UserRepository {
  return {
    async findByEmail(email) {
      return prisma.user.findUnique({ where: { email } }) as Promise<UserRecord | null>;
    },
    async findById(id) {
      return prisma.user.findUnique({ where: { id } }) as Promise<UserRecord | null>;
    },
    async create(input) {
      return prisma.user.create({ data: input }) as Promise<UserRecord>;
    },
  };
}
