import { API_BASE_URL } from '../config';
import { Note } from '../types/Note';
import { InsightStats } from '../utils/insightStats';
import { ChatMessage } from '../types/ChatMessage';

// Sunucu her zaman JSON dönmeyebilir (deploy sırasında/beklenmeyen bir
// hatada düz HTML hata sayfası gelebilir) — response.json() bu durumda
// çirkin bir SyntaxError fırlatır. Burada onu yakalayıp null'a çeviriyoruz
// ki çağıran taraf her zaman kendi anlaşılır hata mesajını gösterebilsin.
async function parseJsonSafely(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getWeeklySummary(notes: Note[]): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok || !data) {
    throw new Error((data?.error as string) ?? 'Özet oluşturulamadı.');
  }

  return data.summary as string;
}

export async function getMoodTips(notes: Note[]): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/tips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok || !data) {
    throw new Error((data?.error as string) ?? 'Öneriler oluşturulamadı.');
  }

  return (data.tips as string[]) ?? [];
}

export async function getPersonalizedPrompts(notes: Note[]): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok || !data) {
    throw new Error((data?.error as string) ?? 'İstemler oluşturulamadı.');
  }

  return (data.prompts as string[]) ?? [];
}

export async function sendChatMessage(notes: Note[], messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notes,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok || !data) {
    throw new Error((data?.error as string) ?? 'Yanıt alınamadı.');
  }

  return data.reply as string;
}

export async function getPatternInsights(stats: InsightStats): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stats }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok || !data) {
    throw new Error((data?.error as string) ?? 'İçgörüler oluşturulamadı.');
  }

  return (data.insights as string[]) ?? [];
}
