import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { haptics } from '../utils/haptics';
import { moodLabel } from '../constants/moods';

const WEEKS = 4;
const WEEKDAY_LABELS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

interface DayCell {
  date: Date;
  key: string;
  mood?: string;
  note?: Note;
  isFuture: boolean;
  isToday: boolean;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildDays(notes: Note[]): DayCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayWeekday = (today.getDay() + 6) % 7; // 0=Pzt .. 6=Paz
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (6 - todayWeekday));

  const start = new Date(endOfWeek);
  start.setDate(start.getDate() - (WEEKS * 7 - 1));

  const noteByDay = new Map<string, Note>();
  // Notlar en yeniden en eskiye sıralı geliyor; ilk rastladığımız (en yeni)
  // notu o gün için kullanırız.
  for (const note of notes) {
    const k = dayKey(new Date(note.createdAt));
    if (!noteByDay.has(k)) {
      noteByDay.set(k, note);
    }
  }

  const days: DayCell[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < WEEKS * 7; i++) {
    const k = dayKey(cursor);
    const note = noteByDay.get(k);
    days.push({
      date: new Date(cursor),
      key: k,
      mood: note?.mood,
      note,
      isFuture: cursor.getTime() > today.getTime(),
      isToday: cursor.getTime() === today.getTime(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

interface Props {
  notes: Note[];
  onDayPress?: (note: Note) => void;
}

export default function MoodCalendar({ notes, onDayPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const days = useMemo(() => buildDays(notes), [notes]);

  const handlePress = (day: DayCell) => {
    if (!day.note) return;
    haptics.selection();
    onDayPress?.(day.note);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ruh Hali Takvimi</Text>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day) => (
          <TouchableOpacity
            key={day.key}
            activeOpacity={day.note ? 0.6 : 1}
            disabled={!day.note}
            onPress={() => handlePress(day)}
            accessibilityRole={day.note ? 'button' : undefined}
            accessibilityLabel={
              day.note
                ? `${day.date.toLocaleDateString('tr-TR')} tarihli not${day.mood ? `, ${moodLabel(day.mood)}` : ''}`
                : undefined
            }
            style={[
              styles.cell,
              day.isFuture && styles.cellFuture,
              day.note && !day.mood && styles.cellNoMood,
              day.isToday && styles.cellToday,
            ]}
          >
            {day.mood ? (
              <Text style={styles.cellEmoji}>{day.mood}</Text>
            ) : day.note ? (
              <View style={styles.cellDot} />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    weekdayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    weekdayLabel: {
      width: 30,
      textAlign: 'center',
      fontSize: 10,
      color: colors.subtext,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 6,
    },
    cell: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellFuture: {
      opacity: 0,
    },
    cellNoMood: {
      backgroundColor: colors.favoriteBg,
    },
    cellToday: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    cellEmoji: {
      fontSize: 15,
    },
    cellDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.favorite,
    },
  });
}
