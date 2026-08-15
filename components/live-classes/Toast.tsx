// components/live-classes/Toast.tsx
// Notificação flutuante com auto-dismiss. Migrada para design tokens.

import { useAutoDismiss } from '@/hooks/useAutoDismiss';

export interface ToastProps {
  msg: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ msg, type, onClose }: ToastProps) {
  useAutoDismiss(onClose, 3500);
  const styles = {
    success: {
      bg: 'bg-success-subtle',
      bd: 'border-success',
      text: 'text-success',
    },
    error: {
      bg: 'bg-danger-subtle',
      bd: 'border-danger-subtle',
      text: 'text-danger',
    },
    info: { bg: 'bg-info-subtle', bd: 'border-info', text: 'text-info' },
  }[type];
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg ${styles.bg} border ${styles.bd} px-4.5 py-3 text-sm font-medium ${styles.text} shadow-lg`}
    >
      {msg}
      <button
        onClick={onClose}
        aria-label="Fechar"
        className={`cursor-pointer bg-none border-none ml-2 text-base ${styles.text}`}
      >
        ×
      </button>
    </div>
  );
}
