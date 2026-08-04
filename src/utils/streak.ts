import { Note } from '../types/Note';

function toDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Bugünden geriye doğru, her gün en az bir not olduğu sürece sayan ardışık
 * gün serisi. Bugün henüz not yazılmamışsa (ama dün yazılmışsa) seri kesilmiş
 * sayılmaz — kullanıcı bugün hâlâ yazabilir.
 */
export function calculateStreak(notes: Note[]): number {
  if (notes.length === 0) return 0;

  const dayKeys = new Set(notes.map((n) => toDayKey(n.createdAt)));
  const today = new Date();
  const todayKey = toDayKey(today.toISOString());

  let streak = 0;
  const cursor = new Date(today);

  if (!dayKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dayKeys.has(toDayKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
