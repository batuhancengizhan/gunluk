import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clearAllNotes } from '../storage/notesStorage';
import { ThemeColors, ThemeMode, useTheme } from '../context/ThemeContext';
import { useBackgroundTheme } from '../context/BackgroundThemeContext';
import { BACKGROUND_THEMES } from '../constants/backgroundThemes';
import { cardShadow, softShadow } from '../utils/shadow';
import {
  disableDailyReminder,
  enableDailyReminder,
  getReminderSettings,
} from '../services/notificationService';
import { useAppLock } from '../context/AppLockContext';
import PinSetupModal from '../components/PinSetupModal';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
  { value: 'system', label: 'Sistem' },
];

const TIME_PRESETS: { label: string; hour: number; minute: number }[] = [
  { label: 'Sabah 09:00', hour: 9, minute: 0 },
  { label: 'Öğlen 13:00', hour: 13, minute: 0 },
  { label: 'Akşam 20:00', hour: 20, minute: 0 },
  { label: 'Gece 22:00', hour: 22, minute: 0 },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { backgroundThemeId, setBackgroundThemeId } = useBackgroundTheme();
  const { lockEnabled, setPin, disableLock } = useAppLock();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [pinSetupVisible, setPinSetupVisible] = useState(false);

  useEffect(() => {
    getReminderSettings().then((settings) => {
      setReminderEnabled(settings.enabled);
      setReminderHour(settings.hour);
      setReminderMinute(settings.minute);
    });
  }, []);

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await enableDailyReminder(reminderHour, reminderMinute);
      if (!granted) {
        Alert.alert(
          'İzin gerekli',
          'Hatırlatıcı gönderebilmemiz için bildirim iznine ihtiyacımız var. Telefon ayarlarından izin verebilirsin.'
        );
        return;
      }
      setReminderEnabled(true);
    } else {
      await disableDailyReminder();
      setReminderEnabled(false);
    }
  };

  const handlePickTime = async (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    if (reminderEnabled) {
      await enableDailyReminder(hour, minute);
    }
  };

  const handleToggleLock = (value: boolean) => {
    if (value) {
      setPinSetupVisible(true);
    } else {
      Alert.alert('Kilidi kapat', 'Uygulama kilidini kapatmak istediğine emin misin?', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Kapat', style: 'destructive', onPress: () => disableLock() },
      ]);
    }
  };

  const handlePinConfirm = async (pin: string) => {
    await setPin(pin);
    setPinSetupVisible(false);
    Alert.alert('Kilit Etkin', 'Uygulama artık bir PIN ile korunuyor.');
  };

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
                activeOpacity={0.85}
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
        <Text style={styles.sectionTitle}>Not Yaz Arka Planı</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.swatchRow}>
            {BACKGROUND_THEMES.map((bg) => {
              const active = backgroundThemeId === bg.id;
              return (
                <TouchableOpacity
                  key={bg.id}
                  style={styles.swatchItem}
                  onPress={() => setBackgroundThemeId(bg.id)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={bg.colors}
                    style={[styles.swatch, active && styles.swatchActive]}
                  />
                  <Text style={[styles.swatchLabel, active && styles.swatchLabelActive]}>
                    {bg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hatırlatıcılar</Text>
        <View style={styles.infoCard}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderTextGroup}>
              <Text style={styles.appName}>Günlük Yazma Hatırlatıcısı</Text>
              <Text style={styles.reminderSubtext}>
                Her gün seçtiğin saatte nazik bir hatırlatma alırsın.
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryText}
            />
          </View>

          {reminderEnabled && (
            <View style={styles.timePresetRow}>
              {TIME_PRESETS.map((preset) => {
                const active = preset.hour === reminderHour && preset.minute === reminderMinute;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.timePreset, active && styles.timePresetActive]}
                    onPress={() => handlePickTime(preset.hour, preset.minute)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.timePresetText, active && styles.timePresetTextActive]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gizlilik</Text>
        <View style={styles.infoCard}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderTextGroup}>
              <Text style={styles.appName}>Uygulama Kilidi</Text>
              <Text style={styles.reminderSubtext}>
                Açıkken uygulamaya her girişte 4 haneli PIN istenir.
              </Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={handleToggleLock}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryText}
            />
          </View>
        </View>
      </View>

      <PinSetupModal
        visible={pinSetupVisible}
        onClose={() => setPinSetupVisible(false)}
        onConfirm={handlePinConfirm}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hakkında</Text>
        <View style={styles.infoCard}>
          <Text style={styles.appName}>Günlük Asistan</Text>
          <Text style={styles.sectionText}>Sürüm 1.0.0</Text>
          <Text style={[styles.sectionText, styles.infoBody]}>
            Notlarını yaz, geçmişini incele. Geçmiş Notlar sekmesinden yapay
            zeka destekli haftalık duygu durumu özeti oluşturabilirsin.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veri</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll} activeOpacity={0.85}>
          <Text style={styles.dangerButtonText}>Tüm Notları Sil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      marginBottom: 26,
      marginTop: 8,
      color: colors.text,
      letterSpacing: -0.4,
    },
    section: {
      marginBottom: 26,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
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
      borderRadius: 14,
      padding: 4,
      gap: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    themeOption: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 11,
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
    swatchRow: {
      flexDirection: 'row',
      gap: 16,
      paddingVertical: 4,
    },
    swatchItem: {
      alignItems: 'center',
      width: 64,
    },
    swatch: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: 'transparent',
      ...softShadow(colors),
    },
    swatchActive: {
      borderColor: colors.primary,
    },
    swatchLabel: {
      fontSize: 11,
      color: colors.subtext,
      marginTop: 7,
      textAlign: 'center',
    },
    swatchLabelActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    appName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    infoBody: {
      marginTop: 6,
      color: colors.subtext,
    },
    reminderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    reminderTextGroup: {
      flex: 1,
    },
    reminderSubtext: {
      fontSize: 12.5,
      color: colors.subtext,
      marginTop: 3,
      lineHeight: 17,
    },
    timePresetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    timePreset: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    timePresetActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timePresetText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.subtext,
    },
    timePresetTextActive: {
      color: colors.primaryText,
    },
    dangerButton: {
      backgroundColor: colors.dangerBg,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      ...softShadow(colors),
    },
    dangerButtonText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
