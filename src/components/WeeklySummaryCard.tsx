import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Note } from '../types/Note';
import { Summary } from '../types/Summary';
import { getWeeklySummary } from '../services/analysisService';
import { getSummaries, saveSummary } from '../storage/summaryStorage';
import { ThemeColors, useTheme } from '../context/ThemeContext';

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
      <Text style={styles.title}>Haftalık Duygu Özeti</Text>

      {weekNotes.length > 0 ? (
        <>
          <Text style={styles.subtitle}>
            Son 7 gündeki {weekNotes.length} not baz alınarak yapay zeka ile özet çıkarılır.
          </Text>

          {summary && <Text style={styles.summaryText}>{summary}</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
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
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Geçmiş özetleri gizle' : `Geçmiş özetler (${pastSummaries.length})`}
          </Text>
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
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: colors.subtext,
      marginBottom: 12,
    },
    summaryText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    errorText: {
      fontSize: 13,
      color: colors.danger,
      marginBottom: 12,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    historyToggle: {
      marginTop: 14,
      alignSelf: 'flex-start',
    },
    historyToggleText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    historyItem: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    historyDate: {
      fontSize: 11,
      color: colors.primary,
      marginBottom: 4,
      fontWeight: '600',
    },
    historyText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
  });
}
