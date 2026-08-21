import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { computeInsightStats, MIN_NOTES_FOR_INSIGHTS } from '../utils/insightStats';
import { getPatternInsights } from '../services/analysisService';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { cardShadow } from '../utils/shadow';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';
import { haptics } from '../utils/haptics';

export default function PatternInsightsCard({ notes }: { notes: Note[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (notes.length < MIN_NOTES_FOR_INSIGHTS) {
    return (
      <View style={[styles.card, styles.lockedCard]}>
        <View style={styles.titleRow}>
          <View style={styles.iconBadge}>
            <Ionicons name="lock-closed-outline" size={13} color={colors.subtext} />
          </View>
          <Text style={styles.eyebrowMuted}>YAPAY ZEKA · KİLİTLİ</Text>
        </View>
        <Text style={styles.title}>Duygu Haritan</Text>
        <Text style={styles.subtitle}>
          {notes.length}/{MIN_NOTES_FOR_INSIGHTS} not — {MIN_NOTES_FOR_INSIGHTS - notes.length}{' '}
          not daha yazınca notlarındaki örüntüleri analiz etmeye başlar.
        </Text>
        <View style={styles.lockedProgressTrack}>
          <View
            style={[
              styles.lockedProgressFill,
              { width: `${Math.min(100, (notes.length / MIN_NOTES_FOR_INSIGHTS) * 100)}%` },
            ]}
          />
        </View>
      </View>
    );
  }

  const handleGenerate = async () => {
    haptics.selection();
    setLoading(true);
    setError(null);
    try {
      const stats = computeInsightStats(notes);
      const result = await getPatternInsights(stats);
      if (result.length === 0) {
        setError('Şu an için anlamlı bir örüntü bulunamadı, daha sonra tekrar dene.');
      } else {
        setInsights(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İçgörüler oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="analytics-outline" size={14} color={colors.primary} />
        </View>
        <Text style={styles.eyebrow}>YAPAY ZEKA</Text>
      </View>
      <Text style={styles.title}>Duygu Haritan</Text>
      <Text style={styles.subtitle}>
        Notlarındaki örüntüleri (haftanın günleri, yazma uzunluğu gibi) analiz eder.
      </Text>

      {insights.length > 0 && (
        <View style={styles.insightsList}>
          {insights.map((insight, i) => (
            <View key={i} style={styles.insightItem}>
              <View style={styles.insightDot} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}

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
            {insights.length > 0 ? 'Yeniden Analiz Et' : 'Duygu Haritamı Oluştur'}
          </Text>
        )}
      </TouchableOpacity>
      {loading && insights.length === 0 && (
        <Text style={styles.coldStartHint}>
          İlk oluşturmada sunucu uyanıyor olabilir, biraz sürebilir.
        </Text>
      )}
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
    eyebrowMuted: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.subtext,
      letterSpacing: 1.1,
    },
    lockedCard: {
      opacity: 0.9,
    },
    lockedProgressTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    lockedProgressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.primary,
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
    insightsList: {
      marginBottom: 14,
      gap: 10,
    },
    insightItem: {
      flexDirection: 'row',
      gap: 9,
    },
    insightDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    insightText: {
      flex: 1,
      fontSize: 13.5,
      color: colors.text,
      lineHeight: 19,
    },
    errorText: {
      fontSize: 13,
      color: colors.danger,
      marginBottom: 12,
    },
    coldStartHint: {
      fontSize: 11,
      color: colors.subtext,
      textAlign: 'center',
      marginTop: 8,
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
  });
}
