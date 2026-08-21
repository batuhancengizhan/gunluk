import { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { computeJournalOverview } from '../utils/journalOverview';
import { moodLabel } from '../constants/moods';
import { FONT_DISPLAY_EXTRABOLD } from '../constants/fonts';

interface Props {
  visible: boolean;
  onClose: () => void;
  notes: Note[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function JournalOverviewModal({ visible, onClose, notes }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const overview = useMemo(() => computeJournalOverview(notes), [notes]);

  if (!visible) return null;

  const topTagCount = overview.topTags[0]?.count ?? 0;
  const topMoodCount = overview.moodBreakdown[0]?.count ?? 0;
  const maxWeekdayCount = Math.max(1, ...overview.weekdayBreakdown.map((w) => w.count));

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>İstatistiklerim</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <Ionicons name="close" size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {overview.firstEntryDate && (
            <View style={styles.heroCard}>
              <Text style={styles.heroNumber}>{overview.daysSinceFirstEntry}</Text>
              <Text style={styles.heroLabel}>gündür günlük tutuyorsun</Text>
              <Text style={styles.heroSubtext}>
                İlk notun: {formatDate(overview.firstEntryDate)}
              </Text>
            </View>
          )}

          <View style={styles.miniTileRow}>
            <View style={styles.miniTile}>
              <Text style={styles.miniTileValue}>{overview.longestNoteWordCount}</Text>
              <Text style={styles.miniTileLabel}>En Uzun Not (kelime)</Text>
            </View>
            <View style={styles.miniTile}>
              <Text style={styles.miniTileValue}>{overview.photoCount}</Text>
              <Text style={styles.miniTileLabel}>Fotoğraflı Not</Text>
            </View>
            <View style={styles.miniTile}>
              <Text style={styles.miniTileValue}>{overview.audioCount}</Text>
              <Text style={styles.miniTileLabel}>Sesli Not</Text>
            </View>
          </View>

          {overview.topTags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>En Çok Kullandığın Etiketler</Text>
              <View style={styles.card}>
                {overview.topTags.map((item) => (
                  <View key={item.tag} style={styles.barRow}>
                    <Text style={styles.barLabel}>#{item.tag}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(8, (item.count / topTagCount) * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.barCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {overview.moodBreakdown.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ruh Hali Dağılımı</Text>
              <View style={styles.card}>
                {overview.moodBreakdown.map((item) => (
                  <View key={item.emoji} style={styles.barRow}>
                    <Text style={styles.barLabel}>
                      {item.emoji} {moodLabel(item.emoji)}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFillFavorite,
                          { width: `${Math.max(8, (item.count / topMoodCount) * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.barCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Haftanın Günlerine Göre Yazma
              {overview.mostActiveWeekday ? ` · En çok ${overview.mostActiveWeekday}` : ''}
            </Text>
            <View style={styles.card}>
              <View style={styles.weekdayRow}>
                {overview.weekdayBreakdown.map((item) => (
                  <View key={item.weekday} style={styles.weekdayColumn}>
                    <View style={styles.weekdayBarTrack}>
                      <View
                        style={[
                          styles.weekdayBarFill,
                          { height: `${Math.max(6, (item.count / maxWeekdayCount) * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.weekdayLabel}>{item.shortLabel}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: FONT_DISPLAY_EXTRABOLD,
      color: colors.text,
    },
    content: {
      paddingBottom: 40,
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 26,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    heroNumber: {
      fontSize: 44,
      fontFamily: FONT_DISPLAY_EXTRABOLD,
      color: colors.primary,
      letterSpacing: -1,
    },
    heroLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginTop: 2,
    },
    heroSubtext: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 8,
    },
    miniTileRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    miniTile: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    miniTileValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 4,
    },
    miniTileLabel: {
      fontSize: 10,
      color: colors.subtext,
      textAlign: 'center',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    section: {
      marginTop: 22,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    barLabel: {
      width: 92,
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text,
    },
    barTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    barFillFavorite: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: colors.favorite,
    },
    barCount: {
      width: 22,
      fontSize: 12,
      fontWeight: '700',
      color: colors.subtext,
      textAlign: 'right',
    },
    weekdayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 110,
    },
    weekdayColumn: {
      alignItems: 'center',
      flex: 1,
    },
    weekdayBarTrack: {
      width: 14,
      height: 80,
      borderRadius: 7,
      backgroundColor: colors.background,
      justifyContent: 'flex-end',
      overflow: 'hidden',
      marginBottom: 8,
    },
    weekdayBarFill: {
      width: '100%',
      borderRadius: 7,
      backgroundColor: colors.primary,
    },
    weekdayLabel: {
      fontSize: 10.5,
      fontWeight: '600',
      color: colors.subtext,
    },
  });
}
