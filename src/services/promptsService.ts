import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';
import { WRITING_PROMPTS } from '../constants/writingPrompts';
import { getPersonalizedPrompts } from './analysisService';

const PROMPTS_CACHE_KEY = '@gunluk_asistan/writing_prompts';
const PROMPTS_UPDATED_AT_KEY = '@gunluk_asistan/writing_prompts_updated_at';
const PROMPTS_REFRESH_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 gün
const RECENT_NOTES_FOR_PROMPTS = 30;

export async function getCachedPrompts(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PROMPTS_CACHE_KEY);
  if (!raw) return WRITING_PROMPTS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : WRITING_PROMPTS;
  } catch {
    return WRITING_PROMPTS;
  }
}

export async function shouldRefreshPrompts(): Promise<boolean> {
  const updatedAt = await AsyncStorage.getItem(PROMPTS_UPDATED_AT_KEY);
  if (!updatedAt) return true;
  return Date.now() - Number(updatedAt) > PROMPTS_REFRESH_INTERVAL_MS;
}

// Son notlara bakarak yapay zekadan kişiselleştirilmiş yazma istemleri
// ister ve önbelleğe alır. Ağ hatası olursa önbellekteki/varsayılan
// istemler sessizce kullanılmaya devam eder.
export async function refreshPersonalizedPrompts(notes: Note[]): Promise<string[]> {
  try {
    const recentNotes = notes.slice(0, RECENT_NOTES_FOR_PROMPTS);
    const prompts = await getPersonalizedPrompts(recentNotes);
    if (prompts.length > 0) {
      await AsyncStorage.setItem(PROMPTS_CACHE_KEY, JSON.stringify(prompts));
      await AsyncStorage.setItem(PROMPTS_UPDATED_AT_KEY, String(Date.now()));
      return prompts;
    }
  } catch {
    // Sessizce yut — önbellekteki/varsayılan istemler kullanılmaya devam eder.
  }
  return getCachedPrompts();
}

export function pickRandomPrompts(prompts: string[], count: number): string[] {
  const shuffled = [...prompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
