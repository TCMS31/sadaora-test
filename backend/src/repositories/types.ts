/**
 * Persistence contracts.
 *
 * Services depend on these interfaces, never on Prisma. That keeps the
 * dependency arrow pointing inward (http -> service -> repository interface)
 * and gives the project a real extension seam: swapping the storage engine is
 * adding one folder under `repositories/`, not editing business logic.
 *
 * Two implementations ship today:
 *   - `prisma/`  PostgreSQL, the production path.
 *   - `memory/`  in-process, used by the integration tests and by the seeded
 *                demo server (`DATA_DRIVER=memory`).
 */

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
}

export interface ProfileRecord {
  id: string;
  userId: string;
  name: string;
  headline: string;
  bio: string;
  photoUrl: string | null;
  interests: string[];
  createdAt: Date;
}

export interface ProfileInput {
  name: string;
  headline: string;
  bio: string;
  interests: string[];
  photoUrl?: string;
}

export interface FeedRecord extends ProfileRecord {
  likeCount: number;
  likedByViewer: boolean;
}

export interface FeedQuery {
  viewerId: string;
  skip: number;
  take: number;
}

export interface FeedPage {
  items: FeedRecord[];
  total: number;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: { email: string; passwordHash: string }): Promise<UserRecord>;
}

export interface ProfileRepository {
  findByUserId(userId: string): Promise<ProfileRecord | null>;
  findById(id: string): Promise<ProfileRecord | null>;
  upsertForUser(userId: string, input: ProfileInput): Promise<ProfileRecord>;
  deleteByUserId(userId: string): Promise<boolean>;
  listFeed(query: FeedQuery): Promise<FeedPage>;
}

export interface LikeRepository {
  /** Returns false when the viewer had already liked this profile. */
  add(profileId: string, likedById: string): Promise<boolean>;
  /** Returns false when there was no like to remove. */
  remove(profileId: string, likedById: string): Promise<boolean>;
  countForProfile(profileId: string): Promise<number>;
}

export interface DataStore {
  users: UserRepository;
  profiles: ProfileRepository;
  likes: LikeRepository;
  /** Optional lifecycle hook; the Prisma store closes its connection pool. */
  disconnect?(): Promise<void>;
}
