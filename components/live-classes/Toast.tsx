// components/live-classes/Toast.tsx
// Notificação flutuante com auto-dismiss. Extraído de
// app/(platform)/live-classes/page.tsx.

import { useAutoDismiss } from '@/hooks/useAutoDismiss';

export interface ToastProps {
  msg: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ msg, type, onClose }: ToastProps) {
  useAutoDismiss(onClose, 3500);
  const c = {
    success: { bg: '#f0fdf4', bd: '#bbf7d0', cl: '#16a34a' },
    error: { bg: '#fef2f2', bd: '#fecaca', cl: '#dc2626' },
    info: { bg: '#eff6ff', bd: '#bfdbfe', cl: '#2563eb' },
  }[type];
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        borderRadius: 12,
        padding: '12px 18px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        color: c.cl,
        fontWeight: 500,
      }}
    >
      {msg}
      <button
        onClick={onClose}
        aria-label="Fechar"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: c.cl,
          fontSize: 16,
          marginLeft: 8,
        }}
      >
        ×
      </button>
    </div>
  );
}
