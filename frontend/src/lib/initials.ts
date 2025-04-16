/** "Amara Okonkwo" -> "AO". Falls back to the first character available. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Earthy, dark enough for white initials to clear WCAG AA.
const PALETTE = [
  'from-emerald-700 to-teal-800',
  'from-amber-700 to-orange-800',
  'from-rose-700 to-red-800',
  'from-lime-700 to-green-800',
  'from-stone-600 to-stone-800',
  'from-cyan-700 to-teal-900',
];

/** Deterministic colour so a member keeps the same avatar between renders. */
export function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
