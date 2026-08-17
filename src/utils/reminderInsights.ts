import { Note } from '../types/Note';

const MIN_NOTES_FOR_SUGGESTION = 5;

// Kullanıcının geçmişte en sık hangi saatte not yazdığını bulur ve o saati
// hatırlatıcı için önerir. Yeterli veri yoksa null döner.
export function computeSuggestedReminderTime(
  notes: Note[]
): { hour: number; minute: number } | null {
  if (notes.length < MIN_NOTES_FOR_SUGGESTION) return null;

  const hourCounts = new Map<number, number>();
  for (const note of notes) {
    const hour = new Date(note.createdAt).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }

  let bestHour = 0;
  let bestCount = 0;
  for (const [hour, count] of hourCounts) {
    if (count > bestCount) {
      bestHour = hour;
      bestCount = count;
    }
  }

  return { hour: bestHour, minute: 0 };
}
