import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { haptics } from '../utils/haptics';

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Props {
  uri: string;
  style?: object;
}

export default function AudioPlaybackButton({ uri, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const handleToggle = () => {
    haptics.selection();
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.duration > 0 && status.currentTime >= status.duration - 0.1) {
      player.seekTo(0);
    }
    player.play();
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleToggle}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'Sesli notu duraklat' : 'Sesli notu oynat'}
    >
      <Ionicons name={status.playing ? 'pause' : 'play'} size={13} color={colors.primary} />
      <Text style={styles.text}>{formatDuration(status.duration)}</Text>
    </TouchableOpacity>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.favoriteBg,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 7,
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
  });
}
