// components/live-classes/constants.ts
// Rótulos/configuração dos enums (docs/aulas-ao-vivo.md) e etapas do
// assistente "Nova Aula" — mesmo padrão de components/trainings/constants.ts.

import {
  BarChart3,
  Calendar,
  CirclePlay,
  DoorOpen,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Presentation,
  Settings,
  Star,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import type {
  LiveAttendanceStatus,
  LiveClassEnrollmentMode,
  LiveClassRecurrence,
  LiveClassStatus,
  LiveClassType,
  SessionModality,
} from './types';
import type { Role } from '@/lib/roles';

export const CAN_MANAGE_LIVE_CLASSES_ROLES: readonly Role[] = ['ADMIN', 'RH'];

// Espelha @Roles(Role.ADMIN, Role.RH, Role.LIDER) em
// live-classes.controller.ts para GET /evaluations, /evaluations/summary e
// /reports/* — usado só para esconder os separadores "Avaliações"/
// "Relatórios" de quem de qualquer forma levaria 403 do backend.
export const CAN_VIEW_LIVE_CLASSES_REPORTS_ROLES: readonly Role[] = [
  'ADMIN',
  'RH',
  'LIDER',
];

// ─── Navegação de topo (docs/aulas-ao-vivo.md — abas principais) ───────────
// Materiais/Avaliações/Relatórios/Configurações (secções 11/12/13/14)
// completam a lista — settings só é mostrado a canManage (ver page.tsx).
export const NAV = [
  {
    id: 'dashboard',
    hint: 'Resumo das aulas',
    icon: LayoutDashboard,
    label: 'Visão Geral',
  },
  { id: 'list', hint: 'Todas as aulas', icon: Video, label: 'Aulas' },
  { id: 'calendar', hint: 'Vista mensal', icon: Calendar, label: 'Calendário' },
  {
    id: 'sessions',
    hint: 'Sessões ao vivo',
    icon: Presentation,
    label: 'Sessões',
  },
  {
    id: 'participants',
    hint: 'Inscritos',
    icon: Users,
    label: 'Participantes',
  },
  {
    id: 'instructors',
    hint: 'Equipa docente',
    icon: GraduationCap,
    label: 'Formadores',
  },
  {
    id: 'rooms',
    hint: 'Salas e ligações',
    icon: DoorOpen,
    label: 'Salas & Links',
  },
  {
    id: 'recordings',
    hint: 'Aulas gravadas',
    icon: CirclePlay,
    label: 'Gravações',
  },
  {
    id: 'attendance',
    hint: 'Registo de presença',
    icon: UserCheck,
    label: 'Presenças',
  },
  {
    id: 'materials',
    hint: 'Ficheiros de apoio',
    icon: FolderOpen,
    label: 'Materiais',
  },
  {
    id: 'evaluations',
    hint: 'Feedback das aulas',
    icon: Star,
    label: 'Avaliações',
  },
  { id: 'reports', hint: 'Indicadores', icon: BarChart3, label: 'Relatórios' },
  {
    id: 'settings',
    hint: 'Parâmetros',
    icon: Settings,
    label: 'Configurações',
  },
] as const;

export type NavId = (typeof NAV)[number]['id'];

export const LIVE_ATTENDANCE_STATUS_CFG: Record<
  LiveAttendanceStatus,
  { label: string; cls: string }
> = {
  PRESENTE: { label: 'Presente', cls: 'bg-success-subtle text-success-ink' },
  AUSENTE: { label: 'Ausente', cls: 'bg-danger-subtle text-danger-ink' },
  ATRASADO: { label: 'Atrasado', cls: 'bg-warning-subtle text-warning-ink' },
  PARCIAL: {
    label: 'Presença parcial',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  JUSTIFICADO: { label: 'Justificado', cls: 'bg-info-subtle text-info-ink' },
};

export const TYPE_CFG: Record<LiveClassType, { label: string; cls: string }> = {
  AULA: { label: 'Aula', cls: 'bg-info-subtle text-info-ink' },
  WEBINAR: { label: 'Webinar', cls: 'bg-accent-subtle text-accent' },
  WORKSHOP: { label: 'Workshop', cls: 'bg-primary-subtle text-primary' },
  SESSAO_PRATICA: {
    label: 'Sessão prática',
    cls: 'bg-success-subtle text-success-ink',
  },
  SESSAO_ESCLARECIMENTO: {
    label: 'Sessão de esclarecimento',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  MENTORIA: { label: 'Mentoria', cls: 'bg-accent-subtle text-accent' },
  TUTORIA: { label: 'Tutoria', cls: 'bg-accent-subtle text-accent' },
  SESSAO_REVISAO: {
    label: 'Sessão de revisão',
    cls: 'bg-info-subtle text-info-ink',
  },
};

export const STATUS_CFG: Record<
  LiveClassStatus,
  { label: string; cls: string }
> = {
  AGENDADA: { label: 'Agendada', cls: 'bg-info-subtle text-info-ink' },
  EM_PREPARACAO: {
    label: 'Em preparação',
    cls: 'bg-warning-subtle text-warning-ink',
  },
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

export const ENROLLMENT_MODE_CFG: Record<
  LiveClassEnrollmentMode,
  { label: string }
> = {
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
