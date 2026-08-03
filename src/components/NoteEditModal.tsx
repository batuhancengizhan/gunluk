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
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      maxHeight: '70%',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
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
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    saveText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
