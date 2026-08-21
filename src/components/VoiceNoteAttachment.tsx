import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { haptics } from '../utils/haptics';
import { deleteStoredAudio, saveAudioToAppStorage } from '../utils/audioStorage';
import AudioPlaybackButton from './AudioPlaybackButton';

interface Props {
  audioUri: string | null;
  onChange: (uri: string | null) => void;
  onError: (message: string) => void;
}

function formatDuration(millis: number): string {
  const total = Math.max(0, Math.round(millis / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VoiceNoteAttachment({ audioUri, onChange, onError }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [busy, setBusy] = useState(false);

  const handleStart = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        onError('Mikrofona erişim izni verilmedi.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      haptics.selection();
    } catch {
      onError('Kayıt başlatılamadı.');
    }
  };

  const handleStop = async () => {
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const saved = await saveAudioToAppStorage(uri);
        onChange(saved);
        haptics.success();
      }
    } catch {
      onError('Kayıt tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    haptics.selection();
    deleteStoredAudio(audioUri!);
    onChange(null);
  };

  if (audioUri) {
    return (
      <View style={styles.previewRow}>
        <AudioPlaybackButton uri={audioUri} />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Sesli notu kaldır"
        >
          <Ionicons name="trash-outline" size={15} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  }

  if (recorderState.isRecording) {
    return (
      <TouchableOpacity
        style={styles.recordingButton}
        onPress={handleStop}
        disabled={busy}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Kaydı durdur"
      >
        <View style={styles.recordingDot} />
        <Text style={styles.recordingText}>
          Kaydediliyor... {formatDuration(recorderState.durationMillis)}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={handleStart}
      disabled={busy}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Sesli not ekle"
    >
      <Ionicons name="mic-outline" size={18} color={colors.subtext} />
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
    recordingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      alignSelf: 'flex-start',
      backgroundColor: colors.dangerBg,
      borderRadius: 10,
      paddingVertical: 7,
      paddingHorizontal: 11,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
    },
    recordingText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.danger,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
    },
    removeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.dangerBg,
    },
  });
}
