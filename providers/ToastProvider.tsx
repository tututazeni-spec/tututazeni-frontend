'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Toast as RadixToast } from 'radix-ui';
import { ToastItem, ToastViewport } from '../components/ui/Toast';
import { registerToastHandler } from '../lib/errorToastBridge';

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

  // Não remover do estado de imediato quando o Radix fecha o toast: isso
  // desmontaria o <ToastItem> no mesmo commit em que `data-state` passa a
  // "closed", sem dar tempo à transição CSS (duration-200 em Toast.tsx) de
  // sequer renderizar um frame. Atrasa a remoção pelo mesmo tempo da
  // transição para que o fade/slide de saída seja visível.
  const scheduleRemove = useCallback(
    (id: string) => {
      setTimeout(() => remove(id), 200);
    },
    [remove],
  );

  // Regista este showToast na ponte (lib/errorToastBridge.ts) para que
  // código fora da árvore de componentes (handlers globais do QueryClient,
  // ErrorBoundary) consiga disparar toasts. ReactQueryProvider fica acima
  // de ToastProvider em app/layout.tsx, por isso o QueryClient não pode
  // chamar useToast() directamente.
  useEffect(() => {
    registerToastHandler(showToast);
    return () => registerToastHandler(null);
  }, [showToast]);

  return (
    <ToastContext.Provider value={showToast}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            {...t}
            onOpenChange={(open) => !open && scheduleRemove(t.id)}
          />
        ))}
        <ToastViewport />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx)
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}
