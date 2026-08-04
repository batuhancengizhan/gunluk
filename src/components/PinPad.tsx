import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '../context/ThemeContext';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

interface Props {
  value: string;
  maxLength?: number;
  onChange: (value: string) => void;
}

export default function PinPad({ value, maxLength = 4, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handlePress = (key: string) => {
    if (key === '') return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length < maxLength) {
      onChange(value + key);
    }
  };

  return (
    <View>
      <View style={styles.dotsRow}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.keypad}>
        {KEYS.map((key, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.key, key === '' && styles.keyHidden]}
            onPress={() => handlePress(key)}
            disabled={key === ''}
            activeOpacity={0.7}
          >
            {key === 'del' ? (
              <Ionicons name="backspace-outline" size={22} color={colors.text} />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 36,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    dotFilled: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    keypad: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 264,
      alignSelf: 'center',
      justifyContent: 'center',
    },
    key: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 6,
    },
    keyHidden: {
      opacity: 0,
    },
    keyText: {
      fontSize: 26,
      fontWeight: '500',
      color: colors.text,
    },
  });
}
