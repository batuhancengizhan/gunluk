import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { useAppLock } from '../context/AppLockContext';
import PinPad from './PinPad';
import { haptics } from '../utils/haptics';
import { FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';

export default function LockScreen() {
  const { colors } = useTheme();
  const { unlock, disableLock, lockoutUntil } = useAppLock();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!lockoutUntil) {
      setRemainingSeconds(0);
      return;
    }
    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = remainingSeconds > 0;

  const handleChange = async (value: string) => {
    setPin(value);
    setError(false);
    if (value.length === 4) {
      const success = await unlock(value);
      if (!success) {
        haptics.warning();
        setError(true);
        setTimeout(() => setPin(''), 400);
      }
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      "PIN'i unuttum",
      'Kilidi kaldırabiliriz — notların silinmez, sadece PIN koruması kapanır. İstersen Ayarlar\'dan yeni bir PIN belirleyebilirsin.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kilidi Kaldır',
          style: 'destructive',
          onPress: () => disableLock(),
        },
      ]
    );
  };

  const subtitle = isLockedOut
    ? `Çok fazla yanlış deneme. ${remainingSeconds} saniye sonra tekrar dene.`
    : error
    ? 'Yanlış PIN, tekrar dene.'
    : 'Devam etmek için PIN kodunu gir';

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={isLockedOut ? 'time-outline' : 'lock-closed'}
          size={28}
          color={colors.primary}
        />
      </View>
      <Text style={styles.title}>Günlük Asistan Kilitli</Text>
      <Text style={[styles.subtitle, isLockedOut && styles.subtitleWarning]}>{subtitle}</Text>
      <View style={styles.padWrap}>
        <PinPad value={pin} onChange={handleChange} disabled={isLockedOut} />
      </View>
      <TouchableOpacity onPress={handleForgotPin} style={styles.forgotButton}>
        <Text style={styles.forgotText}>PIN'i unuttum</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    title: {
      fontSize: 21,
      fontFamily: FONT_DISPLAY_SEMIBOLD,
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: colors.subtext,
      marginBottom: 8,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    subtitleWarning: {
      color: colors.danger,
      fontWeight: '600',
    },
    padWrap: {
      marginTop: 28,
    },
    forgotButton: {
      marginTop: 28,
      padding: 8,
    },
    forgotText: {
      color: colors.subtext,
      fontSize: 13,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });
}
