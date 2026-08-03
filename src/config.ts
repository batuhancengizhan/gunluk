// Backend, Render.com üzerinde canlı olarak çalışıyor — telefon/bilgisayar
// aynı Wi-Fi ağında olmasa da her yerden erişilebilir.
// Not: Render'ın ücretsiz planı birkaç dakika hareketsizlikten sonra uykuya
// geçer; uyandığında ilk istek 30-60 saniye sürebilir, sonrası normal hızdadır.
const DEPLOYED_API_BASE_URL = 'https://gunluk-asistan-backend.onrender.com';

function resolveApiBaseUrl(): string {
  // Yereldeki backend'i test etmek istersen (örn. server/index.js üzerinde
  // değişiklik yaparken), şu şekilde başlatarak geçici olarak override edebilirsin:
  //   EXPO_PUBLIC_API_BASE_URL=http://<bilgisayarının-ip-adresi>:3000 npx expo start
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  return DEPLOYED_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();
