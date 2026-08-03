import { useMemo, useState } from 'react';
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
import { addNote } from '../storage/notesStorage';
import { ThemeColors, useTheme } from '../context/ThemeContext';

export default function WriteNoteScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Boş not', 'Kaydetmeden önce bir şeyler yazmalısın.');
      return;
    }
    setSaving(true);
    try {
      await addNote(trimmed);
      setText('');
      Alert.alert('Kaydedildi', 'Günlük notun kaydedildi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Bugün nasıl hissediyorsun?</Text>
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
      >
        <Text style={styles.buttonText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 16,
      marginTop: 8,
      color: colors.text,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      backgroundColor: colors.card,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
