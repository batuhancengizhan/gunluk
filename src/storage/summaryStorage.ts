import AsyncStorage from '@react-native-async-storage/async-storage';
import { Summary } from '../types/Summary';

const SUMMARIES_KEY = '@gunluk_asistan/summaries';
const MAX_SUMMARIES = 20;

export async function getSummaries(): Promise<Summary[]> {
  const raw = await AsyncStorage.getItem(SUMMARIES_KEY);
  if (!raw) return [];
  const summaries: Summary[] = JSON.parse(raw);
  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveSummary(text: string, noteCount: number): Promise<Summary> {
  const summaries = await getSummaries();
  const summary: Summary = {
    id: Date.now().toString(),
    text,
    noteCount,
    createdAt: new Date().toISOString(),
  };
  const updated = [summary, ...summaries].slice(0, MAX_SUMMARIES);
  await AsyncStorage.setItem(SUMMARIES_KEY, JSON.stringify(updated));
  return summary;
}

export async function deleteSummary(id: string): Promise<void> {
  const summaries = await getSummaries();
  const filtered = summaries.filter((s) => s.id !== id);
  await AsyncStorage.setItem(SUMMARIES_KEY, JSON.stringify(filtered));
}
