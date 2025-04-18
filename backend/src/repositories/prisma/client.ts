import { PrismaClient } from '@prisma/client';

/**
 * One client per process. Prisma manages its own connection pool; constructing
 * a `new PrismaClient()` per module (as the original controllers did) opens a
 * separate pool for each import and exhausts Postgres connections under load.
 */
export const prisma = new PrismaClient();
