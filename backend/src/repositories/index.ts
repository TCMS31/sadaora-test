import { config } from '../config/env';
import { logger } from '../lib/logger';
import { createMemoryDataStore } from './memory';
import { prisma } from './prisma/client';
import { createPrismaLikeRepository } from './prisma/like.repository';
import { createPrismaProfileRepository } from './prisma/profile.repository';
import { createPrismaUserRepository } from './prisma/user.repository';
import { DataStore } from './types';

/**
 * Driver registry. Adding a storage backend means adding one entry here and
 * one folder implementing `DataStore` — no service or controller changes.
 */
const drivers: Record<string, () => DataStore> = {
  prisma: () => ({
    users: createPrismaUserRepository(prisma),
    profiles: createPrismaProfileRepository(prisma),
    likes: createPrismaLikeRepository(prisma),
    disconnect: () => prisma.$disconnect(),
  }),
  memory: () => createMemoryDataStore(),
};

export function createDataStore(name = config.dataDriver): DataStore {
  const factory = drivers[name];
  if (!factory) {
    throw new Error(`Unknown DATA_DRIVER "${name}". Available: ${Object.keys(drivers).join(', ')}`);
  }
  logger.info('Data store initialised', { driver: name });
  return factory();
}

export * from './types';
