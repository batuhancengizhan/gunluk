import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';

const NOTES_KEY = '@gunluk_asistan/notes';

export async function getNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(NOTES_KEY);
  if (!raw) return [];
  const notes: Note[] = JSON.parse(raw);
  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

interface AddNoteOptions {
  mood?: string;
  photoUri?: string;
  revealAt?: string;
}

export async function addNote(text: string, options: AddNoteOptions = {}): Promise<Note> {
  const notes = await getNotes();
  const note: Note = {
    id: Date.now().toString(),
    text,
    mood: options.mood,
    photoUri: options.photoUri,
    revealAt: options.revealAt,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([note, ...notes]));
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  const filtered = notes.filter((n) => n.id !== id);
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
}

// "Geri al" akışı için: silinen bir notu, tüm alanlarını koruyarak
// (id, tarih, favori durumu dahil) depoya geri ekler.
export async function restoreNote(note: Note): Promise<void> {
  const notes = await getNotes();
  if (notes.some((n) => n.id === note.id)) return;
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([note, ...notes]));
}

// photoUri: string ise fotoğrafı değiştirir, null ise kaldırır,
// undefined ise mevcut fotoğrafa dokunmaz.
export async function updateNote(
  id: string,
  text: string,
  photoUri?: string | null
): Promise<void> {
  const notes = await getNotes();
  const updated = notes.map((n) => {
    if (n.id !== id) return n;
    const next: Note = { ...n, text, updatedAt: new Date().toISOString() };
    if (photoUri === null) {
      delete next.photoUri;
    } else if (photoUri !== undefined) {
      next.photoUri = photoUri;
    }
    return next;
  });
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
}

export async function toggleFavorite(id: string): Promise<void> {
  const notes = await getNotes();
  const updated = notes.map((n) =>
    n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
  );
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
}

export async function clearAllNotes(): Promise<void> {
  await AsyncStorage.removeItem(NOTES_KEY);
}

function isValidNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false;
  const n = value as Record<string, unknown>;
  return (
    typeof n.id === 'string' &&
    typeof n.text === 'string' &&
    typeof n.createdAt === 'string' &&
    !Number.isNaN(new Date(n.createdAt).getTime())
  );
}

// Bir JSON yedeğinden gelen notları mevcut notlarla birleştirir. Aynı id'ye
// sahip notlar atlanır (cihazdaki mevcut sürüm korunur, üzerine yazılmaz).
export async function mergeNotesFromBackup(
  backupNotes: unknown[]
): Promise<{ added: number; skipped: number }> {
  const notes = await getNotes();
  const existingIds = new Set(notes.map((n) => n.id));
  const validNotes = backupNotes.filter(isValidNote);

  const toAdd = validNotes.filter((n) => !existingIds.has(n.id));
  if (toAdd.length > 0) {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([...notes, ...toAdd]));
  }

  return { added: toAdd.length, skipped: validNotes.length - toAdd.length };
}
