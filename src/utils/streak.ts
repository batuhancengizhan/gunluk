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

const STREAK_MILESTONE_MESSAGES: Record<number, string> = {
  3: 'Harika başlangıç! 3 gün üst üste yazdın 🌱',
  7: 'Bir haftadır aralıksız yazıyorsun! 🔥',
  14: '2 haftalık seri! Bu alışkanlık kök salıyor 🌿',
  30: '30 gün! Bu artık gerçek bir alışkanlık oldu 🏆',
  50: '50 günlük seri — inanılmaz bir tutarlılık ✨',
  100: '100 gün! Bu gerçekten etkileyici 🎉',
  200: '200 gün aralıksız — nadir bulunan bir azim 💎',
  365: 'Tam bir yıl! Bu bir yaşam biçimi oldu 👑',
};

// Seri tam olarak bir kilometre taşına ulaştığında kutlama mesajı döner,
// aksi halde null (böylece kullanıcıya sadece milestone günlerinde
// gösterilir, her kayıtta değil).
export function getStreakMilestoneMessage(streak: number): string | null {
  return STREAK_MILESTONE_MESSAGES[streak] ?? null;
}
