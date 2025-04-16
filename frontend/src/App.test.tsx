import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { authStorage } from './lib/auth-storage';
import { renderWithProviders } from './test/render';
import Navbar from './components/Navbar';
import FeedPage from './features/feed/FeedPage';

describe('navbar', () => {
  it('offers log in and sign up to an anonymous visitor', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
  });

  it('offers the app navigation and log out to a signed-in member', () => {
    authStorage.set('test-token');
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: 'Feed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('clears the stored token on log out', async () => {
    authStorage.set('test-token');
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);

    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(authStorage.get()).toBeNull();
  });
});

describe('feed accessibility', () => {
  it('labels each like control with the member it acts on', async () => {
    renderWithProviders(<FeedPage />);
    await screen.findByText('Amara Okonkwo');

    expect(
      screen.getByRole('button', { name: "Like Amara Okonkwo's profile" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: "Unlike Theo Lindqvist's profile" })
    ).toBeInTheDocument();
  });

  it('gives members without a photo a labelled initials avatar', async () => {
    renderWithProviders(<FeedPage />);
    expect(await screen.findByLabelText("Amara Okonkwo's initials")).toHaveTextContent('AO');
  });
});
