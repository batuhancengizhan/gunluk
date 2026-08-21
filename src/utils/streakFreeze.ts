import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';

const FREEZE_KEY = '@gunluk_asistan/streak_freezes';
export const MAX_FREEZES = 2;
const FREEZE_EARN_INTERVAL = 7;

function toDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export async function getFreezeCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(FREEZE_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? Math.max(0, Math.min(MAX_FREEZES, n)) : 0;
}

async function setFreezeCount(count: number): Promise<void> {
  await AsyncStorage.setItem(FREEZE_KEY, String(Math.max(0, Math.min(MAX_FREEZES, count))));
}

// Her 7 günlük kesintisiz (dondurma kullanılmadan) gerçek yazma serisinde
// bir "seri koruması" kazandırır — zaten maksimumdaysa yenisini kazandırmaz.
// rawStreak, calculateStreak'in (dondurma bilmeyen) ham sonucu olmalı.
export async function maybeAwardFreeze(rawStreak: number): Promise<boolean> {
  if (rawStreak === 0 || rawStreak % FREEZE_EARN_INTERVAL !== 0) return false;
  const current = await getFreezeCount();
  if (current >= MAX_FREEZES) return false;
  await setFreezeCount(current + 1);
  return true;
}

export interface FreezeAwareStreak {
  streak: number;
  freezesUsed: number;
}

// Bugünden geriye doğru sayarken, en fazla `freezesAvailable` kadar eksik
// günü "dondurma" ile atlayarak zinciri canlı tutar. Dondurulan gün sayının
// kendisine eklenmez — yalnızca zincirin kopmasını engeller.
export function calculateStreakWithFreezes(
  notes: Note[],
  freezesAvailable: number
): FreezeAwareStreak {
  if (notes.length === 0) return { streak: 0, freezesUsed: 0 };

  const dayKeys = new Set(notes.map((n) => toDayKey(n.createdAt)));
  const today = new Date();
  const todayKey = toDayKey(today.toISOString());

  let streak = 0;
  let freezesUsed = 0;
  const cursor = new Date(today);

  if (!dayKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = toDayKey(cursor.toISOString());
    if (dayKeys.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (freezesUsed < freezesAvailable) {
      freezesUsed += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }

  return { streak, freezesUsed };
}
