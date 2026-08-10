// components/instructor/constants.ts
// Mapas de badges/labels e navegação do módulo de instrutores.
// Extraído de app/(platform)/instructor/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { View } from './types';

export const STATUS_CFG: StatusBadgeMap<string> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  OPEN: { label: 'Aberta', cls: 'bg-blue-50 text-blue-700' },
  ACTIVE: { label: 'Activa', cls: 'bg-emerald-50 text-emerald-700' },
  CLOSED: { label: 'Encerrada', cls: 'bg-gray-100 text-gray-400' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-red-50 text-red-600' },
};

export const MODALITY_CFG: Record<string, { icon: string; label: string }> = {
  ONLINE: { icon: '💻', label: 'Online' },
  PRESENCIAL: { icon: '🏢', label: 'Presencial' },
  HYBRID: { icon: '🔀', label: 'Híbrido' },
};

export const STUDENT_STATUS: StatusBadgeMap<string> = {
  ACTIVE: { cls: 'bg-emerald-50 text-emerald-700', label: 'Activo' },
  COMPLETED: { cls: 'bg-blue-50 text-blue-700', label: 'Concluído' },
  AT_RISK: { cls: 'bg-red-50 text-red-700', label: 'Em risco' },
  DROPPED: { cls: 'bg-gray-100 text-gray-400', label: 'Desistiu' },
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'cohorts', label: '👥 Turmas' },
  { id: 'at-risk', label: '⚠ Em risco' },
];

export const TITLES: Record<View, string> = {
  dashboard: 'Painel do Instrutor',
  cohorts: 'As minhas Turmas',
  'cohort-detail': 'Detalhe da Turma',
  'at-risk': 'Alunos em Risco',
  profile: 'Perfil do Instrutor',
};
