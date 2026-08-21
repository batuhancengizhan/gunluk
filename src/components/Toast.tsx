import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../context/ToastContext';

// Toast bilerek uygulamanın açık/koyu tema tercihinden bağımsız, her zaman
// sabit koyu bir kapsül olarak render edilir (Material/Slack snackbar
// deseni) — bu sayede açık temada tersine dönüp lime aksiyon metninin
// neredeyse beyaz bir zeminde okunaksız kalması gibi bir kontrast sorunu
// hiç oluşmaz.
const TOAST_BG = '#1C1E21';
const TOAST_TEXT = '#F7F7F8';
const TOAST_ACCENT = '#D1FE17';

export default function Toast() {
  const insets = useSafeAreaInsets();
  const { message, visible, action, hideToast } = useToast();
  const styles = useMemo(() => getStyles(), []);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : -80,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateY, opacity]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
      {action && (
        <TouchableOpacity
          onPress={() => {
            action.onPress();
            hideToast();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 20,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      backgroundColor: TOAST_BG,
      borderRadius: 12,
      paddingVertical: 13,
      paddingHorizontal: 18,
      zIndex: 2000,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    text: {
      flex: 1,
      color: TOAST_TEXT,
      fontSize: 14,
      fontWeight: '600',
    },
    actionText: {
      color: TOAST_ACCENT,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
