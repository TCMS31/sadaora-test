import { toAbsoluteUrl, toFeedProfileDto, toPageMeta, toProfileDto } from '../../src/dto/profile.dto';
import { FeedRecord, ProfileRecord } from '../../src/repositories/types';

const record: ProfileRecord = {
  id: 'p1',
  userId: 'u1',
  name: 'Ada',
  headline: 'Engineer',
  bio: 'Bio',
  photoUrl: '/uploads/ada.png',
  interests: ['maths'],
  createdAt: new Date('2025-01-02T03:04:05.000Z'),
};

describe('toAbsoluteUrl', () => {
  it('prefixes a stored relative path with the request origin', () => {
    expect(toAbsoluteUrl('http://localhost:3001', '/uploads/a.png')).toBe(
      'http://localhost:3001/uploads/a.png'
    );
  });

  it('does not double-prefix a value that is already absolute', () => {
    expect(toAbsoluteUrl('http://localhost:3001', 'https://cdn.example.com/a.png')).toBe(
      'https://cdn.example.com/a.png'
    );
  });

  it('passes null through', () => {
    expect(toAbsoluteUrl('http://localhost:3001', null)).toBeNull();
  });
});

describe('toProfileDto', () => {
  it('serialises createdAt as ISO-8601 and never exposes userId', () => {
    const dto = toProfileDto(record, 'http://localhost:3001');
    expect(dto.createdAt).toBe('2025-01-02T03:04:05.000Z');
    expect(dto).not.toHaveProperty('userId');
  });
});

describe('toFeedProfileDto', () => {
  it('exposes counts but not the raw like rows or the owning user id', () => {
    const feedRecord: FeedRecord = { ...record, likeCount: 3, likedByViewer: true };
    const dto = toFeedProfileDto(feedRecord, 'http://localhost:3001');

    expect(dto).toMatchObject({ likeCount: 3, likedByCurrentUser: true });
    expect(dto).not.toHaveProperty('likes');
    expect(dto).not.toHaveProperty('userId');
  });
});

describe('toPageMeta', () => {
  it('reports hasMore from the total rather than from the page length', () => {
    expect(toPageMeta(1, 5, 12)).toEqual({
      page: 1,
      limit: 5,
      total: 12,
      totalPages: 3,
      hasMore: true,
    });
    expect(toPageMeta(3, 5, 12).hasMore).toBe(false);
  });

  it('handles an empty result set', () => {
    expect(toPageMeta(1, 5, 0)).toEqual({
      page: 1,
      limit: 5,
      total: 0,
      totalPages: 0,
      hasMore: false,
    });
  });
});
