import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { ChatMessage } from '../types/ChatMessage';
import { getNotes } from '../storage/notesStorage';
import { appendChatMessage, clearChatMessages, getChatMessages } from '../storage/chatStorage';
import { sendChatMessage } from '../services/analysisService';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { cardShadow } from '../utils/shadow';
import { haptics } from '../utils/haptics';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';

const STARTER_PROMPTS = [
  'Bu hafta nasıl geçti?',
  'En çok hangi gün kendimi iyi hissediyorum?',
  'Son zamanlarda hangi konular aklımı meşgul ediyor?',
  'Bana kısaca kim olduğumu anlat.',
];

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export default function AssistantScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      getNotes().then(setNotes);
      getChatMessages().then(setMessages);
    }, [])
  );

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handleSend = async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || sending) return;

    haptics.selection();
    setError(null);
    setInput('');

    const userMessage = createMessage('user', trimmed);
    const updated = await appendChatMessage(userMessage);
    setMessages(updated);
    scrollToEnd();

    setSending(true);
    try {
      const reply = await sendChatMessage(notes, updated);
      const assistantMessage = createMessage('assistant', reply || 'Şu an bir yanıt veremedim.');
      const withReply = await appendChatMessage(assistantMessage);
      setMessages(withReply);
      haptics.selection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yanıt alınamadı.');
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const handleClear = () => {
    Alert.alert('Sohbeti temizle', 'Bu sohbetteki tüm mesajlar silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Temizle',
        style: 'destructive',
        onPress: async () => {
          await clearChatMessages();
          setMessages([]);
          haptics.warning();
        },
      },
    ]);
  };

  const isEmpty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Asistan</Text>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Sohbeti temizle"
          >
            <Ionicons name="trash-outline" size={19} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToEnd}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Notların hakkında konuşalım</Text>
            <Text style={styles.emptySubtitle}>
              {notes.length === 0
                ? 'Henüz günlük notun yok — birkaç not yazınca seninle onlar hakkında konuşabilirim.'
                : 'Geçmiş notlarına dayanarak sorularını yanıtlarım. Sadece yazdıklarınla sınırlı kalırım.'}
            </Text>
            <View style={styles.starterList}>
              {STARTER_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.starterChip}
                  onPress={() => handleSend(prompt)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.starterChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.bubbleRow,
                message.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAssistant,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  message.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    message.role === 'user' && styles.bubbleTextUser,
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))
        )}

        {sending && (
          <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
            <View style={[styles.bubble, styles.bubbleAssistant, styles.bubbleLoading]}>
              <ActivityIndicator size="small" color={colors.subtext} />
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      {isEmpty && (
        <Text style={styles.coldStartHint}>
          İlk mesajın biraz uzun sürebilir — sunucu uyanıyor olabilir.
        </Text>
      )}

      <View style={styles.composerRow}>
        <TextInput
          style={styles.composerInput}
          placeholder="Bir şey sor..."
          placeholderTextColor={colors.subtext}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonIdle]}
          onPress={() => handleSend()}
          disabled={sending || !input.trim()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Mesajı gönder"
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.primaryText} />
          ) : (
            <Ionicons name="arrow-up" size={18} color={colors.primaryText} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    title: {
      fontSize: 23,
      fontFamily: FONT_DISPLAY_SEMIBOLD,
      letterSpacing: -0.6,
      color: colors.text,
    },
    messages: {
      flex: 1,
    },
    messagesContent: {
      paddingHorizontal: 20,
      paddingBottom: 12,
      gap: 10,
    },
    emptyState: {
      alignItems: 'center',
      paddingTop: 32,
      paddingHorizontal: 8,
    },
    emptyIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 17,
      fontFamily: FONT_DISPLAY_SEMIBOLD,
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 22,
    },
    starterList: {
      width: '100%',
      gap: 8,
    },
    starterChip: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    starterChipText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: colors.text,
    },
    bubbleRow: {
      flexDirection: 'row',
    },
    bubbleRowUser: {
      justifyContent: 'flex-end',
    },
    bubbleRowAssistant: {
      justifyContent: 'flex-start',
    },
    bubble: {
      maxWidth: '82%',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleUser: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleLoading: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    bubbleText: {
      fontSize: 14.5,
      lineHeight: 20,
      color: colors.text,
    },
    bubbleTextUser: {
      color: colors.primaryText,
    },
    errorText: {
      fontSize: 12.5,
      color: colors.danger,
      textAlign: 'center',
      marginTop: 4,
    },
    coldStartHint: {
      fontSize: 11,
      color: colors.subtext,
      textAlign: 'center',
      paddingBottom: 8,
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    composerInput: {
      flex: 1,
      maxHeight: 100,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14.5,
      color: colors.text,
    },
    sendButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      ...cardShadow(colors),
    },
    sendButtonIdle: {
      opacity: 0.45,
    },
  });
}
