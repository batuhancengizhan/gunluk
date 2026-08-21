import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { cardShadow } from '../utils/shadow';
import { computeMoodTrendPoints, MIN_NOTES_FOR_MOOD_TREND } from '../utils/moodTrend';

const CHART_WIDTH = 300;
const CHART_HEIGHT = 100;
const PADDING_Y = 14;

function valueToY(value: number): number {
  const usable = CHART_HEIGHT - PADDING_Y * 2;
  return PADDING_Y + ((1 - value) / 2) * usable;
}

export default function MoodTrendChart({ notes }: { notes: Note[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const points = useMemo(() => computeMoodTrendPoints(notes), [notes]);

  if (points.length < MIN_NOTES_FOR_MOOD_TREND) {
    return null;
  }

  const stepX = points.length > 1 ? CHART_WIDTH / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: points.length > 1 ? i * stepX : CHART_WIDTH / 2,
    y: valueToY(p.value),
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)},${CHART_HEIGHT} L ${coords[0].x.toFixed(1)},${CHART_HEIGHT} Z`
      : '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ruh Hali Eğilimi</Text>
      <View style={styles.card}>
        <View style={styles.chartRow}>
          <View style={styles.axisLabels}>
            <Text style={styles.axisLabel}>+</Text>
            <Text style={styles.axisLabel}>0</Text>
            <Text style={styles.axisLabel}>−</Text>
          </View>
          <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
            <Defs>
              <LinearGradient id="moodTrendFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.primary} stopOpacity={0.28} />
                <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {areaPath ? <Path d={areaPath} fill="url(#moodTrendFill)" /> : null}
            <Path
              d={linePath}
              stroke={colors.primary}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {coords.map((c, i) => (
              <Circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={3.2}
                fill={colors.card}
                stroke={colors.primary}
                strokeWidth={2}
              />
            ))}
          </Svg>
        </View>
        <Text style={styles.hint}>Son {points.length} ruh hali etiketli notuna göre</Text>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...cardShadow(colors),
    },
    chartRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
    },
    axisLabels: {
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    axisLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.subtext,
      textAlign: 'center',
    },
    hint: {
      fontSize: 11,
      color: colors.subtext,
      marginTop: 8,
      textAlign: 'center',
    },
  });
}
