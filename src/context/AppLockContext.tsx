import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const PIN_HASH_KEY = '@gunluk_asistan/pin_hash';

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

interface AppLockContextValue {
  loading: boolean;
  lockEnabled: boolean;
  isLocked: boolean;
  setPin: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextValue | undefined>(undefined);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    AsyncStorage.getItem(PIN_HASH_KEY).then((stored) => {
      setPinHash(stored);
      setIsLocked(!!stored);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appState.current === 'active' &&
        (nextState === 'background' || nextState === 'inactive') &&
        pinHash
      ) {
        setIsLocked(true);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [pinHash]);

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    await AsyncStorage.setItem(PIN_HASH_KEY, hash);
    setPinHash(hash);
    setIsLocked(false);
  }, []);

  const disableLock = useCallback(async () => {
    await AsyncStorage.removeItem(PIN_HASH_KEY);
    setPinHash(null);
    setIsLocked(false);
  }, []);

  const unlock = useCallback(
    async (pin: string) => {
      if (!pinHash) return true;
      const hash = await hashPin(pin);
      if (hash === pinHash) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [pinHash]
  );

  const value = useMemo(
    () => ({ loading, lockEnabled: !!pinHash, isLocked, setPin, disableLock, unlock }),
    [loading, pinHash, isLocked, setPin, disableLock, unlock]
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within an AppLockProvider');
  return ctx;
}
