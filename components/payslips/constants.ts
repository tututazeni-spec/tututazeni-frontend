// components/payslips/constants.ts
// Navegação e títulos do módulo de recibos de vencimento. Extraído
// de app/(platform)/payslips/page.tsx.

import type { View } from './types';

export const NAV: Array<{ id: Exclude<View, 'detail'>; label: string }> = [
  { id: 'list', label: 'Os meus recibos' },
  { id: 'compare', label: 'Comparar meses' },
  { id: 'simulate', label: 'Simulador IRT' },
  { id: 'annual', label: 'Resumo anual' },
  { id: 'compensation', label: 'A minha compensação' },
];

export const TITLES: Record<View, string> = {
  list: 'Os meus recibos de salário',
  detail: 'Detalhe do recibo',
  compare: 'Comparar meses',
  simulate: 'Simulador IRT Angola 2026',
  annual: 'Resumo anual',
  compensation: 'A minha compensação actual',
};
