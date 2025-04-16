import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { authStorage } from '../../lib/auth-storage';
import { API_URL } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

async function fillAndSubmit(email: string, password: string): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /log in|sign up/i }));
}

describe('login', () => {
  it('stores the token and navigates on success', async () => {
    renderWithProviders(<LoginPage />);
    await fillAndSubmit('ada@example.com', 'correct horse battery');

    await waitFor(() => expect(authStorage.get()).toBe('test-token'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
  });

  it('shows the server error and does NOT navigate when the password is wrong', async () => {
    // Regression: the original awaited the raw RTK Query result, so a failed
    // login fell through to `localStorage.setItem(...)` and `navigate(...)`.
    mockNavigate.mockClear();
    renderWithProviders(<LoginPage />);
    await fillAndSubmit('ada@example.com', 'wrong password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(authStorage.get()).toBeNull();
  });

  it('never stores the literal string "undefined" as a token', async () => {
    mockNavigate.mockClear();
    server.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Nope' } }, { status: 401 })
      )
    );
    renderWithProviders(<LoginPage />);
    await fillAndSubmit('ada@example.com', 'whatever');

    await screen.findByRole('alert');
    expect(authStorage.get()).not.toBe('undefined');
  });

  it('reports an unreachable API rather than failing silently', async () => {
    server.use(http.post(`${API_URL}/auth/login`, () => HttpResponse.error()));
    renderWithProviders(<LoginPage />);
    await fillAndSubmit('ada@example.com', 'correct horse battery');

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not reach the server/);
  });
});

describe('signup', () => {
  it('surfaces field-level validation messages next to the inputs', async () => {
    server.use(
      http.post(`${API_URL}/auth/signup`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'BAD_REQUEST',
              message: 'Validation failed',
              details: { password: 'Password must be between 8 and 128 characters' },
            },
          },
          { status: 400 }
        )
      )
    );

    renderWithProviders(<SignupPage />);
    await fillAndSubmit('ada@example.com', 'short');

    expect(await screen.findByText(/between 8 and 128/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-invalid', 'true');
  });
});
