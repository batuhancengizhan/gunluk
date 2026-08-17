import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Platform, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { clearAllNotes, getNotes, mergeNotesFromBackup } from '../storage/notesStorage';
import { formatNotesForExport } from '../utils/exportNotes';
import { pickNotesBackup, shareNotesBackup } from '../utils/backup';
import { Note } from '../types/Note';
import { ThemeColors, ThemeMode, useTheme } from '../context/ThemeContext';
import { useBackgroundTheme } from '../context/BackgroundThemeContext';
import { BACKGROUND_THEMES } from '../constants/backgroundThemes';
import { cardShadow, softShadow } from '../utils/shadow';
import {
  disableDailyReminder,
  enableDailyReminder,
  getReminderSettings,
  refreshMoodTips,
  shouldRefreshMoodTips,
} from '../services/notificationService';
import { useAppLock } from '../context/AppLockContext';
import { haptics } from '../utils/haptics';
import { useToast } from '../context/ToastContext';
import { FONT_DISPLAY_EXTRABOLD } from '../constants/fonts';
import PinSetupModal from '../components/PinSetupModal';
import StatsGrid from '../components/StatsGrid';

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
  const {
    lockEnabled,
    setPin,
    disableLock,
    biometricSupported,
    biometricEnabled,
    setBiometricEnabled,
  } = useAppLock();
  const { showToast } = useToast();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [pinSetupVisible, setPinSetupVisible] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tipsRefreshing, setTipsRefreshing] = useState(false);
  const [backupWorking, setBackupWorking] = useState(false);
  const [restoreWorking, setRestoreWorking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getNotes().then(async (data) => {
        setNotes(data);
        const settings = await getReminderSettings();
        if (settings.enabled && (await shouldRefreshMoodTips())) {
          refreshMoodTips(data).catch(() => {});
        }
      });
    }, [])
  );

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
      refreshMoodTips(notes).catch(() => {});
    } else {
      await disableDailyReminder();
      setReminderEnabled(false);
    }
  };

  const handleRefreshTips = async () => {
    setTipsRefreshing(true);
    try {
      await refreshMoodTips(notes);
      showToast('Öneriler ruh durumuna göre güncellendi.');
    } catch {
      showToast('Öneriler güncellenemedi, tekrar dene.');
    } finally {
      setTipsRefreshing(false);
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

  const handleToggleBiometric = async (value: boolean) => {
    haptics.selection();
    await setBiometricEnabled(value);
    showToast(value ? 'Face ID / Parmak İzi ile açma etkin.' : 'Face ID / Parmak İzi ile açma kapatıldı.');
  };

  const handlePinConfirm = async (pin: string) => {
    await setPin(pin);
    setPinSetupVisible(false);
    showToast('Uygulama artık bir PIN ile korunuyor.');
  };

  const handleExport = async () => {
    const notes = await getNotes();
    if (notes.length === 0) {
      showToast('Dışa aktarılacak henüz bir notun yok.');
      return;
    }
    try {
      await Share.share({ message: formatNotesForExport(notes) });
    } catch {
      showToast('Notlar dışa aktarılamadı.');
    }
  };

  const handleBackup = async () => {
    const currentNotes = await getNotes();
    if (currentNotes.length === 0) {
      showToast('Yedeklenecek henüz bir notun yok.');
      return;
    }
    setBackupWorking(true);
    try {
      await shareNotesBackup(currentNotes);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Yedek dosyası oluşturulamadı.');
    } finally {
      setBackupWorking(false);
    }
  };

  const handleRestore = async () => {
    setRestoreWorking(true);
    try {
      const backupNotes = await pickNotesBackup();
      if (!backupNotes) return;
      const { added, skipped } = await mergeNotesFromBackup(backupNotes);
      const refreshed = await getNotes();
      setNotes(refreshed);
      if (added === 0) {
        showToast('Yeni not bulunamadı, yedekteki tüm notlar zaten cihazında.');
      } else {
        showToast(
          `${added} not geri yüklendi${skipped > 0 ? ` (${skipped} tanesi zaten vardı)` : ''}.`
        );
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Yedek dosyası okunamadı.');
    } finally {
      setRestoreWorking(false);
    }
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
            showToast('Tüm notlar silindi.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ayarlar</Text>

      {notes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İstatistikler</Text>
          <StatsGrid notes={notes} />
        </View>
      )}

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
                accessibilityRole="button"
                accessibilityLabel={`${option.label} tema`}
                accessibilityState={{ selected: active }}
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
                  accessibilityRole="button"
                  accessibilityLabel={`${bg.label} arka planı`}
                  accessibilityState={{ selected: active }}
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
                Yapay zeka, ruh haline göre kişiselleştirdiği öğütleri her gün
                seçtiğin saatte gönderir.
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryText}
              accessibilityLabel="Günlük yazma hatırlatıcısı"
              accessibilityHint={reminderEnabled ? 'Kapatmak için dokun' : 'Açmak için dokun'}
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

          {reminderEnabled && (
            <TouchableOpacity
              style={styles.refreshTipsButton}
              onPress={handleRefreshTips}
              disabled={tipsRefreshing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Önerileri şimdi güncelle"
            >
              {tipsRefreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
              )}
              <Text style={styles.refreshTipsText}>
                {tipsRefreshing ? 'Öneriler güncelleniyor...' : 'Önerileri şimdi güncelle'}
              </Text>
            </TouchableOpacity>
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
              accessibilityLabel="Uygulama kilidi"
              accessibilityHint={lockEnabled ? 'Kapatmak için dokun' : 'Açmak için dokun'}
            />
          </View>

          {lockEnabled && biometricSupported && (
            <View style={styles.biometricRow}>
              <View style={styles.reminderTextGroup}>
                <Text style={styles.appName}>Face ID / Parmak İzi ile Aç</Text>
                <Text style={styles.reminderSubtext}>
                  Kilit ekranında PIN yerine biyometrik doğrulamayı dene.
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.primaryText}
                accessibilityLabel="Face ID veya parmak izi ile açma"
                accessibilityHint={biometricEnabled ? 'Kapatmak için dokun' : 'Açmak için dokun'}
              />
            </View>
          )}
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
        {Platform.OS !== 'web' && (
          <>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleBackup}
              disabled={backupWorking}
              activeOpacity={0.85}
            >
              {backupWorking ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.exportButtonText}>Yedek Dosyası Oluştur</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, styles.dataButtonSpacing]}
              onPress={handleRestore}
              disabled={restoreWorking}
              activeOpacity={0.85}
            >
              {restoreWorking ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.exportButtonText}>Yedekten Geri Yükle</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.exportButton, Platform.OS !== 'web' && styles.dataButtonSpacing]}
          onPress={handleExport}
          activeOpacity={0.85}
        >
          <Text style={styles.exportButtonText}>Notları Metin Olarak Paylaş</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dangerButton, styles.dataButtonSpacing]}
          onPress={handleClearAll}
          activeOpacity={0.85}
        >
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
      fontSize: 30,
      fontFamily: FONT_DISPLAY_EXTRABOLD,
      marginBottom: 26,
      marginTop: 8,
      color: colors.text,
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
    biometricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    reminderTextGroup: {
      flex: 1,
    },
    refreshTipsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    refreshTipsText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.primary,
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
    exportButton: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    exportButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    dataButtonSpacing: {
      marginTop: 10,
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
