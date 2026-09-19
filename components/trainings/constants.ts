// components/trainings/constants.ts
// Mapas de tipo/nível/participante, navegação e títulos do módulo.
// Extraído de app/(platform)/trainings/page.tsx.
//
// TYPE_CFG/LEVEL_CFG/PARTICIPANT_CFG usam os tokens semânticos da
// fundação de design (Fase A) — mesmo padrão de TOKEN usado em
// components/reports/constants.ts e components/executive-reports/constants.ts.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  ParticipantStatus,
  TrainingLevel,
  TrainingPlanStatus,
  TrainingPriority,
  TrainingStatus,
  TrainingType,
  View,
} from './types';

const TOKEN = {
  primary: { color: 'text-primary', bg: 'bg-primary-subtle' },
  success: { color: 'text-success-ink', bg: 'bg-success-subtle' },
  warning: { color: 'text-warning-ink', bg: 'bg-warning-subtle' },
  danger: { color: 'text-danger-ink', bg: 'bg-danger-subtle' },
  info: { color: 'text-info-ink', bg: 'bg-info-subtle' },
  neutral: { color: 'text-ink-muted', bg: 'bg-surface-sunken' },
} as const;

const cls = (t: (typeof TOKEN)[keyof typeof TOKEN]) => `${t.bg} ${t.color}`;

export const TYPE_CFG: Record<
  TrainingType,
  { label: string; icon?: string; cls: string }
> = {
  PRESENTIAL: { label: 'Presencial', cls: cls(TOKEN.info) },
  ONLINE: { label: 'Online', cls: cls(TOKEN.primary) },
  HYBRID: { label: 'Híbrido', cls: cls(TOKEN.warning) },
  VIRTUAL_ROOM: { label: 'Sala virtual', cls: cls(TOKEN.info) },
  ELEARNING: { label: 'E-learning', cls: cls(TOKEN.primary) },
  WORKSHOP: { label: 'Workshop', cls: cls(TOKEN.success) },
  SEMINAR: { label: 'Seminário', cls: cls(TOKEN.success) },
  COACHING: { label: 'Coaching', cls: cls(TOKEN.warning) },
  MENTORING: { label: 'Mentoria', cls: cls(TOKEN.warning) },
};

export const LEVEL_CFG: StatusBadgeMap<TrainingLevel> = {
  BEGINNER: { label: 'Básico', cls: cls(TOKEN.success) },
  INTERMEDIATE: { label: 'Intermédio', cls: cls(TOKEN.warning) },
  ADVANCED: { label: 'Avançado', cls: cls(TOKEN.danger) },
};

export const PARTICIPANT_CFG: StatusBadgeMap<ParticipantStatus> = {
  WAITLIST: { label: 'Lista espera', cls: cls(TOKEN.neutral) },
  PENDING_APPROVAL: { label: 'Pendente aprovação', cls: cls(TOKEN.warning) },
  REGISTERED: { label: 'Inscrito', cls: cls(TOKEN.info) },
  ATTENDED: { label: 'Presente', cls: cls(TOKEN.success) },
  ABSENT: { label: 'Ausente', cls: cls(TOKEN.danger) },
  CANCELLED: {
    label: 'Cancelado',
    cls: 'bg-surface-sunken text-ink-faint',
  },
  REJECTED: { label: 'Rejeitado', cls: cls(TOKEN.danger) },
  COMPLETED: { label: 'Concluído', cls: cls(TOKEN.success) },
};

// Papéis que podem criar/gerir formações — espelha CAN_CREATE_TRAININGS do
// backend (trainings.controller.ts). Controla a visibilidade do separador
// "Gestão" (só a UI; a autorização real está sempre no backend).
export const CAN_MANAGE_TRAININGS_ROLES = [
  'ADMIN',
  'RH',
  'GESTOR',
  'INSTRUCTOR',
  'DIRECTOR',
  'LIDER',
] as const;

export const NAV = [
  { id: 'dashboard', label: 'Visão Geral' },
  { id: 'plans', label: 'Plano de Formação' },
  { id: 'catalog', label: 'Catálogo' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'my-trainings', label: 'Os meus treinamentos' },
  { id: 'manage', label: 'Gestão' },
] as const;

export type NavId = (typeof NAV)[number]['id'];

export const TITLES: Record<View, string> = {
  catalog: 'Treinamentos',
  detail: 'Detalhe',
  'my-trainings': 'Os meus treinamentos',
  dashboard: 'Visão Geral',
  manage: 'Gestão',
  'manage-detail': 'Gerir formação',
  plans: 'Plano de Formação',
  'plan-detail': 'Detalhe do plano',
  calendar: 'Calendário',
};

// docs/trainings-detalhado.md pt.3 — "Prioridade" da formação/plano.
export const PRIORITY_CFG: StatusBadgeMap<TrainingPriority> = {
  LOW: { label: 'Baixa', cls: cls(TOKEN.neutral) },
  MEDIUM: { label: 'Média', cls: cls(TOKEN.info) },
  HIGH: { label: 'Alta', cls: cls(TOKEN.warning) },
  URGENT: { label: 'Urgente', cls: cls(TOKEN.danger) },
};

export const STATUS_CFG: StatusBadgeMap<TrainingStatus> = {
  DRAFT: { label: 'Rascunho', cls: cls(TOKEN.neutral) },
  PUBLISHED: { label: 'Publicada', cls: cls(TOKEN.success) },
  ARCHIVED: { label: 'Arquivada', cls: cls(TOKEN.neutral) },
  CANCELLED: { label: 'Cancelada', cls: cls(TOKEN.danger) },
  COMPLETED: { label: 'Concluída', cls: cls(TOKEN.info) },
};

// docs/trainings-detalhado.md pt.2 — ciclo de vida do Plano de Formação.
export const PLAN_STATUS_CFG: StatusBadgeMap<TrainingPlanStatus> = {
  DRAFT: { label: 'Rascunho', cls: cls(TOKEN.neutral) },
  SUBMITTED: { label: 'Submetido', cls: cls(TOKEN.warning) },
  APPROVED: { label: 'Aprovado', cls: cls(TOKEN.info) },
  REJECTED: { label: 'Rejeitado', cls: cls(TOKEN.danger) },
  PUBLISHED: { label: 'Publicado', cls: cls(TOKEN.success) },
  ARCHIVED: { label: 'Arquivado', cls: cls(TOKEN.neutral) },
};

export const PLAN_PERIOD_LABEL: Record<string, string> = {
  ANNUAL: 'Anual',
  QUARTERLY: 'Trimestral',
  EXTRAORDINARY: 'Extraordinário',
};
