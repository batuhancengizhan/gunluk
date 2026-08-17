import { API_BASE_URL } from '../config';
import { Note } from '../types/Note';

export async function getWeeklySummary(notes: Note[]): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? 'Özet oluşturulamadı.');
  }

  return data.summary as string;
}

export async function getMoodTips(notes: Note[]): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/tips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? 'Öneriler oluşturulamadı.');
  }

  return (data.tips as string[]) ?? [];
}

export async function getPersonalizedPrompts(notes: Note[]): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? 'İstemler oluşturulamadı.');
  }

  return (data.prompts as string[]) ?? [];
}
