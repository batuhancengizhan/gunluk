import { Directory, File, Paths } from 'expo-file-system';

const AUDIO_DIR_NAME = 'gunluk-sesler';

function getAudioDirectory(): Directory {
  const dir = new Directory(Paths.document, AUDIO_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

// Kayıt bittiğinde geçici önbellek konumundaki ses dosyasını uygulamanın
// kalıcı belge dizinine kopyalar; not silinmeden bu dosya kaybolmaz.
export async function saveAudioToAppStorage(sourceUri: string): Promise<string> {
  const dir = getAudioDirectory();
  const extensionMatch = sourceUri.split('?')[0].match(/\.(\w+)$/);
  const extension = extensionMatch ? extensionMatch[1] : 'm4a';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const sourceFile = new File(sourceUri);
  const destFile = new File(dir, fileName);
  await sourceFile.copy(destFile);
  return destFile.uri;
}

export function deleteStoredAudio(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Dosya zaten yoksa veya silinemezse sessizce geç.
  }
}
