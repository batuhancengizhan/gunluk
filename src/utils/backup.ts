import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Note } from '../types/Note';

interface BackupPayload {
  app: 'gunluk-asistan';
  version: 1;
  exportedAt: string;
  notes: Note[];
}

function backupFileName(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `gunluk-asistan-yedek-${date}.json`;
}

// Notları bir JSON yedek dosyası olarak yazar ve sistem paylaşım
// sayfasını açar (Dosyalar, iCloud Drive, e-posta vb. yerlere kaydedilebilir).
export async function shareNotesBackup(notes: Note[]): Promise<void> {
  const payload: BackupPayload = {
    app: 'gunluk-asistan',
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
  };

  const file = new File(Paths.cache, backupFileName());
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(JSON.stringify(payload, null, 2));

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Bu cihazda paylaşım özelliği kullanılamıyor.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Yedek Dosyasını Kaydet',
    UTI: 'public.json',
  });
}

// Kullanıcıya bir JSON yedek dosyası seçtirir ve içindeki notları döner.
// İptal edilirse null döner.
export async function pickNotesBackup(): Promise<Note[] | null> {
  const picked = await File.pickFileAsync({ mimeTypes: 'application/json' });
  if (picked.canceled) return null;

  const raw = await picked.result.text();
  const parsed = JSON.parse(raw);
  const notes = Array.isArray(parsed) ? parsed : parsed?.notes;

  if (!Array.isArray(notes)) {
    throw new Error('Dosya geçerli bir Günlük Asistan yedeği değil.');
  }
  return notes;
}
