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
}

const lightColors: ThemeColors = {
  background: '#ffffff',
  card: '#f4f4f8',
  text: '#222222',
  subtext: '#888888',
  border: '#dddddd',
  primary: '#4f46e5',
  primaryText: '#ffffff',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  favorite: '#f59e0b',
  favoriteBg: '#fef3c7',
};

const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1e1e22',
  text: '#f1f1f1',
  subtext: '#9a9a9a',
  border: '#333338',
  primary: '#6366f1',
  primaryText: '#ffffff',
  danger: '#f87171',
  dangerBg: '#3f1d1d',
  favorite: '#fbbf24',
  favoriteBg: '#3f2f0f',
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
