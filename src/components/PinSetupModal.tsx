import { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import PinPad from './PinPad';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
}

export default function PinSetupModal({ visible, onClose, onConfirm }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const reset = () => {
    setStep('create');
    setFirstPin('');
    setPin('');
    setError(false);
  };

  // Modal gizlendiğinde iç durumu sıfırla — bu sayede kapanış animasyonu
  // sırasında "Yeni PIN Oluştur" adımına geçici bir dönüş (flaş) yaşanmaz.
  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const handleChange = (value: string) => {
    setPin(value);
    setError(false);
    if (value.length === 4) {
      if (step === 'create') {
        setFirstPin(value);
        setPin('');
        setStep('confirm');
      } else {
        if (value === firstPin) {
          onConfirm(value);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setStep('create');
            setFirstPin('');
          }, 500);
        }
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>
            {step === 'create' ? 'Yeni PIN Oluştur' : 'PIN\'i Onayla'}
          </Text>
          <Text style={styles.subtitle}>
            {error
              ? 'PIN\'ler eşleşmedi, tekrar dene.'
              : step === 'create'
              ? '4 haneli bir PIN belirle.'
              : 'PIN\'i tekrar gir.'}
          </Text>
          <View style={styles.padWrap}>
            <PinPad value={pin} onChange={handleChange} />
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingTop: 14,
      alignItems: 'center',
    },
    grabber: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 18,
    },
    title: {
      fontSize: 18,
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
      marginTop: 20,
    },
    cancelButton: {
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    cancelText: {
      color: colors.subtext,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
