import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { API_URL, MY_PROFILE } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import ProfilePage from './ProfilePage';

function notFound() {
  return http.get(`${API_URL}/profile/me`, () =>
    HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } }, { status: 404 })
  );
}

describe('profile page', () => {
  it('loads the existing profile into the form', async () => {
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByDisplayValue('Jordan Reyes')).toBeInTheDocument();
    expect(screen.getByLabelText(/interests/i)).toHaveValue('developer tools, typescript');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('treats a 404 as "no profile yet", not as an error', async () => {
    server.use(notFound());
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByRole('button', { name: /publish profile/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // Nothing to delete yet, so the destructive action is not offered.
    expect(screen.queryByRole('button', { name: /delete profile/i })).not.toBeInTheDocument();
  });

  it('shows a real error state when the profile request genuinely fails', async () => {
    server.use(
      http.get(`${API_URL}/profile/me`, () =>
        HttpResponse.json({ error: { message: 'Something went wrong' } }, { status: 500 })
      )
    );
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load this/i);
  });

  it('confirms the save and refetches the profile so the form is not stale', async () => {
    // Regression: the original invalidated no cache tags, so after saving the
    // form kept showing the values loaded before the save.
    let saved = { ...MY_PROFILE };
    server.use(
      http.get(`${API_URL}/profile/me`, () => HttpResponse.json(saved)),
      http.post(`${API_URL}/profile`, async ({ request }) => {
        const form = await request.formData();
        saved = { ...saved, name: String(form.get('name')) };
        return HttpResponse.json(saved);
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    const nameInput = await screen.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Jordan M. Reyes');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText(/profile saved/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveValue('Jordan M. Reyes'));
  });

  it('renders server-side validation against the right fields', async () => {
    server.use(
      http.post(`${API_URL}/profile`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'BAD_REQUEST',
              message: 'Validation failed',
              details: { headline: 'Headline is required' },
            },
          },
          { status: 400 }
        )
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByDisplayValue('Jordan Reyes');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Headline is required')).toBeInTheDocument();
    expect(screen.getByLabelText(/headline/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('explains an over-sized upload instead of failing silently', async () => {
    server.use(
      http.post(`${API_URL}/profile`, () =>
        HttpResponse.json(
          { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Image exceeds the 2048 KB limit' } },
          { status: 413 }
        )
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByDisplayValue('Jordan Reyes');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/exceeds the 2048 KB limit/);
  });

  it('asks for confirmation before deleting and can be cancelled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByDisplayValue('Jordan Reyes');

    await user.click(screen.getByRole('button', { name: /delete profile/i }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent(/delete your profile\?/i);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(screen.getByDisplayValue('Jordan Reyes')).toBeInTheDocument();
  });

  it('closes the confirmation dialog on Escape', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByDisplayValue('Jordan Reyes');

    await user.click(screen.getByRole('button', { name: /delete profile/i }));
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('clears the form after a confirmed delete', async () => {
    let exists = true;
    server.use(
      http.get(`${API_URL}/profile/me`, () =>
        exists
          ? HttpResponse.json(MY_PROFILE)
          : HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } }, { status: 404 })
      ),
      http.delete(`${API_URL}/profile`, () => {
        exists = false;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByDisplayValue('Jordan Reyes');

    await user.click(screen.getByRole('button', { name: /delete profile/i }));
    await user.click(await screen.findByRole('button', { name: /yes, delete it/i }));

    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveValue(''));
    expect(await screen.findByRole('button', { name: /publish profile/i })).toBeInTheDocument();
  });
});
