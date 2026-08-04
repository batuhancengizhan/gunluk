import { Note } from '../types/Note';

export function formatNotesForExport(notes: Note[]): string {
  const sorted = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const lines = sorted.map((note) => {
    const date = new Date(note.createdAt).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const moodTag = note.mood ? ` ${note.mood}` : '';
    const favoriteTag = note.isFavorite ? ' ⭐' : '';
    return `${date}${moodTag}${favoriteTag}\n${note.text}`;
  });
  return `Günlük Asistan — Not Yedeği\n${lines.length} not\n\n${lines.join('\n\n---\n\n')}`;
}
