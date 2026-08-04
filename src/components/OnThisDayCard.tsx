import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { softShadow } from '../utils/shadow';
import { findOnThisDayNotes, yearsAgo } from '../utils/onThisDay';
import { haptics } from '../utils/haptics';

interface Props {
  notes: Note[];
  onPress: (note: Note) => void;
}

export default function OnThisDayCard({ notes, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const matches = useMemo(() => findOnThisDayNotes(notes), [notes]);

  if (matches.length === 0) {
    return null;
  }

  const note = matches[0];
  const years = yearsAgo(note.createdAt);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        haptics.selection();
        onPress(note);
      }}
    >
      <View style={styles.header}>
        <Ionicons name="time-outline" size={14} color={colors.primary} />
        <Text style={styles.eyebrow}>BU GÜNDE</Text>
      </View>
      <Text style={styles.subtitle}>
        {years === 1 ? '1 yıl önce bugün' : `${years} yıl önce bugün`} {note.mood ?? ''}
      </Text>
      <Text style={styles.text} numberOfLines={3}>
        {note.text}
      </Text>
    </TouchableOpacity>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    eyebrow: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.1,
    },
    subtitle: {
      fontSize: 12.5,
      color: colors.subtext,
      marginBottom: 8,
      fontWeight: '600',
    },
    text: {
      fontSize: 14.5,
      color: colors.text,
      lineHeight: 20,
    },
  });
}
