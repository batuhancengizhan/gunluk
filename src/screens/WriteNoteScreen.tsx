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
import PhotoAttachment from '../components/PhotoAttachment';
import VoiceNoteAttachment from '../components/VoiceNoteAttachment';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { useBackgroundTheme } from '../context/BackgroundThemeContext';
import { useToast } from '../context/ToastContext';
import { calculateStreak, getStreakMilestoneMessage } from '../utils/streak';
import { calculateLongestStreak, getNoteCountMilestoneMessage } from '../utils/stats';
import { cardShadow, softShadow } from '../utils/shadow';
import {
  getCachedPrompts,
  pickRandomPrompts,
  refreshPersonalizedPrompts,
  shouldRefreshPrompts,
} from '../services/promptsService';
import { getTodaysGreeting, requestNotificationPermission } from '../services/notificationService';
import { TIME_CAPSULE_OPTIONS, scheduleTimeCapsuleNotification } from '../utils/timeCapsule';
import { ENTRY_TEMPLATES, EntryTemplate } from '../constants/templates';
import { extractTags } from '../utils/tags';
import { Ionicons } from '@expo/vector-icons';
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [greeting, setGreeting] = useState('');
  const [showBreathingSuggestion, setShowBreathingSuggestion] = useState(false);
  const [breathingVisible, setBreathingVisible] = useState(false);
  const [capsuleOptionId, setCapsuleOptionId] = useState<string | null>(null);
  const [showCapsuleOptions, setShowCapsuleOptions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      getTodaysGreeting().then(setGreeting);
      getNotes().then(async (notes) => {
        setStreak(calculateStreak(notes));
        const cached = await getCachedPrompts();
        setPrompts(pickRandomPrompts(cached, 3));
        if (await shouldRefreshPrompts()) {
          refreshPersonalizedPrompts(notes)
            .then((fresh) => setPrompts(pickRandomPrompts(fresh, 3)))
            .catch(() => {});
        }
      });
    }, [])
  );

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [text]);

  const liveTags = useMemo(() => extractTags(text), [text]);

  const handlePromptPress = (prompt: string) => {
    haptics.selection();
    setText((prev) => (prev ? prev : `${prompt}\n`));
    inputRef.current?.focus();
  };

  const handleTemplatePress = (template: EntryTemplate) => {
    haptics.selection();
    setText(template.skeleton);
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

      let revealAt: string | undefined;
      const capsuleOption = TIME_CAPSULE_OPTIONS.find((o) => o.id === capsuleOptionId);
      if (capsuleOption) {
        revealAt = capsuleOption.computeDate(new Date()).toISOString();
      }

      const createdNote = await addNote(trimmed, {
        mood,
        photoUri: photoUri ?? undefined,
        audioUri: audioUri ?? undefined,
        revealAt,
      });

      let capsuleMessage: string | null = null;
      if (revealAt) {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleTimeCapsuleNotification(createdNote);
          capsuleMessage = `Bu not ${capsuleOption?.label.toLowerCase()} karşına çıkacak 📮`;
        }
      }

      setText('');
      setMood(undefined);
      setPhotoUri(null);
      setAudioUri(null);
      setCapsuleOptionId(null);
      setShowCapsuleOptions(false);
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
      } else if (capsuleMessage) {
        showToast(capsuleMessage, { duration: 3200 });
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
        {greeting.length > 0 && <Text style={styles.greeting}>{greeting}</Text>}

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

        <View style={styles.photoRow}>
          <PhotoAttachment
            photoUri={photoUri}
            onChange={setPhotoUri}
            onError={(message) => showToast(message)}
          />
        </View>

        <View style={styles.photoRow}>
          <VoiceNoteAttachment
            audioUri={audioUri}
            onChange={setAudioUri}
            onError={(message) => showToast(message)}
          />
        </View>

        <TouchableOpacity
          style={styles.capsuleToggle}
          onPress={() => {
            haptics.selection();
            if (capsuleOptionId) {
              setCapsuleOptionId(null);
              setShowCapsuleOptions(false);
            } else {
              setShowCapsuleOptions((prev) => !prev);
            }
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Geleceğe mektup"
          accessibilityState={{ selected: !!capsuleOptionId }}
        >
          <Ionicons
            name={capsuleOptionId ? 'mail-open-outline' : 'mail-outline'}
            size={14}
            color={capsuleOptionId ? colors.primary : colors.subtext}
          />
          <Text style={[styles.capsuleToggleText, capsuleOptionId && styles.capsuleToggleTextActive]}>
            {capsuleOptionId
              ? `Geleceğe mektup: ${TIME_CAPSULE_OPTIONS.find((o) => o.id === capsuleOptionId)?.label}`
              : 'Bunu gelecekte bana hatırlat'}
          </Text>
        </TouchableOpacity>

        {showCapsuleOptions && !capsuleOptionId && (
          <View style={styles.capsuleOptionsRow}>
            {TIME_CAPSULE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.capsuleOptionChip}
                onPress={() => {
                  haptics.selection();
                  setCapsuleOptionId(option.id);
                  setShowCapsuleOptions(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.capsuleOptionChipText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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

        {text.length === 0 && (prompts.length > 0 || ENTRY_TEMPLATES.length > 0) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptScroll}
            contentContainerStyle={styles.promptRow}
          >
            {ENTRY_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateChip}
                onPress={() => handleTemplatePress(template)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${template.label} şablonuyla yaz`}
              >
                <Ionicons name={template.icon as never} size={13} color={colors.primary} />
                <Text style={styles.templateChipText}>{template.label}</Text>
              </TouchableOpacity>
            ))}
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
          placeholder="Günlük notunu buraya yaz... (#etiket ekleyebilirsin)"
          placeholderTextColor={colors.subtext}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
        {liveTags.length > 0 && (
          <View style={styles.liveTagRow}>
            {liveTags.map((tag) => (
              <View key={tag} style={styles.liveTagChip}>
                <Text style={styles.liveTagChipText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
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
    greeting: {
      fontSize: 13,
      color: colors.subtext,
      marginBottom: 16,
      lineHeight: 18,
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
    photoRow: {
      marginBottom: 14,
    },
    capsuleToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginBottom: 10,
      paddingVertical: 4,
    },
    capsuleToggleText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.subtext,
    },
    capsuleToggleTextActive: {
      color: colors.primary,
    },
    capsuleOptionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    capsuleOptionChip: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    capsuleOptionChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
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
    templateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.favoriteBg,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    templateChipText: {
      fontSize: 12.5,
      color: colors.primary,
      fontWeight: '700',
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
    liveTagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
    },
    liveTagChip: {
      backgroundColor: colors.favoriteBg,
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    liveTagChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.favorite,
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
