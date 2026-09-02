// components/payslips/constants.ts
// Navegação e títulos do módulo de recibos de vencimento. Extraído
// de app/(platform)/payslips/page.tsx.

import type { View } from './types';

export const NAV: Array<{
  id: Exclude<View, 'detail' | 'comp-detail'>;
  label: string;
  adminOnly?: boolean;
}> = [
  { id: 'list', label: 'Os meus recibos' },
  { id: 'compare', label: 'Comparar meses' },
  { id: 'simulate', label: 'Simulador IRT' },
  { id: 'annual', label: 'Resumo anual' },
  { id: 'compensation', label: 'A minha compensação' },
  { id: 'components', label: 'Componentes', adminOnly: true },
  { id: 'compensations', label: 'Compensações', adminOnly: true },
];

export const TITLES: Record<View, string> = {
  list: 'Os meus recibos de salário',
  detail: 'Detalhe do recibo',
  compare: 'Comparar meses',
  simulate: 'Simulador IRT Angola 2026',
  annual: 'Resumo anual',
  compensation: 'A minha compensação actual',
  components: 'Componentes salariais',
  compensations: 'Compensações dos colaboradores',
  'comp-detail': 'Compensação do colaborador',
};
