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
import BackgroundArt, { hasBackgroundArt } from '../components/BackgroundArt';
import BreathingExercise from '../components/BreathingExercise';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { useBackgroundTheme } from '../context/BackgroundThemeContext';
import { useToast } from '../context/ToastContext';
import { calculateStreak, getStreakMilestoneMessage } from '../utils/streak';
import { calculateLongestStreak, getNoteCountMilestoneMessage } from '../utils/stats';
import { cardShadow, softShadow } from '../utils/shadow';
import { getRandomPrompts } from '../constants/writingPrompts';
import { haptics } from '../utils/haptics';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';
import { MOODS, moodLabel } from '../constants/moods';

const STRESS_MOODS = ['😰', '😡', '😢', '😴'];

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
  const [showBreathingSuggestion, setShowBreathingSuggestion] = useState(false);
  const [breathingVisible, setBreathingVisible] = useState(false);
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
    setMood((prev) => {
      const next = prev === emoji ? undefined : emoji;
      setShowBreathingSuggestion(!!next && STRESS_MOODS.includes(next));
      return next;
    });
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
      const previousLongestStreak = calculateLongestStreak(await getNotes());

      await addNote(trimmed, mood);
      setText('');
      setMood(undefined);
      setShowBreathingSuggestion(false);
      const notes = await getNotes();
      const newStreak = calculateStreak(notes);
      setStreak(newStreak);
      haptics.success();

      const isNewRecord = newStreak > previousLongestStreak && newStreak > 1;
      const milestoneMessage = isNewRecord
        ? `Yeni rekorun! ${newStreak} gün üst üste yazdın 🏅`
        : getStreakMilestoneMessage(newStreak) ?? getNoteCountMilestoneMessage(notes.length);
      if (milestoneMessage) {
        showToast(milestoneMessage, { duration: 3600 });
      } else {
        showToast('Günlük notun kaydedildi.');
      }
    } finally {
      setSaving(false);
    }
  };

  const hasArt = hasBackgroundArt(backgroundTheme.id);

  return (
    <View style={styles.gradientContainer}>
      {hasArt && <BackgroundArt themeId={backgroundTheme.id} style={StyleSheet.absoluteFill} />}
      <LinearGradient
        colors={backgroundTheme.colors}
        style={[StyleSheet.absoluteFill, hasArt && styles.gradientOverlay]}
      />
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

        {showBreathingSuggestion && (
          <View style={styles.breathingSuggestion}>
            <View style={styles.breathingSuggestionText}>
              <Text style={styles.breathingSuggestionTitle}>Kısa bir nefes molası ister misin?</Text>
              <Text style={styles.breathingSuggestionSubtitle}>1 dakikalık kutu nefesi zihnini sakinleştirebilir.</Text>
            </View>
            <TouchableOpacity
              style={styles.breathingSuggestionButton}
              onPress={() => {
                haptics.selection();
                setBreathingVisible(true);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Nefes egzersizini başlat"
            >
              <Text style={styles.breathingSuggestionButtonText}>Başla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowBreathingSuggestion(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Öneriyi kapat"
            >
              <Text style={styles.breathingSuggestionDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

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
      <BreathingExercise visible={breathingVisible} onClose={() => setBreathingVisible(false)} />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    gradientContainer: {
      flex: 1,
    },
    gradientOverlay: {
      opacity: 0.55,
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
    breathingSuggestion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    breathingSuggestionText: {
      flex: 1,
    },
    breathingSuggestionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    breathingSuggestionSubtitle: {
      fontSize: 11.5,
      color: colors.subtext,
      lineHeight: 15,
    },
    breathingSuggestionButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    breathingSuggestionButtonText: {
      color: colors.primaryText,
      fontSize: 12.5,
      fontWeight: '700',
    },
    breathingSuggestionDismiss: {
      fontSize: 15,
      color: colors.subtext,
      padding: 4,
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
