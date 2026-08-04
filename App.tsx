import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_800ExtraBold,
} from '@expo-google-fonts/fraunces';
import WriteNoteScreen from './src/screens/WriteNoteScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { BackgroundThemeProvider } from './src/context/BackgroundThemeContext';
import { AppLockProvider, useAppLock } from './src/context/AppLockContext';
import LockScreen from './src/components/LockScreen';
import OnboardingScreen, { hasSeenOnboarding } from './src/components/OnboardingScreen';
import { FONT_DISPLAY_BOLD } from './src/constants/fonts';

const Tab = createBottomTabNavigator();

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const { resolvedMode, colors } = useTheme();
  const { isLocked } = useAppLock();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    hasSeenOnboarding().then((seen) => {
      setShowOnboarding(!seen);
      setOnboardingChecked(true);
    });
  }, []);

  const navigationTheme = {
    ...(resolvedMode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(resolvedMode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text, fontFamily: FONT_DISPLAY_BOLD, fontSize: 19 },
          tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              NotYaz: 'create-outline',
              Gecmis: 'time-outline',
              Ayarlar: 'settings-outline',
            };
            return (
              <Ionicons name={icons[route.name]} size={size} color={color} />
            );
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subtext,
        })}
      >
        <Tab.Screen
          name="NotYaz"
          component={WriteNoteScreen}
          options={{ title: 'Not Yaz' }}
        />
        <Tab.Screen
          name="Gecmis"
          component={HistoryScreen}
          options={{ title: 'Geçmiş Notlar' }}
        />
        <Tab.Screen
          name="Ayarlar"
          component={SettingsScreen}
          options={{ title: 'Ayarlar' }}
        />
      </Tab.Navigator>
      {isLocked && <LockScreen />}
      {onboardingChecked && showOnboarding && (
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <BackgroundThemeProvider>
        <AppLockProvider>
          <AppContent />
        </AppLockProvider>
      </BackgroundThemeProvider>
    </ThemeProvider>
  );
}
