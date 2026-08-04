import { Platform } from 'react-native';
import { ThemeColors } from '../context/ThemeContext';

/** Premium, yumuşak bir kart gölgesi — iOS'ta shadow*, Android'de elevation. */
export function cardShadow(colors: ThemeColors) {
  return Platform.select({
    android: { elevation: 3 },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
  });
}

export function softShadow(colors: ThemeColors) {
  return Platform.select({
    android: { elevation: 1 },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
    },
  });
}
