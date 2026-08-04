import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { cardShadow } from '../utils/shadow';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';
import { haptics } from '../utils/haptics';

interface Props {
  note: Note | null;
  onClose: () => void;
  onSave: (id: string, text: string) => void;
}

export default function NoteEditModal({ note, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (note) {
      setText(note.text);
    }
  }, [note]);

  const handleSave = () => {
    if (!note) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(note.id, trimmed);
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
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Notu Düzenle</Text>
            <TouchableOpacity
              onPress={handleShare}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="share-outline" size={20} color={colors.subtext} />
            </TouchableOpacity>
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
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
