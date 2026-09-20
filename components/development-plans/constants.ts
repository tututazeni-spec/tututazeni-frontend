// components/development-plans/constants.ts
// Mapas de badges/labels e navegação do módulo de PDI. Cores mapeadas
// para os tokens semânticos da fundação de design (Fase A) — os tipos
// de acção (COURSE/MENTORING/...) são categorias decorativas, não
// estados, por isso repetem tokens onde não há uma correspondência 1:1.
// Extraído de app/(platform)/development-plans/page.tsx.

import { Circle, Play, Check, Lock, X, type LucideIcon } from 'lucide-react';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  ActionStatus,
  ActionType,
  CompetencyGapPriority,
  PdiFinalResult,
  PdiNextSteps,
  PdiOrigin,
  PdiOverallResult,
  PlanStatus,
  Priority,
  View,
} from './types';

export const STATUS_CFG: StatusBadgeMap<PlanStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PENDING_APPROVAL: {
    label: 'Ag. aprovação',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  ACTIVE: { label: 'Activo', cls: 'bg-success-subtle text-success-ink' },
  PAUSED: { label: 'Pausado', cls: 'bg-surface-sunken text-ink-muted' },
  AT_RISK: { label: 'Em risco', cls: 'bg-warning-subtle text-warning-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-info-subtle text-info-ink' },
  PARTIALLY_COMPLETED: {
    label: 'Concluído parcialmente',
    cls: 'bg-info-subtle text-info-ink',
  },
  CANCELLED: { label: 'Cancelado', cls: 'bg-danger-subtle text-danger-ink' },
  OVERDUE: { label: 'Atrasado', cls: 'bg-danger-subtle text-danger-ink' },
};

// Secção 2 do doc — origem do PDI.
export const ORIGIN_CFG: Record<PdiOrigin, string> = {
  PERFORMANCE_REVIEW: 'Avaliação de desempenho',
  EVALUATION_360: 'Avaliação 360°',
  COMPETENCY_MAP: 'Mapa de competências',
  COMPETENCY_GAP: 'Gap de competências',
  CAREER_PLAN: 'Plano de carreira',
  SUCCESSION: 'Sucessão',
  LEADERSHIP_PROGRAM: 'Programa de liderança',
  MANAGER_REQUEST: 'Necessidade identificada pelo gestor',
  EMPLOYEE_REQUEST: 'Pedido do colaborador',
  ONBOARDING: 'Onboarding',
  ROLE_CHANGE: 'Mudança de função',
  PROMOTION: 'Promoção',
  OPERATIONAL_NEED: 'Necessidade operacional',
  STRATEGIC_NEED: 'Necessidade estratégica da empresa',
  OTHER: 'Outro',
};
export const ORIGIN_ITEMS = Object.entries(ORIGIN_CFG).map(([value, label]) => ({
  value,
  label,
}));

export const GAP_PRIORITY_CFG: Record<CompetencyGapPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};
export const GAP_PRIORITY_ITEMS = Object.entries(GAP_PRIORITY_CFG).map(
  ([value, label]) => ({ value, label }),
);

// Secção 19 — avaliação final do PDI.
export const FINAL_RESULT_CFG: Record<PdiFinalResult, string> = {
  GOAL_ACHIEVED: 'Objectivo alcançado',
  PARTIALLY_ACHIEVED: 'Parcialmente alcançado',
  NOT_ACHIEVED: 'Não alcançado',
};
export const FINAL_RESULT_ITEMS = Object.entries(FINAL_RESULT_CFG).map(
  ([value, label]) => ({ value, label }),
);

export const OVERALL_RESULT_CFG: Record<PdiOverallResult, string> = {
  EXCEEDED: 'Excedeu expectativas',
  MET: 'Atingiu expectativas',
  PARTIALLY_MET: 'Atingiu parcialmente',
  NOT_MET: 'Não atingiu',
};
export const OVERALL_RESULT_ITEMS = Object.entries(OVERALL_RESULT_CFG).map(
  ([value, label]) => ({ value, label }),
);

// Secção 20 — próximos passos.
export const NEXT_STEPS_CFG: Record<PdiNextSteps, string> = {
  NEW_PDI: 'Novo PDI',
  CONTINUE_PDI: 'Continuidade do PDI',
  NEW_COMPETENCY_ASSESSMENT: 'Nova avaliação de competências',
  LEARNING_PATH: 'Inclusão numa trilha de aprendizagem',
  LEADERSHIP_PROGRAM: 'Inclusão num programa de liderança',
  ROLE_PREPARATION: 'Preparação para nova função',
  SUCCESSION_PLAN: 'Encaminhamento para plano de sucessão',
  NONE: 'Sem acção adicional',
};
export const NEXT_STEPS_ITEMS = Object.entries(NEXT_STEPS_CFG).map(
  ([value, label]) => ({ value, label }),
);

