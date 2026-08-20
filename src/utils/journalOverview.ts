import { Note } from '../types/Note';

export interface TagCount {
  tag: string;
  count: number;
}

export interface MoodCount {
  emoji: string;
  count: number;
}

export interface WeekdayCount {
  weekday: string;
  shortLabel: string;
  count: number;
}

const WEEKDAY_LABELS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const WEEKDAY_SHORT_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export interface JournalOverview {
  firstEntryDate: string | null;
  daysSinceFirstEntry: number;
  topTags: TagCount[];
  moodBreakdown: MoodCount[];
  weekdayBreakdown: WeekdayCount[];
  mostActiveWeekday: string | null;
  longestNoteWordCount: number;
  photoCount: number;
  audioCount: number;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function computeJournalOverview(notes: Note[]): JournalOverview {
  if (notes.length === 0) {
    return {
      firstEntryDate: null,
      daysSinceFirstEntry: 0,
      topTags: [],
      moodBreakdown: [],
      weekdayBreakdown: [],
      mostActiveWeekday: null,
      longestNoteWordCount: 0,
      photoCount: 0,
      audioCount: 0,
    };
  }

  const sortedByDate = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const firstEntryDate = sortedByDate[0].createdAt;
  const daysSinceFirstEntry = Math.max(
    1,
    Math.ceil((Date.now() - new Date(firstEntryDate).getTime()) / (24 * 60 * 60 * 1000))
  );

  const tagCounts = new Map<string, number>();
  const moodCounts = new Map<string, number>();
  const weekdayCounts = new Map<number, number>();
  let longestNoteWordCount = 0;
  let photoCount = 0;
  let audioCount = 0;

  for (const note of notes) {
    for (const tag of note.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    if (note.mood) {
      moodCounts.set(note.mood, (moodCounts.get(note.mood) ?? 0) + 1);
    }
    const weekday = new Date(note.createdAt).getDay();
    weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
    longestNoteWordCount = Math.max(longestNoteWordCount, wordCount(note.text));
    if (note.photoUri) photoCount += 1;
    if (note.audioUri) audioCount += 1;
  }

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const moodBreakdown = Array.from(moodCounts.entries())
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);

  const weekdayBreakdown = WEEKDAY_LABELS.map((weekday, index) => ({
    weekday,
    shortLabel: WEEKDAY_SHORT_LABELS[index],
    count: weekdayCounts.get(index) ?? 0,
  }));

  let mostActiveWeekday: string | null = null;
  let mostActiveCount = 0;
  for (const entry of weekdayBreakdown) {
    if (entry.count > mostActiveCount) {
      mostActiveCount = entry.count;
      mostActiveWeekday = entry.weekday;
    }
  }

  return {
    firstEntryDate,
    daysSinceFirstEntry,
    topTags,
    moodBreakdown,
    weekdayBreakdown,
    mostActiveWeekday,
    longestNoteWordCount,
    photoCount,
    audioCount,
  };
}
