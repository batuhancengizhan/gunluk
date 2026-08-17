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

// Zeytin yeşili + kiremit turuncusu harmanı: ana vurgu kiremit
// turuncusu (butonlar, aktif durumlar), ikincil vurgu (favoriler) zeytin
// yeşili — nötr gri yerine hafif sıcak, topraksı bir zemin tonu kullanılıyor.
const lightColors: ThemeColors = {
  background: '#FAF8F2',
  card: '#FFFFFF',
  text: '#211C15',
  subtext: '#7C7364',
  border: '#EAE3D5',
  primary: '#C1592E',
  primaryText: '#FFFFFF',
  danger: '#C0392B',
  dangerBg: '#FBEAE5',
  favorite: '#748034',
  favoriteBg: '#EEF0DF',
  shadow: 'rgba(33, 28, 21, 0.08)',
};

const darkColors: ThemeColors = {
  background: '#151209',
  card: '#221D14',
  text: '#F6F1E7',
  subtext: '#AB9F8B',
  border: '#352E20',
  primary: '#E08B5B',
  primaryText: '#1A140D',
  danger: '#E0705F',
  dangerBg: '#2E1712',
  favorite: '#B7C36A',
  favoriteBg: '#262916',
  shadow: 'rgba(0, 0, 0, 0.5)',
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
