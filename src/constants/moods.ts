export const MOODS = ['😊', '😌', '😐', '😢', '😡', '😴', '🥳', '😰'];

export const MOOD_LABELS: Record<string, string> = {
  '😊': 'Mutlu',
  '😌': 'Huzurlu',
  '😐': 'Nötr',
  '😢': 'Üzgün',
  '😡': 'Kızgın',
  '😴': 'Yorgun',
  '🥳': 'Heyecanlı',
  '😰': 'Endişeli',
};

export function moodLabel(emoji: string): string {
  return MOOD_LABELS[emoji] ?? 'Ruh hali';
}
