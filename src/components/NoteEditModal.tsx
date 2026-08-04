import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { cardShadow } from '../utils/shadow';

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

  return (
    <Modal visible={!!note} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Notu Düzenle</Text>
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
    title: {
      fontSize: 19,
      fontWeight: '700',
      marginBottom: 14,
      color: colors.text,
      letterSpacing: -0.2,
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
