import { avatarGradient, initialsOf } from '../../lib/initials';

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'md' | 'lg';
}

const SIZES = {
  md: 'h-12 w-12 text-sm',
  lg: 'h-24 w-24 text-xl',
};

/**
 * Members without a photo get a deterministic initials tile rather than a
 * broken image or a grey box, so a populated feed reads as intentional.
 */
export function Avatar({ name, photoUrl, size = 'md' }: AvatarProps) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${name}'s profile photo`}
        loading="lazy"
        className={`${SIZES[size]} shrink-0 rounded-full border border-line object-cover`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${name}'s initials`}
      className={`${SIZES[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(name)} font-semibold text-white`}
    >
      {initialsOf(name)}
    </span>
  );
}
