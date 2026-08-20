// lib/errorToastBridge.ts
// Ponte entre código fora de componentes React (QueryClient global,
// ErrorBoundary) e o sistema de toasts (providers/ToastProvider.tsx).
// `useToast()` é um hook e não pode ser chamado fora de um componente — o
// ToastProvider regista aqui a sua função `showToast` ao montar; enquanto
// não houver provider montado (ex.: em testes), as chamadas são ignoradas
// em silêncio em vez de rebentar.

import type { ToastOptions } from '@/providers/ToastProvider';

type ToastFn = (options: ToastOptions) => void;

let activeToast: ToastFn | null = null;

export function registerToastHandler(fn: ToastFn | null): void {
  activeToast = fn;
}

export function notify(options: ToastOptions): void {
  activeToast?.(options);
}
