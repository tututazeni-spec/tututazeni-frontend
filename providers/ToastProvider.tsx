'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { Toast as RadixToast } from 'radix-ui';
import { ToastItem, ToastViewport } from '../components/ui/Toast';

export interface ToastOptions {
  title: string;
  description?: string;
  intent?: 'success' | 'danger' | 'info';
}

interface ToastEntry extends ToastOptions {
  id: string;
}

type ToastFn = (options: ToastOptions) => void;
const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback<ToastFn>((options) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onOpenChange={(open) => !open && remove(t.id)} />
        ))}
        <ToastViewport />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}
