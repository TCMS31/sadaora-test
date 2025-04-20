import { Avatar } from '../../components/ui/Avatar';
import type { FeedProfile } from '../../services/types';

interface ProfileCardProps {
  profile: FeedProfile;
  onToggleLike: (profile: FeedProfile) => void;
  pending: boolean;
}

export function ProfileCard({ profile, onToggleLike, pending }: ProfileCardProps) {
  const { likedByCurrentUser: liked, likeCount } = profile;

  return (
    <article className="rounded-xl border border-line bg-surface p-5 transition-shadow hover:shadow-sm">
      <div className="flex gap-4">
        <Avatar name={profile.name} photoUrl={profile.photoUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-ink">{profile.name}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">{profile.headline}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink/90">{profile.bio}</p>

          {profile.interests.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => (
                <li
                  key={interest}
                  className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted"
                >
                  {interest}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-t border-line pt-3">
        <button
          type="button"
          onClick={() => onToggleLike(profile)}
          disabled={pending}
          aria-pressed={liked}
          aria-label={`${liked ? 'Unlike' : 'Like'} ${profile.name}'s profile`}
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-canvas disabled:opacity-60"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={`h-5 w-5 transition-colors ${liked ? 'fill-heart stroke-heart' : 'fill-none stroke-current'}`}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" />
          </svg>
          <span className="tabular-nums">{likeCount}</span>
          <span className="sr-only">{likeCount === 1 ? 'like' : 'likes'}</span>
        </button>
      </div>
    </article>
  );
}
