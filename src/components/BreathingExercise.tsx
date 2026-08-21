import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { haptics } from '../utils/haptics';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';

const PHASES: { label: string; duration: number; scaleTo: number }[] = [
  { label: 'Nefes al', duration: 4000, scaleTo: 1.4 },
  { label: 'Tut', duration: 4000, scaleTo: 1.4 },
  { label: 'Ver', duration: 4000, scaleTo: 1 },
  { label: 'Tut', duration: 4000, scaleTo: 1 },
];

const TOTAL_ROUNDS = 4;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function BreathingExercise({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    scale.setValue(1);
    setPhaseIndex(0);
    setRound(1);
    setDone(false);

    let cancelled = false;

    const runPhase = (roundNum: number, phaseIdx: number) => {
      if (cancelled) return;
      if (roundNum > TOTAL_ROUNDS) {
        setDone(true);
        haptics.success();
        return;
      }

      setRound(roundNum);
      setPhaseIndex(phaseIdx);
      haptics.selection();

      const phase = PHASES[phaseIdx];
      Animated.timing(scale, {
        toValue: phase.scaleTo,
        duration: phase.duration,
        useNativeDriver: true,
      }).start();

      timeoutRef.current = setTimeout(() => {
        const nextPhaseIdx = phaseIdx + 1;
        if (nextPhaseIdx >= PHASES.length) {
          runPhase(roundNum + 1, 0);
        } else {
          runPhase(roundNum, nextPhaseIdx);
        }
      }, phase.duration);
    };

    runPhase(1, 0);

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, scale]);

  if (!visible) return null;

  const phase = PHASES[phaseIndex];

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Nefes egzersizini kapat"
        >
          <Ionicons name="close" size={22} color={colors.subtext} />
        </TouchableOpacity>

        <View style={styles.center}>
          {done ? (
            <>
              <View style={styles.doneIconWrap}>
                <Ionicons name="checkmark" size={26} color={colors.primaryText} />
              </View>
              <Text style={styles.doneTitle}>Harika, kendine iyi baktın</Text>
              <Text style={styles.doneSubtitle}>Şimdi biraz daha sakin hissediyor olabilirsin.</Text>
              <TouchableOpacity style={styles.finishButton} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.finishButtonText}>Bitir</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.circleWrap}>
                <Animated.View
                  style={[
                    styles.circle,
                    { transform: [{ scale }] },
                  ]}
                />
                <Text style={styles.phaseLabel}>{phase.label}</Text>
              </View>
              <Text style={styles.roundText}>{round} / {TOTAL_ROUNDS}. tur</Text>
              <Text style={styles.hint}>Kutu nefesi: 4 saniye al, 4 saniye tut, 4 saniye ver, 4 saniye tut.</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    closeButton: {
      alignSelf: 'flex-end',
      padding: 8,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleWrap: {
      width: 220,
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    circle: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.primary,
      opacity: 0.18,
    },
    phaseLabel: {
      fontSize: 22,
      fontFamily: FONT_DISPLAY_SEMIBOLD,
      color: colors.text,
    },
    roundText: {
      fontSize: 13,
      color: colors.subtext,
      fontWeight: '600',
      marginBottom: 20,
    },
    hint: {
      fontSize: 13,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 19,
      paddingHorizontal: 20,
    },
    doneIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    doneTitle: {
      fontSize: 21,
      fontFamily: FONT_DISPLAY_SEMIBOLD,
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    doneSubtitle: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      marginBottom: 28,
      paddingHorizontal: 20,
    },
    finishButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 36,
    },
    finishButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
