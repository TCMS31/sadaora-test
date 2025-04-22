import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { API_URL, makeProfile, MY_PROFILE } from './fixtures';

/**
 * Default happy-path handlers. Individual tests override with
 * `server.use(...)`. Every request in the suite is served from here, so no
 * test touches a real API.
 */
export const handlers = [
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.password !== 'correct horse battery') {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }
    return HttpResponse.json({ token: 'test-token', user: { id: 'me-1', email: body.email } });
  }),

  http.post(`${API_URL}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as { email: string };
    return HttpResponse.json(
      { token: 'test-token', user: { id: 'me-1', email: body.email } },
      { status: 201 }
    );
  }),

  http.get(`${API_URL}/profile/me`, () => HttpResponse.json(MY_PROFILE)),

  http.post(`${API_URL}/profile`, () => HttpResponse.json(MY_PROFILE)),

  http.delete(`${API_URL}/profile`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${API_URL}/profile/feed`, ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
    const all = [
      makeProfile({ id: 'p1', name: 'Amara Okonkwo', likeCount: 8 }),
      makeProfile({ id: 'p2', name: 'Theo Lindqvist', likeCount: 2, likedByCurrentUser: true }),
      makeProfile({ id: 'p3', name: 'Priya Raghunathan', likeCount: 5 }),
    ];
    const limit = 2;
    const slice = all.slice((page - 1) * limit, page * limit);
    return HttpResponse.json({
      data: slice,
      meta: {
        page,
        limit,
        total: all.length,
        totalPages: Math.ceil(all.length / limit),
        hasMore: page * limit < all.length,
      },
    });
  }),

  http.post(`${API_URL}/profile/:id/like`, () => HttpResponse.json({ liked: true, likeCount: 9 })),

  http.delete(`${API_URL}/profile/:id/like`, () =>
    HttpResponse.json({ liked: false, likeCount: 1 })
  ),
];

export const server = setupServer(...handlers);
