// components/instructor/constants.ts
// Mapas de badges/labels e navegação do módulo de instrutores. Cores
// mapeadas para os tokens semânticos da fundação de design (Fase A).
// Extraído de app/(platform)/instructor/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { View } from './types';

export const STATUS_CFG: StatusBadgeMap<string> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-faint' },
  OPEN: { label: 'Aberta', cls: 'bg-info-subtle text-info-ink' },
  ACTIVE: { label: 'Activa', cls: 'bg-success-subtle text-success-ink' },
  CLOSED: { label: 'Encerrada', cls: 'bg-surface-sunken text-ink-faint' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-danger-subtle text-danger-ink' },
};

export const MODALITY_CFG: Record<string, { label: string }> = {
  ONLINE: { label: 'Online' },
  PRESENCIAL: { label: 'Presencial' },
  HYBRID: { label: 'Híbrido' },
};

export const STUDENT_STATUS: StatusBadgeMap<string> = {
  ACTIVE: { cls: 'bg-success-subtle text-success-ink', label: 'Activo' },
  COMPLETED: { cls: 'bg-info-subtle text-info-ink', label: 'Concluído' },
  AT_RISK: { cls: 'bg-danger-subtle text-danger-ink', label: 'Em risco' },
  DROPPED: { cls: 'bg-surface-sunken text-ink-faint', label: 'Desistiu' },
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
