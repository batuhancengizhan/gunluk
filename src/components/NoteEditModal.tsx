import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { cardShadow } from '../utils/shadow';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';
import { haptics } from '../utils/haptics';
import { useToast } from '../context/ToastContext';
import PhotoAttachment from './PhotoAttachment';
import { extractTags } from '../utils/tags';

interface Props {
  note: Note | null;
  onClose: () => void;
  onSave: (id: string, text: string, photoUri: string | null) => void;
}

export default function NoteEditModal({ note, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [text, setText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setText(note.text);
      setPhotoUri(note.photoUri ?? null);
    }
  }, [note]);

  const liveTags = useMemo(() => extractTags(text), [text]);

  const handleSave = () => {
    if (!note) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(note.id, trimmed, photoUri);
  };

  const handleShare = () => {
    if (!note) return;
    haptics.selection();
    const date = new Date(note.createdAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const moodTag = note.mood ? ` ${note.mood}` : '';
    Share.share({ message: `${date}${moodTag}\n\n${text}` }).catch(() => {});
  };

  return (
    <Modal visible={!!note} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { paddingBottom: 22 + insets.bottom }]}>
          <View style={styles.grabber} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Notu Düzenle</Text>
            <TouchableOpacity
              onPress={handleShare}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Notu paylaş"
            >
              <Ionicons name="share-outline" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>
          <View style={styles.photoRow}>
            <PhotoAttachment
              photoUri={photoUri}
              onChange={setPhotoUri}
              onError={(message) => showToast(message)}
            />
          </View>
          <TextInput
            style={styles.input}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
            placeholderTextColor={colors.subtext}
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
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 22,
      paddingTop: 14,
      maxHeight: '70%',
      ...cardShadow(colors),
    },
    grabber: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    title: {
      fontSize: 19,
      fontFamily: FONT_DISPLAY_SEMIBOLD,
      color: colors.text,
    },
    photoRow: {
      marginBottom: 12,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      fontSize: 15.5,
      lineHeight: 22,
      minHeight: 120,
      backgroundColor: colors.card,
      color: colors.text,
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
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
      gap: 12,
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    cancelText: {
      color: colors.subtext,
      fontSize: 15,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 22,
    },
    saveText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
