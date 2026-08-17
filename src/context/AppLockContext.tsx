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
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_HASH_KEY = '@gunluk_asistan/pin_hash';
const FAILED_ATTEMPTS_KEY = '@gunluk_asistan/pin_failed_attempts';
const LOCKOUT_UNTIL_KEY = '@gunluk_asistan/pin_lockout_until';
const BIOMETRIC_ENABLED_KEY = '@gunluk_asistan/biometric_enabled';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

interface AppLockContextValue {
  loading: boolean;
  lockEnabled: boolean;
  isLocked: boolean;
  lockoutUntil: number | null;
  biometricSupported: boolean;
  biometricEnabled: boolean;
  setPin: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextValue | undefined>(undefined);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PIN_HASH_KEY),
      AsyncStorage.getItem(FAILED_ATTEMPTS_KEY),
      AsyncStorage.getItem(LOCKOUT_UNTIL_KEY),
      AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]).then(
      ([
        storedPin,
        storedAttempts,
        storedLockout,
        storedBiometricEnabled,
        hasHardware,
        isEnrolled,
      ]) => {
        setPinHash(storedPin);
        setIsLocked(!!storedPin);
        setFailedAttempts(storedAttempts ? parseInt(storedAttempts, 10) : 0);
        const lockoutValue = storedLockout ? parseInt(storedLockout, 10) : null;
        setLockoutUntil(lockoutValue && lockoutValue > Date.now() ? lockoutValue : null);
        setBiometricSupported(hasHardware && isEnrolled);
        setBiometricEnabledState(storedBiometricEnabled === 'true');
        setLoading(false);
      }
    );
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
    await AsyncStorage.multiSet([[PIN_HASH_KEY, hash]]);
    await AsyncStorage.multiRemove([FAILED_ATTEMPTS_KEY, LOCKOUT_UNTIL_KEY]);
    setPinHash(hash);
    setIsLocked(false);
    setFailedAttempts(0);
    setLockoutUntil(null);
  }, []);

  const disableLock = useCallback(async () => {
    await AsyncStorage.multiRemove([
      PIN_HASH_KEY,
      FAILED_ATTEMPTS_KEY,
      LOCKOUT_UNTIL_KEY,
      BIOMETRIC_ENABLED_KEY,
    ]);
    setPinHash(null);
    setIsLocked(false);
    setFailedAttempts(0);
    setLockoutUntil(null);
    setBiometricEnabledState(false);
  }, []);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    setBiometricEnabledState(enabled);
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Günlük Asistan kilidini aç',
      cancelLabel: 'PIN kullan',
      disableDeviceFallback: true,
    });
    if (result.success) {
      setIsLocked(false);
      setFailedAttempts(0);
      setLockoutUntil(null);
      await AsyncStorage.multiRemove([FAILED_ATTEMPTS_KEY, LOCKOUT_UNTIL_KEY]);
      return true;
    }
    return false;
  }, []);

  const unlock = useCallback(
    async (pin: string) => {
      if (!pinHash) return true;

      if (lockoutUntil && Date.now() < lockoutUntil) {
        return false;
      }

      const hash = await hashPin(pin);
      if (hash === pinHash) {
        setIsLocked(false);
        setFailedAttempts(0);
        setLockoutUntil(null);
        await AsyncStorage.multiRemove([FAILED_ATTEMPTS_KEY, LOCKOUT_UNTIL_KEY]);
        return true;
      }

      const nextAttempts = failedAttempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setFailedAttempts(0);
        setLockoutUntil(until);
        await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
        await AsyncStorage.setItem(LOCKOUT_UNTIL_KEY, String(until));
      } else {
        setFailedAttempts(nextAttempts);
        await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, String(nextAttempts));
      }
      return false;
    },
    [pinHash, failedAttempts, lockoutUntil]
  );

  const value = useMemo(
    () => ({
      loading,
      lockEnabled: !!pinHash,
      isLocked,
      lockoutUntil,
      biometricSupported,
      biometricEnabled,
      setPin,
      disableLock,
      unlock,
      setBiometricEnabled,
      unlockWithBiometrics,
    }),
    [
      loading,
      pinHash,
      isLocked,
      lockoutUntil,
      biometricSupported,
      biometricEnabled,
      setPin,
      disableLock,
      unlock,
      setBiometricEnabled,
      unlockWithBiometrics,
    ]
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within an AppLockProvider');
  return ctx;
}
