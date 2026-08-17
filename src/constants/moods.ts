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

// Duygu haritası hesaplamaları için kaba bir "olumluluk" skoru:
// +1 olumlu, 0 nötr, -1 olumsuz/yorucu.
export const MOOD_VALENCE: Record<string, number> = {
  '😊': 1,
  '😌': 1,
  '🥳': 1,
  '😐': 0,
  '😢': -1,
  '😡': -1,
  '😴': -1,
  '😰': -1,
};
