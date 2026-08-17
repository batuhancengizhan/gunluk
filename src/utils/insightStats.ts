import { Note } from '../types/Note';
import { MOOD_VALENCE } from '../constants/moods';

export const MIN_NOTES_FOR_INSIGHTS = 12;

export const WEEKDAY_NAMES = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];

export interface WeekdayStat {
  weekday: number;
  weekdayName: string;
  average: number;
  count: number;
}

export interface InsightStats {
  totalNotes: number;
  moodTaggedCount: number;
  weekdayStats: WeekdayStat[];
  bestWeekday: WeekdayStat | null;
  hardestWeekday: WeekdayStat | null;
  avgWordCountPositive: number | null;
  avgWordCountNegative: number | null;
  longestNoteWordCount: number;
  longestNoteMood: string | null;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

const MIN_NOTES_PER_WEEKDAY = 2;

export function computeInsightStats(notes: Note[]): InsightStats {
  const moodNotes = notes.filter((n) => n.mood && n.mood in MOOD_VALENCE);

  const weekdayBuckets = new Map<number, number[]>();
  for (const note of moodNotes) {
    const weekday = new Date(note.createdAt).getDay();
    const valence = MOOD_VALENCE[note.mood as string];
    if (!weekdayBuckets.has(weekday)) weekdayBuckets.set(weekday, []);
    weekdayBuckets.get(weekday)!.push(valence);
  }

  const weekdayStats: WeekdayStat[] = Array.from(weekdayBuckets.entries())
    .map(([weekday, values]) => ({
      weekday,
      weekdayName: WEEKDAY_NAMES[weekday],
      average: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
    }))
    .filter((stat) => stat.count >= MIN_NOTES_PER_WEEKDAY);

  const sortedByAverage = [...weekdayStats].sort((a, b) => b.average - a.average);
  const bestWeekday =
    sortedByAverage.length > 0 && sortedByAverage[0].average > 0 ? sortedByAverage[0] : null;
  const hardestCandidate = sortedByAverage[sortedByAverage.length - 1];
  const hardestWeekday = hardestCandidate && hardestCandidate.average < 0 ? hardestCandidate : null;

  const positiveWordCounts: number[] = [];
  const negativeWordCounts: number[] = [];
  let longestNoteWordCount = 0;
  let longestNoteMood: string | null = null;

  for (const note of notes) {
    const wc = wordCount(note.text);
    if (wc > longestNoteWordCount) {
      longestNoteWordCount = wc;
      longestNoteMood = note.mood ?? null;
    }
    if (note.mood && note.mood in MOOD_VALENCE) {
      const valence = MOOD_VALENCE[note.mood];
      if (valence > 0) positiveWordCounts.push(wc);
      else if (valence < 0) negativeWordCounts.push(wc);
    }
  }

  const average = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  return {
    totalNotes: notes.length,
    moodTaggedCount: moodNotes.length,
    weekdayStats,
    bestWeekday,
    hardestWeekday,
    avgWordCountPositive: average(positiveWordCounts),
    avgWordCountNegative: average(negativeWordCounts),
    longestNoteWordCount,
    longestNoteMood,
  };
}
