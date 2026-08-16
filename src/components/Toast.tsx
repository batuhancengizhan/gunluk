import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function Toast() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { message, visible } = useToast();
  const styles = useMemo(() => getStyles(colors), [colors]);
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
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 20,
      right: 20,
      backgroundColor: colors.text,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 18,
      zIndex: 2000,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    text: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
