import { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { clearAllNotes } from '../storage/notesStorage';
import { ThemeColors, ThemeMode, useTheme } from '../context/ThemeContext';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
  { value: 'system', label: 'Sistem' },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handleClearAll = () => {
    Alert.alert(
      'Tüm notları sil',
      'Bu işlem tüm günlük notlarını kalıcı olarak silecek. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hepsini Sil',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotes();
            Alert.alert('Tamamlandı', 'Tüm notlar silindi.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ayarlar</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Görünüm</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const active = mode === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.themeOption, active && styles.themeOptionActive]}
                onPress={() => setMode(option.value)}
              >
                <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hakkında</Text>
        <Text style={styles.sectionText}>Günlük Asistan v1.0.0</Text>
        <Text style={styles.sectionText}>
          Notlarını yaz, geçmişini incele. Geçmiş Notlar sekmesinden yapay
          zeka destekli haftalık duygu durumu özeti oluşturabilirsin.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veri</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll}>
          <Text style={styles.dangerButtonText}>Tüm Notları Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
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
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 24,
      marginTop: 8,
      color: colors.text,
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.subtext,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    sectionText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 6,
      lineHeight: 20,
    },
    themeRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    themeOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: 'center',
    },
    themeOptionActive: {
      backgroundColor: colors.primary,
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.subtext,
    },
    themeOptionTextActive: {
      color: colors.primaryText,
    },
    dangerButton: {
      backgroundColor: colors.dangerBg,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    dangerButtonText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
