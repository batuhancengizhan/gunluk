import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Note } from '../types/Note';
import { Summary } from '../types/Summary';
import { getWeeklySummary } from '../services/analysisService';
import { getSummaries, saveSummary } from '../storage/summaryStorage';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { cardShadow } from '../utils/shadow';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';

function getLastWeekNotes(notes: Note[]): Note[] {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return notes.filter((note) => new Date(note.createdAt).getTime() >= oneWeekAgo);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WeeklySummaryCard({ notes }: { notes: Note[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastSummaries, setPastSummaries] = useState<Summary[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const weekNotes = getLastWeekNotes(notes);

  const loadPastSummaries = useCallback(async () => {
    const data = await getSummaries();
    setPastSummaries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPastSummaries();
    }, [loadPastSummaries])
  );

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWeeklySummary(weekNotes);
      setSummary(result);
      await saveSummary(result, weekNotes.length);
      await loadPastSummaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Özet oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  if (weekNotes.length === 0 && pastSummaries.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </View>
        <Text style={styles.eyebrow}>YAPAY ZEKA</Text>
      </View>
      <Text style={styles.title}>Haftalık Duygu Özeti</Text>

      {weekNotes.length > 0 ? (
        <>
          <Text style={styles.subtitle}>
            Son 7 gündeki {weekNotes.length} not baz alınarak özet çıkarılır.
          </Text>

          {summary && <Text style={styles.summaryText}>{summary}</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.buttonText}>
                {summary ? 'Özeti Yenile' : 'Özeti Oluştur'}
              </Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.subtitle}>Son 7 günde not bulunmuyor.</Text>
      )}

      {pastSummaries.length > 0 && (
        <TouchableOpacity
          style={styles.historyToggle}
          onPress={() => setShowHistory((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={
            showHistory ? 'Geçmiş özetleri gizle' : `Geçmiş özetler, ${pastSummaries.length} adet`
          }
          accessibilityState={{ expanded: showHistory }}
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Geçmiş özetleri gizle' : `Geçmiş özetler (${pastSummaries.length})`}
          </Text>
          <Ionicons
            name={showHistory ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}

      {showHistory &&
        pastSummaries.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={styles.historyDate}>
              {formatDate(item.createdAt)} · {item.noteCount} not
            </Text>
            <Text style={styles.historyText}>{item.text}</Text>
          </View>
        ))}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...cardShadow(colors),
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    iconBadge: {
      width: 20,
      height: 20,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyebrow: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.1,
    },
    title: {
      fontSize: 19,
      fontFamily: FONT_DISPLAY_SEMIBOLD,
      color: colors.text,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 12.5,
      color: colors.subtext,
      marginBottom: 14,
      lineHeight: 17,
    },
    summaryText: {
      fontSize: 14.5,
      color: colors.text,
      lineHeight: 21,
      marginBottom: 14,
    },
    errorText: {
      fontSize: 13,
      color: colors.danger,
      marginBottom: 12,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      ...cardShadow(colors),
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: colors.primaryText,
      fontSize: 14.5,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    historyToggle: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
    },
    historyToggleText: {
      color: colors.primary,
      fontSize: 12.5,
      fontWeight: '600',
    },
    historyItem: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    historyDate: {
      fontSize: 10.5,
      color: colors.primary,
      marginBottom: 4,
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    historyText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
  });
}
