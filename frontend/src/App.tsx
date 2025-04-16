import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { JSX } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import FeedPage from './features/feed/FeedPage';
import ProfilePage from './features/profile/ProfilePage';
import { authStorage } from './lib/auth-storage';

function RequireAuth({ children }: { children: JSX.Element }) {
  return authStorage.get() ? children : <Navigate to="/login" replace />;
}

/** Keeps a signed-in member off the login and signup screens. */
function RequireAnonymous({ children }: { children: JSX.Element }) {
  return authStorage.get() ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <FeedPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/login"
          element={
            <RequireAnonymous>
              <LoginPage />
            </RequireAnonymous>
          }
        />
        <Route
          path="/signup"
          element={
            <RequireAnonymous>
              <SignupPage />
            </RequireAnonymous>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
