// components/processes/constants.ts
// Mapas de badge e helpers de formatação partilhados pelos componentes de
// apresentação do módulo de processos. Extraído verbatim de
// app/(platform)/processes/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  InstanceStatus,
  ProcessStatus,
  RiskLevel,
  StepType,
} from './types';

export function fmtDuration(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

export const PROCESS_STATUS_MAP: StatusBadgeMap<ProcessStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-600' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-amber-50 text-amber-700' },
  ACTIVE: { label: 'Activo', cls: 'bg-emerald-50 text-emerald-700' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-gray-100 text-gray-400' },
};

export const RISK_LEVEL_MAP: StatusBadgeMap<RiskLevel> = {
  LOW: { label: 'Baixo', cls: 'bg-emerald-50 text-emerald-700' },
  MEDIUM: { label: 'Médio', cls: 'bg-amber-50 text-amber-700' },
  HIGH: { label: 'Alto', cls: 'bg-orange-50 text-orange-700' },
  CRITICAL: { label: 'Crítico', cls: 'bg-red-50 text-red-700' },
};

export const INSTANCE_STATUS_MAP: StatusBadgeMap<InstanceStatus> = {
  IN_PROGRESS: { label: 'Em progresso', cls: 'bg-blue-50 text-blue-700' },
  COMPLETED: { label: 'Concluído', cls: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-500' },
  ON_HOLD: { label: 'Suspenso', cls: 'bg-amber-50 text-amber-700' },
};

export const STEP_TYPE_MAP: StatusBadgeMap<StepType> = {
  START: { label: 'Início', cls: 'bg-emerald-100 text-emerald-800' },
  END: { label: 'Fim', cls: 'bg-gray-100 text-gray-600' },
  TASK: { label: 'Tarefa', cls: 'bg-blue-50 text-blue-700' },
  DECISION: { label: 'Decisão', cls: 'bg-purple-50 text-purple-700' },
  GATEWAY: { label: 'Gateway', cls: 'bg-amber-50 text-amber-700' },
  REVIEW: { label: 'Revisão', cls: 'bg-orange-50 text-orange-700' },
};
