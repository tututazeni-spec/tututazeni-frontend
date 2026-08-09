// components/courses-modulos/Toast.tsx
// Notificação flutuante de sucesso/erro. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { useAutoDismiss } from '@/hooks/useAutoDismiss';

interface ToastProps {
  msg: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ msg, type, onClose }: ToastProps) {
  useAutoDismiss(onClose, 4000);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 999,
        background: type === 'success' ? '#ecfdf5' : '#fef2f2',
        border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        borderRadius: 12,
        padding: '14px 20px',
        maxWidth: 360,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 18 }}>{type === 'success' ? '✅' : '❌'}</span>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: type === 'success' ? '#16a34a' : '#dc2626',
          fontWeight: 600,
        }}
      >
        {msg}
      </p>
    </div>
  );
}
