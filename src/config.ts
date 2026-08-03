import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKEND_PORT = 3000;

function resolveApiBaseUrl(): string {
  // Production/store build: backend'in yayınlandığı genel (public) adres,
  // derleme zamanında EXPO_PUBLIC_API_BASE_URL ile verilir (örn. Render URL'i).
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Expo Go / geliştirme derlemesi ile fiziksel bir cihazda çalışırken,
  // Metro paketleyicisinin adresinden (hostUri) bilgisayarın yerel ağ IP'sini
  // otomatik çıkarıyoruz — böylece "localhost" cihazın kendisini işaret etmiyor.
  const hostUri =
    Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${BACKEND_PORT}`;
    }
  }

  // Android emülatöründe host makineye ulaşmak için 10.0.2.2 kullanılır.
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  // Web ve iOS simülatöründe localhost doğrudan çalışır.
  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
