import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackgroundTheme, BACKGROUND_THEMES, getBackgroundTheme } from '../constants/backgroundThemes';

interface BackgroundThemeContextValue {
  backgroundThemeId: string;
  backgroundTheme: BackgroundTheme;
  setBackgroundThemeId: (id: string) => void;
}

const BackgroundThemeContext = createContext<BackgroundThemeContextValue | undefined>(undefined);

const BACKGROUND_THEME_KEY = '@gunluk_asistan/background_theme';

export function BackgroundThemeProvider({ children }: { children: React.ReactNode }) {
  const [backgroundThemeId, setBackgroundThemeIdState] = useState('sunrise');

  useEffect(() => {
    AsyncStorage.getItem(BACKGROUND_THEME_KEY).then((stored) => {
      if (stored && BACKGROUND_THEMES.some((t) => t.id === stored)) {
        setBackgroundThemeIdState(stored);
      }
    });
  }, []);

  const setBackgroundThemeId = (id: string) => {
    setBackgroundThemeIdState(id);
    AsyncStorage.setItem(BACKGROUND_THEME_KEY, id);
  };

  const value = useMemo(
    () => ({
      backgroundThemeId,
      backgroundTheme: getBackgroundTheme(backgroundThemeId),
      setBackgroundThemeId,
    }),
    [backgroundThemeId]
  );

  return (
    <BackgroundThemeContext.Provider value={value}>{children}</BackgroundThemeContext.Provider>
  );
}

export function useBackgroundTheme(): BackgroundThemeContextValue {
  const ctx = useContext(BackgroundThemeContext);
  if (!ctx) throw new Error('useBackgroundTheme must be used within a BackgroundThemeProvider');
  return ctx;
}
