import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/States';
import { errorMessage } from '../../lib/api-error';
import {
  useGetFeedQuery,
  useLikeProfileMutation,
  useUnlikeProfileMutation,
} from '../../services/api';
import type { FeedProfile } from '../../services/types';
import { ProfileCard } from './ProfileCard';

const PAGE_SIZE = 5;

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetFeedQuery({
    page,
    limit: PAGE_SIZE,
  });
  const [like] = useLikeProfileMutation();
  const [unlike] = useUnlikeProfileMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleToggleLike = async (profile: FeedProfile): Promise<void> => {
    setPendingId(profile.id);
    const mutate = profile.likedByCurrentUser ? unlike : like;
    // The optimistic patch and its rollback live in the API slice, so a
    // failure here has already been undone by the time we land in `finally`.
    await mutate(profile.id).unwrap().catch(() => undefined);
    setPendingId(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </Layout>
    );
  }

  if (isError || !data) {
    return (
      <Layout>
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      </Layout>
    );
  }

  if (data.data.length === 0) {
    return (
      <Layout>
        <EmptyState
          title="No other members yet"
          description="Once other people publish a profile they will show up here. Yours is not listed in your own feed."
        />
      </Layout>
    );
  }

  return (
    <Layout total={data.meta.total}>
      <div className="space-y-4">
        {data.data.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onToggleLike={handleToggleLike}
            pending={pendingId === profile.id}
          />
        ))}
      </div>

      {data.meta.hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" loading={isFetching} onClick={() => setPage(data.meta.page + 1)}>
            Load more
          </Button>
        </div>
      )}

      {!data.meta.hasMore && (
        <p className="mt-6 text-center text-sm text-ink-muted">
          You have reached the end of the feed.
        </p>
      )}
    </Layout>
  );
}

function Layout({ children, total }: { children: React.ReactNode; total?: number }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Member feed</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {total === undefined
            ? 'Public profiles from every other member.'
            : `${total} public ${total === 1 ? 'profile' : 'profiles'} from other members.`}
        </p>
      </div>
      {children}
    </main>
  );
}
