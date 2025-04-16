export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Profile {
  id: string;
  name: string;
  headline: string;
  bio: string;
  photoUrl: string | null;
  interests: string[];
  createdAt: string;
}

export interface FeedProfile extends Profile {
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

export interface FeedResponse {
  data: FeedProfile[];
  meta: PageMeta;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}
