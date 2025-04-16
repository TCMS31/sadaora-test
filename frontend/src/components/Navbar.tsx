import { NavLink, useNavigate } from 'react-router-dom';
import { authStorage } from '../lib/auth-storage';
import { api } from '../services/api';
import { useAppDispatch } from '../app/hooks';
import { Button } from './ui/Button';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-soft text-brand-strong' : 'text-ink-muted hover:bg-canvas hover:text-ink'
  }`;

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const signedIn = Boolean(authStorage.get());

  const handleLogout = (): void => {
    authStorage.clear();
    // Without this the next account to sign in sees the previous one's cached
    // feed and profile until something happens to invalidate them.
    dispatch(api.util.resetApiState());
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-ink">Sadaora</span>
          {signedIn && (
            <div className="flex items-center gap-1">
              <NavLink to="/" end className={linkClass}>
                Feed
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                My profile
              </NavLink>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button variant="ghost" onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink
                to="/signup"
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
              >
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
