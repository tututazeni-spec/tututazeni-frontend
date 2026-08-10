// components/settings/styles.ts
// Estilos inline partilhados do módulo de definições (React.CSSProperties,
// não Tailwind — mantém-se o padrão original da página). Extraído de
// app/(platform)/settings/page.tsx.

import type { CSSProperties } from 'react';
import type { Tab } from './types';

export const btnPrimary: CSSProperties = {
  padding: '10px 20px',
  background: '#1e40af',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

export const btnGhost: CSSProperties = {
  padding: '10px 20px',
  background: '#f1f5f9',
  color: '#475569',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  color: '#1e293b',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: '#64748b',
  marginBottom: 6,
};

export const card: CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  padding: 24,
};

export const TAB_STYLE = (active: boolean): CSSProperties => ({
  padding: '8px 20px',
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 700 : 500,
  borderRadius: 8,
  background: active ? '#1e40af' : 'transparent',
  color: active ? '#fff' : '#64748b',
  transition: 'all 0.15s',
});

export const NAV: Array<{ key: Tab; label: string }> = [
  { key: 'perfil', label: '👤 Perfil' },
  { key: 'seguranca', label: '🔑 Segurança' },
  { key: 'permissoes', label: '🔐 Permissões' },
];
