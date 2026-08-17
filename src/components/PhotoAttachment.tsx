import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { pickPhotoFromLibrary, takePhotoWithCamera } from '../utils/photoStorage';
import { haptics } from '../utils/haptics';
import { softShadow } from '../utils/shadow';

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
          <Ionicons name="close" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Fotoğraf ekle"
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.subtext} />
      ) : (
        <>
          <Ionicons name="camera-outline" size={16} color={colors.subtext} />
          <Text style={styles.addButtonText}>Fotoğraf Ekle</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    addButtonText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.subtext,
    },
    previewWrap: {
      alignSelf: 'flex-start',
      position: 'relative',
    },
    previewImage: {
      width: 96,
      height: 96,
      borderRadius: 14,
      backgroundColor: colors.card,
    },
    removeButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
