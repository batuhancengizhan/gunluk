import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { addNote, getNotes } from '../storage/notesStorage';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { useBackgroundTheme } from '../context/BackgroundThemeContext';
import { useToast } from '../context/ToastContext';
import { calculateStreak, getStreakMilestoneMessage } from '../utils/streak';
import { cardShadow, softShadow } from '../utils/shadow';
import { getRandomPrompts } from '../constants/writingPrompts';
import { haptics } from '../utils/haptics';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';
import { MOODS, moodLabel } from '../constants/moods';

export default function WriteNoteScreen() {
  const { colors } = useTheme();
  const { backgroundTheme } = useBackgroundTheme();
  const { showToast } = useToast();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [text, setText] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [prompts, setPrompts] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      getNotes().then((notes) => setStreak(calculateStreak(notes)));
      setPrompts(getRandomPrompts(3));
    }, [])
  );

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [text]);

  const handlePromptPress = (prompt: string) => {
    haptics.selection();
    setText((prev) => (prev ? prev : `${prompt}\n`));
    inputRef.current?.focus();
  };

  const handleMoodPress = (emoji: string) => {
    haptics.selection();
    setMood((prev) => (prev === emoji ? undefined : emoji));
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      haptics.warning();
      showToast('Kaydetmeden önce bir şeyler yazmalısın.');
      return;
    }
    setSaving(true);
    try {
      await addNote(trimmed, mood);
      setText('');
      setMood(undefined);
      const notes = await getNotes();
      const newStreak = calculateStreak(notes);
      setStreak(newStreak);
      haptics.success();

      const milestoneMessage = getStreakMilestoneMessage(newStreak);
      if (milestoneMessage) {
        showToast(milestoneMessage, { duration: 3600 });
      } else {
        showToast('Günlük notun kaydedildi.');
      }
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
              onPress={() => handleMoodPress(emoji)}
              accessibilityRole="button"
              accessibilityLabel={`${moodLabel(emoji)} ruh hali`}
              accessibilityState={{ selected: mood === emoji }}
            >
              <Text style={styles.moodEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {text.length === 0 && prompts.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptScroll}
            contentContainerStyle={styles.promptRow}
          >
            {prompts.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={styles.promptChip}
                onPress={() => handlePromptPress(prompt)}
                activeOpacity={0.85}
              >
                <Text style={styles.promptChipText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TextInput
          ref={inputRef}
          style={styles.input}
          multiline
          placeholder="Günlük notunu buraya yaz..."
          placeholderTextColor={colors.subtext}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
        {text.length > 0 && (
          <Text style={styles.wordCount}>{wordCount} kelime</Text>
        )}
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
      fontSize: 24,
      fontFamily: FONT_DISPLAY_SEMIBOLD,
      color: colors.text,
      flexShrink: 1,
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
    promptScroll: {
      marginBottom: 12,
    },
    promptRow: {
      gap: 8,
      paddingRight: 8,
    },
    promptChip: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      maxWidth: 220,
    },
    promptChipText: {
      fontSize: 12.5,
      color: colors.text,
      fontWeight: '500',
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
    wordCount: {
      fontSize: 11.5,
      color: colors.subtext,
      textAlign: 'right',
      marginTop: 6,
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
