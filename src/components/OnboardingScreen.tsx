import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { haptics } from '../utils/haptics';
import { FONT_DISPLAY_EXTRABOLD } from '../constants/fonts';

const ONBOARDING_KEY = '@gunluk_asistan/onboarding_seen';

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'create-outline',
    title: 'Günlüğünü Tut',
    body: 'Günlük duygularını ve düşüncelerini birkaç dokunuşla kaydet. Mood emojisi ekle, yazma serisini büyüt.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Yapay Zeka Özeti',
    body: 'Haftalık notlarını yapay zeka analiz etsin, duygu durumundaki eğilimleri ve temaları senin için özetlesin.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Tamamen Özel',
    body: 'Notların sadece cihazında saklanır. İstersen PIN kilidiyle günlüğünü ekstra güvenceye al.',
  },
];

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const width = Dimensions.get('window').width;

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  };

  const handleNext = () => {
    haptics.selection();
    if (index === SLIDES.length - 1) {
      finish();
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.skip, { top: insets.top + 16 }]}
        onPress={finish}
      >
        <Text style={styles.skipText}>Atla</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={slide.icon} size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>
            {index === SLIDES.length - 1 ? 'Başlayalım' : 'İleri'}
          </Text>
        </TouchableOpacity>
      </View>
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
      zIndex: 1000,
    },
    skip: {
      position: 'absolute',
      top: 56,
      right: 20,
      zIndex: 1,
      padding: 8,
    },
    skipText: {
      color: colors.subtext,
      fontSize: 14,
      fontWeight: '600',
    },
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 36,
    },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
    },
    title: {
      fontSize: 27,
      fontFamily: FONT_DISPLAY_EXTRABOLD,
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    body: {
      fontSize: 15,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 22,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      alignItems: 'center',
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 22,
    },
    nextButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      width: '100%',
      alignItems: 'center',
    },
    nextButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
