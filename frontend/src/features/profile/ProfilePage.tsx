import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Field, inputClass } from '../../components/ui/Field';
import { Callout, ErrorState } from '../../components/ui/States';
import { errorMessage, fieldErrors } from '../../lib/api-error';
import {
  useDeleteProfileMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '../../services/api';
import { ConfirmDialog } from './ConfirmDialog';

const EMPTY_FORM = { name: '', headline: '', bio: '', interests: '' };

export default function ProfilePage() {
  const { data, isLoading, isError, error, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // A 404 here is the expected state for a member who has not written a
  // profile yet, not a failure — only anything else is an error.
  const isMissingProfile =
    isError && 'status' in (error ?? {}) && (error as { status: unknown }).status === 404;

  // RTK Query keeps the last successful value in `data` when a refetch fails,
  // so after a delete the stale profile would otherwise still drive the UI.
  const profile = isMissingProfile ? undefined : data;

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        interests: profile.interests.join(', '),
      });
    }
  }, [profile]);

  const previewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile]
  );

  useEffect(() => () => {
    // Object URLs are retained until revoked; the original created a new one
    // on every render of the form and never released any of them.
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const update = (patch: Partial<typeof EMPTY_FORM>): void => {
    setForm((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSaveError(null);
    setFields({});

    const body = new FormData();
    body.append('name', form.name);
    body.append('headline', form.headline);
    body.append('bio', form.bio);
    body.append('interests', form.interests);
    if (photoFile) body.append('photo', photoFile);

    try {
      await updateProfile(body).unwrap();
      setPhotoFile(null);
      setSaved(true);
    } catch (caught) {
      setFields(fieldErrors(caught));
      setSaveError(errorMessage(caught, 'Could not save your profile'));
    }
  };

  const handleDelete = async (): Promise<void> => {
    setConfirmOpen(false);
    try {
      await deleteProfile().unwrap();
      setForm(EMPTY_FORM);
      setPhotoFile(null);
      setSaved(false);
    } catch (caught) {
      setSaveError(errorMessage(caught, 'Could not delete your profile'));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div aria-hidden="true" className="space-y-4">
          <div className="h-24 w-24 animate-pulse rounded-full bg-line" />
          <div className="h-10 animate-pulse rounded-lg bg-line" />
          <div className="h-10 animate-pulse rounded-lg bg-line" />
          <div className="h-28 animate-pulse rounded-lg bg-line" />
        </div>
      </Layout>
    );
  }

  if (isError && !isMissingProfile) {
    return (
      <Layout>
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      </Layout>
    );
  }

  return (
    <Layout
      subtitle={
        profile ? 'This is how other members see you.' : 'Publish a profile to appear in the feed.'
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {saveError && <Callout tone="error">{saveError}</Callout>}
        {saved && <Callout tone="success">Profile saved.</Callout>}

        <div className="flex items-center gap-5">
          <Avatar name={form.name || 'New member'} photoUrl={previewUrl ?? profile?.photoUrl} size="lg" />
          <div>
            <label
              htmlFor="photo"
              className="inline-flex cursor-pointer items-center rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas"
            >
              {profile?.photoUrl || photoFile ? 'Change photo' : 'Upload a photo'}
            </label>
            <input
              id="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                setPhotoFile(event.target.files?.[0] ?? null);
                setSaved(false);
              }}
            />
            <p className="mt-2 text-xs text-ink-muted">PNG, JPEG, WebP or GIF, up to 2 MB.</p>
          </div>
        </div>

        <Field label="Name" error={fields.name}>
          {(props) => (
            <input
              {...props}
              className={inputClass}
              placeholder="Your full name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          )}
        </Field>

        <Field label="Headline" error={fields.headline}>
          {(props) => (
            <input
              {...props}
              className={inputClass}
              placeholder="What you do, in one line"
              value={form.headline}
              onChange={(event) => update({ headline: event.target.value })}
            />
          )}
        </Field>

        <Field label="Bio" error={fields.bio}>
          {(props) => (
            <textarea
              {...props}
              rows={5}
              className={`${inputClass} resize-y`}
              placeholder="A short introduction"
              value={form.bio}
              onChange={(event) => update({ bio: event.target.value })}
            />
          )}
        </Field>

        <Field label="Interests" error={fields.interests} hint="Comma separated, for example: typescript, climbing">
          {(props) => (
            <input
              {...props}
              className={inputClass}
              placeholder="typescript, climbing"
              value={form.interests}
              onChange={(event) => update({ interests: event.target.value })}
            />
          )}
        </Field>

        <div className="flex items-center gap-3 border-t border-line pt-5">
          <Button type="submit" loading={isSaving}>
            {profile ? 'Save changes' : 'Publish profile'}
          </Button>
          {profile && (
            <Button variant="danger" onClick={() => setConfirmOpen(true)} loading={isDeleting}>
              Delete profile
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your profile?"
        description="Your profile and the likes it has received will be removed. Your account stays, and you can publish a new profile at any time."
        confirmLabel="Yes, delete it"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
}

function Layout({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Your profile</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">{children}</div>
    </main>
  );
}
