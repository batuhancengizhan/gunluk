import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { useAppLock } from '../context/AppLockContext';
import PinPad from './PinPad';
import { haptics } from '../utils/haptics';

export default function LockScreen() {
  const { colors } = useTheme();
  const { unlock, disableLock } = useAppLock();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

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

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>Günlük Asistan Kilitli</Text>
      <Text style={styles.subtitle}>
        {error ? 'Yanlış PIN, tekrar dene.' : 'Devam etmek için PIN kodunu gir'}
      </Text>
      <View style={styles.padWrap}>
        <PinPad value={pin} onChange={handleChange} />
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
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: colors.subtext,
      marginBottom: 8,
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
