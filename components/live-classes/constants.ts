// components/live-classes/constants.ts
// Rótulos/configuração dos enums (docs/aulas-ao-vivo.md) e etapas do
// assistente "Nova Aula" — mesmo padrão de components/trainings/constants.ts.

import type {
  LiveClassEnrollmentMode,
  LiveClassRecurrence,
  LiveClassStatus,
  LiveClassType,
  SessionModality,
} from './types';

export const CAN_MANAGE_LIVE_CLASSES_ROLES = ['ADMIN', 'RH'] as const;

// ─── Navegação de topo (Visão Geral/Aulas/Calendário/Sessões) ───────────────
export const NAV = [
  { id: 'dashboard', label: 'Visão Geral' },
  { id: 'list', label: 'Aulas' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'sessions', label: 'Sessões' },
] as const;

export type NavId = (typeof NAV)[number]['id'];

export const TYPE_CFG: Record<LiveClassType, { label: string; cls: string }> = {
  AULA: { label: 'Aula', cls: 'bg-info-subtle text-info-ink' },
  WEBINAR: { label: 'Webinar', cls: 'bg-accent-subtle text-accent' },
  WORKSHOP: { label: 'Workshop', cls: 'bg-primary-subtle text-primary' },
  SESSAO_PRATICA: { label: 'Sessão prática', cls: 'bg-success-subtle text-success-ink' },
  SESSAO_ESCLARECIMENTO: { label: 'Sessão de esclarecimento', cls: 'bg-warning-subtle text-warning-ink' },
  MENTORIA: { label: 'Mentoria', cls: 'bg-accent-subtle text-accent' },
  TUTORIA: { label: 'Tutoria', cls: 'bg-accent-subtle text-accent' },
  SESSAO_REVISAO: { label: 'Sessão de revisão', cls: 'bg-info-subtle text-info-ink' },
};

export const STATUS_CFG: Record<LiveClassStatus, { label: string; cls: string }> = {
  AGENDADA: { label: 'Agendada', cls: 'bg-info-subtle text-info-ink' },
  EM_PREPARACAO: { label: 'Em preparação', cls: 'bg-warning-subtle text-warning-ink' },
  EM_CURSO: { label: 'Em curso', cls: 'bg-danger-subtle text-danger-ink' },
  CONCLUIDA: { label: 'Concluída', cls: 'bg-success-subtle text-success-ink' },
  CANCELADA: { label: 'Cancelada', cls: 'bg-surface-sunken text-ink-faint' },
  ADIADA: { label: 'Adiada', cls: 'bg-warning-subtle text-warning-ink' },
};

export const MODALITY_CFG: Record<SessionModality, { label: string }> = {
  ONLINE: { label: 'Online' },
  PRESENTIAL: { label: 'Presencial' },
  HYBRID: { label: 'Híbrida' },
};

export const RECURRENCE_CFG: Record<LiveClassRecurrence, { label: string }> = {
  ONCE: { label: 'Uma vez' },
  DAILY: { label: 'Diária' },
  WEEKLY: { label: 'Semanal' },
  CUSTOM: { label: 'Personalizada' },
};

export const ENROLLMENT_MODE_CFG: Record<LiveClassEnrollmentMode, { label: string }> = {
  AUTO: { label: 'Inscrição automática' },
  MANUAL: { label: 'Inscrição manual' },
  SELF: { label: 'Autoinscrição' },
  APPROVAL: { label: 'Aprovação necessária' },
};

export const WEEKDAY_ITEMS = [
  { value: '0', label: 'Dom' },
  { value: '1', label: 'Seg' },
  { value: '2', label: 'Ter' },
  { value: '3', label: 'Qua' },
  { value: '4', label: 'Qui' },
  { value: '5', label: 'Sex' },
  { value: '6', label: 'Sáb' },
];

// ─── Assistente "Nova Aula" (secção 3 — etapas 1 a 9) ───────────────────────

export type WizardStepId =
  | 'general'
  | 'schedule'
  | 'modality'
  | 'participants'
  | 'content'
  | 'attendance'
  | 'recording'
  | 'evaluation'
  | 'notifications';

export const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: 'general', label: 'Informações gerais' },
  { id: 'schedule', label: 'Data e horário' },
  { id: 'modality', label: 'Modalidade' },
  { id: 'participants', label: 'Participantes' },
  { id: 'content', label: 'Conteúdo' },
  { id: 'attendance', label: 'Presença' },
  { id: 'recording', label: 'Gravação' },
  { id: 'evaluation', label: 'Avaliação' },
  { id: 'notifications', label: 'Notificações' },
];
