import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  dangerBg: string;
  favorite: string;
  favoriteBg: string;
  shadow: string;
}

// Higgsfield.ai'nin gerçek tasarım tokenlarından türetilmiş, tek vurgu
// renkli ("neon lime") koyu-öncelikli teknoloji paleti. Marka rengi
// (#D1FE17) her iki modda da sabit kalır; sadece yüzey/metin tonları ve
// favori ikonunun okunabilirliği moda göre ayarlanır.
const lightColors: ThemeColors = {
  background: '#F7F7F8',
  card: '#FFFFFF',
  text: '#0F1113',
  subtext: 'rgba(15, 17, 19, 0.6)',
  border: 'rgba(15, 17, 19, 0.1)',
  primary: '#D1FE17',
  primaryText: '#0F1113',
  danger: '#D94438',
  dangerBg: 'rgba(217, 68, 56, 0.08)',
  favorite: '#7A8A00',
  favoriteBg: 'rgba(209, 254, 23, 0.22)',
  shadow: 'rgba(15, 17, 19, 0.08)',
};

const darkColors: ThemeColors = {
  background: '#0F1113',
  card: '#1C1E21',
  text: '#F7F7F8',
  subtext: 'rgba(247, 247, 248, 0.6)',
  border: 'rgba(255, 255, 255, 0.1)',
  primary: '#D1FE17',
  primaryText: '#0F1113',
  danger: '#FF6B60',
  dangerBg: 'rgba(255, 107, 96, 0.14)',
  favorite: '#D1FE17',
  favoriteBg: 'rgba(209, 254, 23, 0.14)',
  shadow: 'rgba(0, 0, 0, 0.6)',
};

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = '@gunluk_asistan/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode);
  };

  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const colors = resolvedMode === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode, resolvedMode, colors, setMode }),
    [mode, resolvedMode, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
