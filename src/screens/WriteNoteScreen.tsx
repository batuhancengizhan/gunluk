import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { addNote, getNotes } from '../storage/notesStorage';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { useBackgroundTheme } from '../context/BackgroundThemeContext';
import { calculateStreak } from '../utils/streak';
import { cardShadow, softShadow } from '../utils/shadow';

const MOODS = ['😊', '😌', '😐', '😢', '😡', '😴', '🥳', '😰'];

export default function WriteNoteScreen() {
  const { colors } = useTheme();
  const { backgroundTheme } = useBackgroundTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [text, setText] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getNotes().then((notes) => setStreak(calculateStreak(notes)));
    }, [])
  );

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Boş not', 'Kaydetmeden önce bir şeyler yazmalısın.');
      return;
    }
    setSaving(true);
    try {
      await addNote(trimmed, mood);
      setText('');
      setMood(undefined);
      const notes = await getNotes();
      setStreak(calculateStreak(notes));
      Alert.alert('Kaydedildi', 'Günlük notun kaydedildi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={backgroundTheme.colors} style={styles.gradientContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Bugün nasıl hissediyorsun?</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          )}
        </View>

        <View style={styles.moodRow}>
          {MOODS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.moodButton, mood === emoji && styles.moodButtonActive]}
              onPress={() => setMood((prev) => (prev === emoji ? undefined : emoji))}
            >
              <Text style={styles.moodEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          multiline
          placeholder="Günlük notunu buraya yaz..."
          placeholderTextColor={colors.subtext}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    gradientContainer: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      marginTop: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      flexShrink: 1,
      letterSpacing: -0.3,
    },
    streakBadge: {
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    streakText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    moodRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
      marginBottom: 18,
    },
    moodButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: 'transparent',
      ...softShadow(colors),
    },
    moodButtonActive: {
      borderColor: colors.primary,
    },
    moodEmoji: {
      fontSize: 21,
    },
    input: {
      flex: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      fontSize: 16,
      lineHeight: 23,
      backgroundColor: colors.card,
      color: colors.text,
      ...cardShadow(colors),
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 16,
      ...cardShadow(colors),
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
}
