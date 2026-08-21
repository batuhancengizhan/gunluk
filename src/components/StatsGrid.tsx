import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { computeStats } from '../utils/stats';
import { softShadow } from '../utils/shadow';

export default function StatsGrid({ notes }: { notes: Note[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const stats = useMemo(() => computeStats(notes), [notes]);

  if (notes.length === 0) {
    return null;
  }

  const tiles = [
    { label: 'Toplam Not', value: String(stats.totalNotes) },
    { label: 'Toplam Kelime', value: stats.totalWords.toLocaleString('tr-TR') },
    { label: 'Güncel Seri', value: `${stats.currentStreak} gün` },
    { label: 'En Uzun Seri', value: `${stats.longestStreak} gün` },
    { label: 'Favoriler', value: String(stats.favoriteCount) },
    {
      label: 'En Sık Ruh Hali',
      value: stats.topMood ? stats.topMood.emoji : '—',
    },
  ];

  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <View key={tile.label} style={styles.tile}>
          <Text style={styles.value}>{tile.value}</Text>
          <Text style={styles.label}>{tile.label}</Text>
        </View>
      ))}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tile: {
      width: '31.5%',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    value: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    label: {
      fontSize: 10,
      color: colors.subtext,
      textAlign: 'center',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
  });
}
