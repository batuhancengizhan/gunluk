import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';

const NOTES_KEY = '@gunluk_asistan/notes';

export async function getNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(NOTES_KEY);
  if (!raw) return [];
  const notes: Note[] = JSON.parse(raw);
  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addNote(text: string): Promise<Note> {
  const notes = await getNotes();
  const note: Note = {
    id: Date.now().toString(),
    text,
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

export async function updateNoteText(id: string, text: string): Promise<void> {
  const notes = await getNotes();
  const updated = notes.map((n) =>
    n.id === id ? { ...n, text, updatedAt: new Date().toISOString() } : n
  );
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
