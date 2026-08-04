import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';

const WEEKS = 4;
const WEEKDAY_LABELS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

interface DayCell {
  date: Date;
  key: string;
  mood?: string;
  hasNote: boolean;
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

  const moodByDay = new Map<string, string | undefined>();
  const hasNoteByDay = new Set<string>();
  // Notlar en yeniden en eskiye sıralı geliyor; ilk rastladığımız (en yeni)
  // notun mood'unu o gün için kullanırız.
  for (const note of notes) {
    const k = dayKey(new Date(note.createdAt));
    hasNoteByDay.add(k);
    if (!moodByDay.has(k)) {
      moodByDay.set(k, note.mood);
    }
  }

  const days: DayCell[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < WEEKS * 7; i++) {
    const k = dayKey(cursor);
    days.push({
      date: new Date(cursor),
      key: k,
      mood: moodByDay.get(k),
      hasNote: hasNoteByDay.has(k),
      isFuture: cursor.getTime() > today.getTime(),
      isToday: cursor.getTime() === today.getTime(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export default function MoodCalendar({ notes }: { notes: Note[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const days = useMemo(() => buildDays(notes), [notes]);

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
          <View
            key={day.key}
            style={[
              styles.cell,
              day.isFuture && styles.cellFuture,
              day.hasNote && !day.mood && styles.cellNoMood,
              day.isToday && styles.cellToday,
            ]}
          >
            {day.mood ? (
              <Text style={styles.cellEmoji}>{day.mood}</Text>
            ) : day.hasNote ? (
              <View style={styles.cellDot} />
            ) : null}
          </View>
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
