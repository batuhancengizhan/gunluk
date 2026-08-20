import { Note } from '../types/Note';
import { MOOD_VALENCE } from '../constants/moods';

export interface MoodTrendPoint {
  date: string;
  mood: string;
  value: number;
}

export const MIN_NOTES_FOR_MOOD_TREND = 5;
const MAX_POINTS = 30;

// Ruh hali etiketli notları kronolojik sıraya koyup en fazla son 30 tanesini
// döner; her nokta bir notu temsil eder (günlere göre değil, gerçek yazma
// sıklığına göre eşit aralıklı — seyrek yazan kullanıcılarda da anlamlı kalır).
export function computeMoodTrendPoints(notes: Note[]): MoodTrendPoint[] {
  const moodNotes = notes
    .filter((n): n is Note & { mood: string } => !!n.mood && n.mood in MOOD_VALENCE)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return moodNotes.slice(-MAX_POINTS).map((n) => ({
    date: n.createdAt,
    mood: n.mood,
    value: MOOD_VALENCE[n.mood],
  }));
}