export const ACTION_CFG: Record<ActionType, { label: string; cls: string }> = {
  COURSE: { label: 'Curso', cls: 'bg-info-subtle text-info-ink' },
  MENTORING: {
    label: 'Mentoria',
    cls: 'bg-primary-subtle text-primary',
  },
  COACHING: {
    label: 'Coaching',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  READING: {
    label: 'Leitura',
    cls: 'bg-success-subtle text-success-ink',
  },
  PROJECT: {
    label: 'Projecto',
    cls: 'bg-danger-subtle text-danger-ink',
  },
  JOB_ROTATION: {
    label: 'Rotação de Funções',
    cls: 'bg-accent-subtle text-accent',
  },
  MICROLEARNING: {
    label: 'Micro-aprendizagem',
    cls: 'bg-info-subtle text-info-ink',
  },
  WORKSHOP: {
    label: 'Workshop',
    cls: 'bg-success-subtle text-success-ink',
  },
  CERTIFICATION: {
    label: 'Certificação',
    cls: 'bg-accent-subtle text-accent',
  },
  OTHER: {
    label: 'Outro',
    cls: 'bg-surface-sunken text-ink-muted',
  },
};

export const ACTION_STATUS: Record<
  ActionStatus,
  { icon: LucideIcon; cls: string; label: string }
> = {
  TODO: { icon: Circle, cls: 'text-ink-faint', label: 'A fazer' },
  IN_PROGRESS: { icon: Play, cls: 'text-info', label: 'Em progresso' },
  COMPLETED: { icon: Check, cls: 'text-success', label: 'Concluída' },
  BLOCKED: { icon: Lock, cls: 'text-ink-faint', label: 'Bloqueada' },
  CANCELLED: { icon: X, cls: 'text-danger', label: 'Cancelada' },
};

export const PRIORITY_CFG: StatusBadgeMap<Priority> = {
  LOW: { label: 'Baixa', cls: 'bg-surface-sunken text-ink-muted' },
  MEDIUM: { label: 'Média', cls: 'bg-info-subtle text-info-ink' },
  HIGH: { label: 'Alta', cls: 'bg-warning-subtle text-warning-ink' },
  URGENT: { label: 'Urgente', cls: 'bg-danger-subtle text-danger-ink' },
};

// Separadores de Desenvolvimento de Talentos (ex-/talent-development, módulo
// fundido aqui) — pool, skill-gaps e mentoring/analytics no mesmo nível dos
// separadores de PDI. "plans" original desse módulo foi descartado: redundante
// com Os meus PDIs/Equipa acima.
export const NAV = [
  { id: 'my-plans', label: 'Os meus PDIs' },
  { id: 'team', label: 'Equipa' },
  { id: 'pool', label: 'Banco de Talentos' },
  { id: 'skill-gaps', label: 'Lacunas de Competências' },
  { id: 'mentoring', label: 'Mentoria' },
  { id: 'analytics', label: 'Análises' },
] as const;

export const TITLES: Record<View, string> = {
  'my-plans': 'Planos de Desenvolvimento Individual',
  detail: 'Detalhe do PDI',
  team: 'PDIs da Equipa',
  pool: 'Banco de Talentos',
  'skill-gaps': 'Lacunas de Competências',
  mentoring: 'Mentoria',
  analytics: 'Análises de Desenvolvimento',
  create: 'Novo PDI',
};

// ─── CreatePlanWizard (wizard em 7 etapas, doc "Criar Novo PDI") ───────────

export type WizardStepId =
  | 'identification'
  | 'diagnosis'
  | 'competencies'
  | 'objectives'
  | 'actionPlan'
  | 'tracking'
  | 'review';

export const WIZARD_STEPS: Array<{ id: WizardStepId; label: string }> = [
  { id: 'identification', label: 'Identificação' },
  { id: 'diagnosis', label: 'Diagnóstico' },
  { id: 'competencies', label: 'Competências' },
  { id: 'objectives', label: 'Objectivos' },
  { id: 'actionPlan', label: 'Plano de acção' },
  { id: 'tracking', label: 'Indicadores' },
  { id: 'review', label: 'Revisão' },
];

// Durações típicas de um PDI (secção 1) — meses a somar à data de início
// para derivar a data de conclusão prevista quando o utilizador não escreve
// a endDate à mão.
export const DURATION_PRESETS = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '9', label: '9 meses' },
  { value: '12', label: '12 meses' },
  { value: 'custom', label: 'Personalizado' },
];
