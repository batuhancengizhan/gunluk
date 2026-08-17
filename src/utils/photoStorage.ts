import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

const PHOTOS_DIR_NAME = 'gunluk-photos';

function getPhotosDirectory(): Directory {
  const dir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

// Seçilen fotoğrafı (genelde geçici bir önbellek konumundan) uygulamanın
// kalıcı belge dizinine kopyalar; not silinmeden bu dosya kaybolmaz.
export async function savePhotoToAppStorage(sourceUri: string): Promise<string> {
  const dir = getPhotosDirectory();
  const extensionMatch = sourceUri.split('?')[0].match(/\.(\w+)$/);
  const extension = extensionMatch ? extensionMatch[1] : 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const sourceFile = new File(sourceUri);
  const destFile = new File(dir, fileName);
  await sourceFile.copy(destFile);
  return destFile.uri;
}

export function deleteStoredPhoto(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Dosya zaten yoksa veya silinemezse sessizce geç.
  }
}

async function pickImage(source: 'camera' | 'library'): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      source === 'camera'
        ? 'Kameraya erişim izni verilmedi.'
        : 'Fotoğraflara erişim izni verilmedi.'
    );
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.6,
    allowsEditing: true,
    aspect: [4, 3],
  };

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || result.assets.length === 0) return null;
  return savePhotoToAppStorage(result.assets[0].uri);
}

export async function pickPhotoFromLibrary(): Promise<string | null> {
  return pickImage('library');
}

export async function takePhotoWithCamera(): Promise<string | null> {
  return pickImage('camera');
}
