import { Note } from '../types/Note';

/** Bugünle aynı ay/gün'e denk gelen, ama farklı (geçmiş) bir yıldan notlar. */
export function findOnThisDayNotes(notes: Note[]): Note[] {
  const today = new Date();
  return notes.filter((note) => {
    const d = new Date(note.createdAt);
    return (
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate() &&
      d.getFullYear() !== today.getFullYear()
    );
  });
}

export function yearsAgo(iso: string): number {
  const d = new Date(iso);
  const today = new Date();
  return today.getFullYear() - d.getFullYear();
}
