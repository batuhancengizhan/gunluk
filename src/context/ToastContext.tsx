import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';

interface ToastContextValue {
  message: string;
  visible: boolean;
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(text);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ message, visible, showToast }}>
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
