import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_ENABLED_KEY = '@gunluk_asistan/reminder_enabled';
const REMINDER_HOUR_KEY = '@gunluk_asistan/reminder_hour';
const REMINDER_MINUTE_KEY = '@gunluk_asistan/reminder_minute';
const REMINDER_NOTIFICATION_ID = 'daily-journal-reminder';

// Her gün farklı bir mesaj gelmesi için basit bir döngü — hatırlatıcı ve
// nazik bir tavsiye/motivasyon karışımı.
const REMINDER_MESSAGES = [
  'Bugün nasıl geçti? Birkaç cümleyle günlüğüne not düşmeye ne dersin? 📝',
  'Küçük bir mola ver ve bugünün hislerini günlüğüne yaz. 🌿',
  'Kendine birkaç dakika ayır — bugünü nasıl hissettiğini yazmak iyi gelir. 💭',
  'Günlük tutma alışkanlığı zihnini rahatlatır. Bugünü kaçırma! ✍️',
  'Bir cümle bile olsa, bugünü kaydetmeye değer. 🌙',
  'Duygularını yazıya dökmek, onları anlamanın ilk adımıdır. 😊',
  'Haftalık özet için düzenli not almak faydalı — bugünü de ekle! ✨',
];

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

export async function enableDailyReminder(hour: number, minute: number): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {});

  const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Günlük Asistan',
      body: message,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
  await AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour));
  await AsyncStorage.setItem(REMINDER_MINUTE_KEY, String(minute));
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {});
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
}
