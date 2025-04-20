import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Field, inputClass } from '../../components/ui/Field';
import { Callout } from '../../components/ui/States';
import { errorMessage, fieldErrors } from '../../lib/api-error';
import { authStorage } from '../../lib/auth-storage';
import type { AuthResponse, Credentials } from '../../services/types';

interface AuthFormProps {
  mode: 'login' | 'signup';
  submit: (credentials: Credentials) => { unwrap: () => Promise<AuthResponse> };
  isLoading: boolean;
}

const COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to see the member feed.',
    action: 'Log in',
    switchPrompt: 'Need an account?',
    switchTo: '/signup',
    switchLabel: 'Sign up',
    passwordHint: undefined as string | undefined,
  },
  signup: {
    title: 'Create your account',
    subtitle: 'One profile per member. You can fill it in next.',
    action: 'Sign up',
    switchPrompt: 'Already a member?',
    switchTo: '/login',
    switchLabel: 'Log in',
    passwordHint: 'At least 8 characters.',
  },
};

export function AuthForm({ mode, submit, isLoading }: AuthFormProps) {
  const copy = COPY[mode];
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    setFields({});

    try {
      // `.unwrap()` is what makes a failed request reject. The original
      // awaited the raw result, so a rejected login fell through to the
      // success path with `data` undefined.
      const result = await submit({ email, password }).unwrap();
      authStorage.set(result.token);
      navigate('/profile', { replace: true });
    } catch (error) {
      setFields(fieldErrors(error));
      setFormError(errorMessage(error, `${copy.action} failed`));
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{copy.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{copy.subtitle}</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {formError && <Callout tone="error">{formError}</Callout>}

          <Field label="Email" error={fields.email}>
            {(props) => (
              <input
                {...props}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </Field>

          <Field label="Password" error={fields.password} hint={copy.passwordHint}>
            {(props) => (
              <input
                {...props}
                type="password"
                name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                className={inputClass}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </Field>

          <Button type="submit" loading={isLoading} className="w-full">
            {copy.action}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-ink-muted">
        {copy.switchPrompt}{' '}
        <Link to={copy.switchTo} className="font-medium text-brand hover:text-brand-strong">
          {copy.switchLabel}
        </Link>
      </p>
    </main>
  );
}
