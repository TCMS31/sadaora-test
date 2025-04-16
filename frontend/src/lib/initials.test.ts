import { describe, expect, it } from 'vitest';
import { avatarGradient, initialsOf } from './initials';

describe('initialsOf', () => {
  it('uses the first and last name', () => {
    expect(initialsOf('Amara Okonkwo')).toBe('AO');
    expect(initialsOf('Priya Devi Raghunathan')).toBe('PR');
  });

  it('falls back to the first two characters of a single name', () => {
    expect(initialsOf('Prince')).toBe('PR');
  });

  it('survives whitespace-only and empty input', () => {
    expect(initialsOf('   ')).toBe('?');
    expect(initialsOf('')).toBe('?');
  });
});

describe('avatarGradient', () => {
  it('is deterministic for the same name', () => {
    expect(avatarGradient('Amara Okonkwo')).toBe(avatarGradient('Amara Okonkwo'));
  });

  it('always returns a class from the palette', () => {
    expect(avatarGradient('Theo Lindqvist')).toMatch(/^from-\S+ to-\S+$/);
  });
});
