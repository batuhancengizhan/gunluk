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

const lightColors: ThemeColors = {
  background: '#FAFAF9',
  card: '#FFFFFF',
  text: '#18181B',
  subtext: '#71717A',
  border: '#E9E9ED',
  primary: '#4338CA',
  primaryText: '#FFFFFF',
  danger: '#DC2626',
  dangerBg: '#FDEDED',
  favorite: '#C08A1E',
  favoriteBg: '#FBF3E1',
  shadow: 'rgba(24, 24, 27, 0.08)',
};

const darkColors: ThemeColors = {
  background: '#0C0C0F',
  card: '#18181C',
  text: '#F4F4F5',
  subtext: '#9A9AA5',
  border: '#28282E',
  primary: '#8583F5',
  primaryText: '#0C0C0F',
  danger: '#F87171',
  dangerBg: '#2A1616',
  favorite: '#E3BB56',
  favoriteBg: '#2A2410',
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
