/**
 * The Prisma driver is exercised against a fully mocked PrismaClient: these
 * assert the queries the repository builds, so the production path is covered
 * without a PostgreSQL server. No network or database access occurs.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { createPrismaLikeRepository } from '../../src/repositories/prisma/like.repository';
import { createPrismaProfileRepository } from '../../src/repositories/prisma/profile.repository';

let prisma: DeepMockProxy<PrismaClient>;

beforeEach(() => {
  prisma = mockDeep<PrismaClient>();
  // `$transaction([...])` resolves the array of query promises it is handed.
  (prisma.$transaction as unknown as jest.Mock).mockImplementation((ops: unknown[]) =>
    Promise.all(ops)
  );
});

describe('prisma like repository', () => {
  it('reports a duplicate like as false instead of surfacing P2002', async () => {
    const repo = createPrismaLikeRepository(prisma);
    prisma.like.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.6.0',
      })
    );

    await expect(repo.add('p1', 'u1')).resolves.toBe(false);
  });

  it('rethrows any error that is not a unique-constraint violation', async () => {
    const repo = createPrismaLikeRepository(prisma);
    prisma.like.create.mockRejectedValueOnce(new Error('connection reset'));

    await expect(repo.add('p1', 'u1')).rejects.toThrow('connection reset');
  });

  it('reports removing a like that was not there as false', async () => {
    const repo = createPrismaLikeRepository(prisma);
    prisma.like.deleteMany.mockResolvedValueOnce({ count: 0 });

    await expect(repo.remove('p1', 'u1')).resolves.toBe(false);
  });
});

describe('prisma profile repository', () => {
  it('aggregates like counts in SQL rather than loading every like row', async () => {
    const repo = createPrismaProfileRepository(prisma);
    prisma.profile.findMany.mockResolvedValueOnce([] as never);
    prisma.profile.count.mockResolvedValueOnce(0);

    await repo.listFeed({ viewerId: 'u1', skip: 5, take: 5 });

    const args = prisma.profile.findMany.mock.calls[0][0]!;
    expect(args.include).toMatchObject({ _count: { select: { likes: true } } });
    // The viewer's own like is one bounded sub-select, not the whole list.
    expect(args.include).toMatchObject({ likes: { where: { likedById: 'u1' }, take: 1 } });
    expect(args).toMatchObject({ skip: 5, take: 5, where: { userId: { not: 'u1' } } });
  });

  it('maps _count and the viewer sub-select onto the domain record', async () => {
    const repo = createPrismaProfileRepository(prisma);
    prisma.profile.findMany.mockResolvedValueOnce([
      {
        id: 'p1',
        userId: 'u2',
        name: 'Ada',
        headline: 'Engineer',
        bio: 'Bio',
        photoUrl: null,
        interests: ['maths'],
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        _count: { likes: 7 },
        likes: [{ id: 'l1' }],
      },
    ] as never);
    prisma.profile.count.mockResolvedValueOnce(1);

    const page = await repo.listFeed({ viewerId: 'u1', skip: 0, take: 5 });

    expect(page.total).toBe(1);
    expect(page.items[0]).toMatchObject({ likeCount: 7, likedByViewer: true });
  });

  it('deletes dependent likes in the same transaction as the profile', async () => {
    const repo = createPrismaProfileRepository(prisma);
    prisma.profile.findUnique.mockResolvedValueOnce({ id: 'p1' } as never);

    await expect(repo.deleteByUserId('u1')).resolves.toBe(true);

    expect(prisma.like.deleteMany).toHaveBeenCalledWith({ where: { profileId: 'p1' } });
    expect(prisma.profile.delete).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('reports a missing profile as false without issuing a delete', async () => {
    const repo = createPrismaProfileRepository(prisma);
    prisma.profile.findUnique.mockResolvedValueOnce(null);

    await expect(repo.deleteByUserId('u1')).resolves.toBe(false);
    expect(prisma.profile.delete).not.toHaveBeenCalled();
  });

  it('upserts instead of branching on a prior read', async () => {
    const repo = createPrismaProfileRepository(prisma);
    prisma.profile.upsert.mockResolvedValueOnce({ id: 'p1' } as never);

    await repo.upsertForUser('u1', {
      name: 'Ada',
      headline: 'Engineer',
      bio: 'Bio',
      interests: ['maths'],
    });

    const args = prisma.profile.upsert.mock.calls[0][0]!;
    expect(args.where).toEqual({ userId: 'u1' });
    // No photo in the input, so the update must not clear the stored one.
    expect(args.update).not.toHaveProperty('photoUrl');
  });
});
