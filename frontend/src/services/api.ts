import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { isSessionExpired } from '../lib/api-error';
import { authStorage } from '../lib/auth-storage';
import type {
  AuthResponse,
  Credentials,
  FeedResponse,
  LikeResponse,
  Profile,
} from './types';

/**
 * The base URL is configuration, not a constant. The original hardcoded
 * `http://localhost:3001/api`, which made every build a development build.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    const token = authStorage.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Tokens expire. When the API rejects one, drop it and send the member back to
 * the login screen instead of leaving the app in a state where every request
 * fails silently.
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  storeApi,
  extraOptions
) => {
  const result = await rawBaseQuery(args, storeApi, extraOptions);
  const isAuthRequest = typeof args !== 'string' && String(args.url).startsWith('auth/');

  if (!isAuthRequest && isSessionExpired(result.error)) {
    authStorage.clear();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  tagTypes: ['Profile', 'Feed'],
  baseQuery,
  endpoints: (builder) => ({
    signup: builder.mutation<AuthResponse, Credentials>({
      query: (body) => ({ url: 'auth/signup', method: 'POST', body }),
      invalidatesTags: ['Profile', 'Feed'],
    }),

    login: builder.mutation<AuthResponse, Credentials>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
      invalidatesTags: ['Profile', 'Feed'],
    }),

    getProfile: builder.query<Profile, void>({
      query: () => 'profile/me',
      providesTags: ['Profile'],
    }),

    // The body is FormData because the request may carry a photo; RTK Query
    // passes it through untouched so the browser sets the multipart boundary.
    updateProfile: builder.mutation<Profile, FormData>({
      query: (body) => ({ url: 'profile', method: 'POST', body }),
      // Saving changes the name and headline shown in the feed, so both
      // caches are invalidated. The original invalidated nothing, leaving the
      // form showing a stale profile after a successful save.
      invalidatesTags: ['Profile', 'Feed'],
    }),

    deleteProfile: builder.mutation<void, void>({
      query: () => ({ url: 'profile', method: 'DELETE' }),
      invalidatesTags: ['Profile', 'Feed'],
    }),

    getFeed: builder.query<FeedResponse, { page: number; limit?: number }>({
      query: ({ page, limit = 5 }) => `profile/feed?page=${page}&limit=${limit}`,
      // One cache entry holds the whole paginated list. `merge` appends each
      // new page, so "Load more" no longer needs a parallel copy of the list
      // in component state — the source of the duplicate rows in the original.
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (existing, incoming) => {
        if (incoming.meta.page <= 1) return incoming;
        const seen = new Set(existing.data.map((profile) => profile.id));
        return {
          meta: incoming.meta,
          data: [...existing.data, ...incoming.data.filter((profile) => !seen.has(profile.id))],
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.page !== previousArg?.page,
      providesTags: ['Feed'],
    }),

    likeProfile: builder.mutation<LikeResponse, string>({
      query: (id) => ({ url: `profile/${id}/like`, method: 'POST' }),
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          api.util.updateQueryData('getFeed', { page: 1 }, (draft) => {
            const profile = draft.data.find((item) => item.id === id);
            if (profile && !profile.likedByCurrentUser) {
              profile.likedByCurrentUser = true;
              profile.likeCount += 1;
            }
          })
        );
        try {
          // Reconcile against the count the server actually holds rather than
          // trusting the optimistic guess.
          const { data } = await queryFulfilled;
          dispatch(
            api.util.updateQueryData('getFeed', { page: 1 }, (draft) => {
              const profile = draft.data.find((item) => item.id === id);
              if (profile) {
                profile.likeCount = data.likeCount;
                profile.likedByCurrentUser = data.liked;
              }
            })
          );
        } catch {
          patch.undo();
        }
      },
    }),

    unlikeProfile: builder.mutation<LikeResponse, string>({
      query: (id) => ({ url: `profile/${id}/like`, method: 'DELETE' }),
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          api.util.updateQueryData('getFeed', { page: 1 }, (draft) => {
            const profile = draft.data.find((item) => item.id === id);
            if (profile && profile.likedByCurrentUser) {
              profile.likedByCurrentUser = false;
              profile.likeCount = Math.max(0, profile.likeCount - 1);
            }
          })
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            api.util.updateQueryData('getFeed', { page: 1 }, (draft) => {
              const profile = draft.data.find((item) => item.id === id);
              if (profile) {
                profile.likeCount = data.likeCount;
                profile.likedByCurrentUser = data.liked;
              }
            })
          );
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  useGetFeedQuery,
  useLikeProfileMutation,
  useUnlikeProfileMutation,
} = api;
