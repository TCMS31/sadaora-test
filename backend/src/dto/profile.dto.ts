import { FeedRecord, ProfileRecord } from '../repositories/types';

export interface ProfileDto {
  id: string;
  name: string;
  headline: string;
  bio: string;
  photoUrl: string | null;
  interests: string[];
  createdAt: string;
}

export interface FeedProfileDto extends ProfileDto {
  likeCount: number;
  likedByCurrentUser: boolean;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Photo paths are stored relative (`/uploads/x.png`) and made absolute at the
 * edge. The original code did this in one handler and not the other, so the
 * same profile came back with two different `photoUrl` shapes depending on
 * which endpoint you asked — the client then rendered a broken image after a
 * save. Serialisation lives here so every endpoint agrees.
 */
export function toAbsoluteUrl(baseUrl: string, storedPath: string | null): string | null {
  if (!storedPath) return null;
  if (/^https?:\/\//i.test(storedPath)) return storedPath;
  return `${baseUrl.replace(/\/$/, '')}${storedPath}`;
}

export function toProfileDto(profile: ProfileRecord, baseUrl: string): ProfileDto {
  return {
    id: profile.id,
    name: profile.name,
    headline: profile.headline,
    bio: profile.bio,
    photoUrl: toAbsoluteUrl(baseUrl, profile.photoUrl),
    interests: profile.interests,
    createdAt: profile.createdAt.toISOString(),
  };
}

/** Note: no `userId` and no raw `likes` array — the feed must not leak which
 *  user accounts liked whom, which the original `include: { likes: true }`
 *  response did for every viewer. */
export function toFeedProfileDto(record: FeedRecord, baseUrl: string): FeedProfileDto {
  return {
    ...toProfileDto(record, baseUrl),
    likeCount: record.likeCount,
    likedByCurrentUser: record.likedByViewer,
  };
}

export function toPageMeta(page: number, limit: number, total: number): PageMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return { page, limit, total, totalPages, hasMore: page < totalPages };
}
