import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { API_URL } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import FeedPage from './FeedPage';

describe('feed page', () => {
  it('renders the first page of profiles with their like counts', async () => {
    renderWithProviders(<FeedPage />);

    expect(await screen.findByText('Amara Okonkwo')).toBeInTheDocument();
    expect(screen.getByText('Theo Lindqvist')).toBeInTheDocument();
    expect(screen.getByText('3 public profiles from other members.')).toBeInTheDocument();
  });

  it('appends the next page without duplicating any row', async () => {
    // Regression: the original kept a parallel copy of the list in component
    // state and appended on every `data` change, so rows repeated.
    const user = userEvent.setup();
    renderWithProviders(<FeedPage />);

    await screen.findByText('Amara Okonkwo');
    await user.click(screen.getByRole('button', { name: /load more/i }));

    await screen.findByText('Priya Raghunathan');
    expect(screen.getAllByText('Amara Okonkwo')).toHaveLength(1);
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('hides "Load more" and says so once the feed is exhausted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedPage />);

    await screen.findByText('Amara Okonkwo');
    await user.click(screen.getByRole('button', { name: /load more/i }));

    await screen.findByText(/reached the end of the feed/i);
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  it('applies an optimistic like then reconciles with the server count', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedPage />);

    await screen.findByText('Amara Okonkwo');
    const card = screen.getAllByRole('article')[0];
    const likeButton = within(card).getByRole('button', { name: /like amara/i });

    expect(likeButton).toHaveAttribute('aria-pressed', 'false');
    await user.click(likeButton);

    // The handler answers 9, not the optimistic 8 + 1 = 9 by coincidence:
    // the point is the rendered value comes from the response.
    await waitFor(() => expect(within(card).getByText('9')).toBeInTheDocument());
    expect(within(card).getByRole('button', { name: /unlike amara/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('rolls the optimistic like back when the request fails', async () => {
    server.use(
      http.post(`${API_URL}/profile/:id/like`, () =>
        HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Nope' } }, { status: 403 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<FeedPage />);

    await screen.findByText('Amara Okonkwo');
    const card = screen.getAllByRole('article')[0];
    await user.click(within(card).getByRole('button', { name: /like amara/i }));

    await waitFor(() =>
      expect(within(card).getByRole('button', { name: /like amara/i })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    );
    expect(within(card).getByText('8')).toBeInTheDocument();
  });

  it('unlikes a profile the viewer had already liked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedPage />);

    await screen.findByText('Theo Lindqvist');
    const card = screen.getAllByRole('article')[1];
    await user.click(within(card).getByRole('button', { name: /unlike theo/i }));

    await waitFor(() => expect(within(card).getByText('1')).toBeInTheDocument());
  });

  it('shows an empty state rather than a blank page when there are no members', async () => {
    server.use(
      http.get(`${API_URL}/profile/feed`, () =>
        HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 5, total: 0, totalPages: 0, hasMore: false },
        })
      )
    );
    renderWithProviders(<FeedPage />);

    expect(await screen.findByText(/no other members yet/i)).toBeInTheDocument();
  });

  it('shows a retryable error state when the feed request fails', async () => {
    server.use(
      http.get(`${API_URL}/profile/feed`, () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
          { status: 500 }
        )
      )
    );
    renderWithProviders(<FeedPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load this/i);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
