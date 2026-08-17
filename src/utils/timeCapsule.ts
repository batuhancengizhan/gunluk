import * as Notifications from 'expo-notifications';
import { Note } from '../types/Note';

export interface TimeCapsuleOption {
  id: string;
  label: string;
  computeDate: (from: Date) => Date;
}

export const TIME_CAPSULE_OPTIONS: TimeCapsuleOption[] = [
  {
    id: '1m',
    label: '1 Ay Sonra',
    computeDate: (from) => {
      const d = new Date(from);
      d.setMonth(d.getMonth() + 1);
      return d;
    },
  },
  {
    id: '3m',
    label: '3 Ay Sonra',
    computeDate: (from) => {
      const d = new Date(from);
      d.setMonth(d.getMonth() + 3);
      return d;
    },
  },
  {
    id: '6m',
    label: '6 Ay Sonra',
    computeDate: (from) => {
      const d = new Date(from);
      d.setMonth(d.getMonth() + 6);
      return d;
    },
  },
  {
    id: '1y',
    label: '1 Yıl Sonra',
    computeDate: (from) => {
      const d = new Date(from);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    },
  },
];

function capsuleNotificationId(noteId: string): string {
  return `time-capsule-${noteId}`;
}

export async function scheduleTimeCapsuleNotification(note: Note): Promise<void> {
  if (!note.revealAt) return;
  const revealDate = new Date(note.revealAt);
  if (Number.isNaN(revealDate.getTime()) || revealDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: capsuleNotificationId(note.id),
    content: {
      title: 'Geçmişten bir mektup 📮',
      body: 'Bir süre önce kendine yazdığın bir notu okumaya hazır mısın?',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: revealDate,
    },
  });
}

export async function cancelTimeCapsuleNotification(noteId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(capsuleNotificationId(noteId)).catch(
    () => {}
  );
}

export function formatRevealDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function isRevealPending(iso?: string): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}
