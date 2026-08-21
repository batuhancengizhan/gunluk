import { Platform } from 'react-native';
import { ThemeColors } from '../context/ThemeContext';

// Higgsfield tarzı düz/cam kart dili: derinlik yumuşak renkli gölgelerle
// değil, ince %10 opaklıklı kenarlıkla (colors.border) verilir. Fonksiyonlar
// geriye dönük uyumluluk için korunuyor ama artık neredeyse görünmez —
// yalnızca en koyu temada hafif bir ayrım için kullanılıyor.
export function cardShadow(colors: ThemeColors) {
  return Platform.select({
    android: { elevation: 0 },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
    },
  });
}

export function softShadow(_colors: ThemeColors) {
  return Platform.select({
    android: { elevation: 0 },
    default: {},
  });
}
