import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ShowToastOptions {
  action?: ToastAction;
  duration?: number;
}

interface ToastContextValue {
  message: string;
  visible: boolean;
  action: ToastAction | null;
  showToast: (message: string, options?: ShowToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 2200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [action, setAction] = useState<ToastAction | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const showToast = useCallback((text: string, options?: ShowToastOptions) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(text);
    setAction(options?.action ?? null);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), options?.duration ?? DEFAULT_DURATION);
  }, []);

  return (
    <ToastContext.Provider value={{ message, visible, action, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast, ToastProvider içinde kullanılmalı');
  }
  return ctx;
}
