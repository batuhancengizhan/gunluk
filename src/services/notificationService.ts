import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';
import { getMoodTips } from './analysisService';
import { WELLNESS_TIPS } from '../constants/wellnessTips';

const REMINDER_ENABLED_KEY = '@gunluk_asistan/reminder_enabled';
const REMINDER_HOUR_KEY = '@gunluk_asistan/reminder_hour';
const REMINDER_MINUTE_KEY = '@gunluk_asistan/reminder_minute';
const TIPS_CACHE_KEY = '@gunluk_asistan/reminder_tips';
const TIPS_UPDATED_AT_KEY = '@gunluk_asistan/reminder_tips_updated_at';
const LEGACY_REMINDER_NOTIFICATION_ID = 'daily-journal-reminder';

const TIPS_REFRESH_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 gün
const RECENT_NOTES_FOR_TIPS = 30;
const WEEKDAY_COUNT = 7;

// Yapay zeka ile üretilen öneriler henüz hiç oluşturulmadıysa veya ağ
// hatası olduysa kullanılan, geniş bir sabit iyi-olma-hali hatırlatması
// havuzu (bkz. constants/wellnessTips.ts) — 7 günden fazla kullanımda bile
// aynı öneri tekrar etmesin diye kasıtlı olarak büyük tutuldu.
const FALLBACK_MESSAGES = WELLNESS_TIPS;

// Haftanın 7 gününe (Pazar..Cumartesi) sabit bildirim kimlikleri — içerik
// (öneri metni) değişse de kimlikler sabit kalır, böylece her zaman aynı
// 7 zamanlanmış bildirim güncellenir/iptal edilir.
const REMINDER_NOTIFICATION_IDS = Array.from(
  { length: WEEKDAY_COUNT },
  (_, i) => `journal-reminder-${i}`
);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(REMINDER_ENABLED_KEY),
    AsyncStorage.getItem(REMINDER_HOUR_KEY),
    AsyncStorage.getItem(REMINDER_MINUTE_KEY),
  ]);
  return {
    enabled: enabled === 'true',
    hour: hour ? parseInt(hour, 10) : 20,
    minute: minute ? parseInt(minute, 10) : 0,
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Günlük Hatırlatıcıları',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function getCachedTips(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(TIPS_CACHE_KEY);
  if (!raw) return FALLBACK_MESSAGES;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : FALLBACK_MESSAGES;
  } catch {
    return FALLBACK_MESSAGES;
  }
}

export async function shouldRefreshMoodTips(): Promise<boolean> {
  const updatedAt = await AsyncStorage.getItem(TIPS_UPDATED_AT_KEY);
  if (!updatedAt) return true;
  return Date.now() - Number(updatedAt) > TIPS_REFRESH_INTERVAL_MS;
}

// Son notlara bakarak yapay zekadan ruh haline uygun, kısa hatırlatma
// önerileri ister ve önbelleğe alır. Hatırlatıcı o an açıksa, zamanlanmış
// bildirimleri yeni içerikle günceller.
export async function refreshMoodTips(notes: Note[]): Promise<string[]> {
  try {
    const recentNotes = notes.slice(0, RECENT_NOTES_FOR_TIPS);
    const tips = await getMoodTips(recentNotes);
    if (tips.length > 0) {
      await AsyncStorage.setItem(TIPS_CACHE_KEY, JSON.stringify(tips));
      await AsyncStorage.setItem(TIPS_UPDATED_AT_KEY, String(Date.now()));

      const settings = await getReminderSettings();
      if (settings.enabled) {
        await scheduleReminderNotifications(settings.hour, settings.minute, tips);
      }
      return tips;
    }
  } catch {
    // Sessizce yut — önbellekteki/varsayılan öneriler kullanılmaya devam eder.
  }
  return getCachedTips();
}

async function scheduleReminderNotifications(
  hour: number,
  minute: number,
  tips: string[]
): Promise<void> {
  await ensureAndroidChannel();
  await cancelAllReminderNotifications();

  await Promise.all(
    REMINDER_NOTIFICATION_IDS.map((id, i) =>
      Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: 'Günlük Asistan',
          body: tips[i % tips.length],
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: i + 1, // 1=Pazar .. 7=Cumartesi
          hour,
          minute,
        },
      })
    )
  );
}

export async function enableDailyReminder(hour: number, minute: number): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  const tips = await getCachedTips();
  await scheduleReminderNotifications(hour, minute, tips);

  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
  await AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour));
  await AsyncStorage.setItem(REMINDER_MINUTE_KEY, String(minute));
  return true;
}

async function cancelAllReminderNotifications(): Promise<void> {
  await Promise.all([
    ...REMINDER_NOTIFICATION_IDS.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    ),
    Notifications.cancelScheduledNotificationAsync(LEGACY_REMINDER_NOTIFICATION_ID).catch(() => {}),
  ]);
}

export async function disableDailyReminder(): Promise<void> {
  await cancelAllReminderNotifications();
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

// Önbellekteki (yapay zeka ile üretilmiş veya varsayılan) öneri
// listesinden, güne göre sabit (aynı gün içinde değişmeyen) bir tanesini
// seçer — Not Yaz ekranındaki günlük karşılama satırı için kullanılır.
export async function getTodaysGreeting(): Promise<string> {
  const tips = await getCachedTips();
  const index = dayOfYear(new Date()) % tips.length;
  return tips[index];
}
