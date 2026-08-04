import { Note } from '../types/Note';
import { calculateStreak } from './streak';

export interface JournalStats {
  totalNotes: number;
  totalWords: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCount: number;
  topMood: { emoji: string; count: number } | null;
}

function toDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function calculateLongestStreak(notes: Note[]): number {
  if (notes.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(notes.map((n) => new Date(n.createdAt).setHours(0, 0, 0, 0)))
  ).sort((a, b) => a - b);

  let longest = 1;
  let current = 1;
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i] - uniqueDays[i - 1] === oneDayMs) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function computeStats(notes: Note[]): JournalStats {
  const totalWords = notes.reduce((sum, note) => {
    const trimmed = note.text.trim();
    return sum + (trimmed ? trimmed.split(/\s+/).length : 0);
  }, 0);

  const moodCounts = new Map<string, number>();
  for (const note of notes) {
    if (note.mood) {
      moodCounts.set(note.mood, (moodCounts.get(note.mood) ?? 0) + 1);
    }
  }
  let topMood: { emoji: string; count: number } | null = null;
  for (const [emoji, count] of moodCounts) {
    if (!topMood || count > topMood.count) {
      topMood = { emoji, count };
    }
  }

  return {
    totalNotes: notes.length,
    totalWords,
    currentStreak: calculateStreak(notes),
    longestStreak: calculateLongestStreak(notes),
    favoriteCount: notes.filter((n) => n.isFavorite).length,
    topMood,
  };
}
