import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { pickPhotoFromLibrary, takePhotoWithCamera } from '../utils/photoStorage';
import { haptics } from '../utils/haptics';

interface Props {
  photoUri: string | null;
  onChange: (uri: string | null) => void;
  onError: (message: string) => void;
}

export default function PhotoAttachment({ photoUri, onChange, onError }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);

  const runPick = async (source: 'camera' | 'library') => {
    setLoading(true);
    try {
      const uri = source === 'camera' ? await takePhotoWithCamera() : await pickPhotoFromLibrary();
      if (uri) {
        haptics.success();
        onChange(uri);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Fotoğraf eklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    Alert.alert('Fotoğraf Ekle', undefined, [
      { text: 'Kamera', onPress: () => runPick('camera') },
      { text: 'Galeri', onPress: () => runPick('library') },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  const handleRemove = () => {
    haptics.selection();
    onChange(null);
  };

  if (photoUri) {
    return (
      <View style={styles.previewWrap}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Fotoğrafı kaldır"
        >
          <Ionicons name="close" size={13} color={colors.background} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Fotoğraf ekle"
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.subtext} />
      ) : (
        <Ionicons name="camera-outline" size={18} color={colors.subtext} />
      )}
    </TouchableOpacity>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    addButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    previewWrap: {
      alignSelf: 'flex-start',
      position: 'relative',
    },
    previewImage: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.background,
    },
    removeButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
