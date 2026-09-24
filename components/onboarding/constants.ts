// components/onboarding/constants.ts
// Mapas de badges/labels, ordem de fases e navegação do módulo.
// Extraído de app/(platform)/onboarding/page.tsx.
//
// STATUS_CFG/TASK_STATUS_CFG/CATEGORY_CFG migrados para os tokens
// semânticos da fundação de design (Fase A) — mesmo padrão de TOKEN
// usado em components/trainings/constants.ts e
// components/reports/constants.ts. CATEGORY_CFG tinha exactamente 7
// categorias para os 6 tokens semânticos + neutral (um token distinto
// cada). POLICIES/EVALUATION entraram depois para cobrir "Políticas e
// procedimentos" e "Avaliações" da Estrutura do plano de integração, e
// ONE_ON_ONE para isolar "Reuniões 1:1" de MEETING (agora só reuniões de
// equipa/grupo) — com 10 categorias para 7 tokens, estas três reaproveitam
// o token de uma categoria próxima (ícone continua distinto).

import {
  Circle,
  Play,
  Check,
  Lock,
  CornerDownRight,
  FileText,
  Laptop,
  GraduationCap,
  Users,
  Gift,
  ClipboardList,
  Calendar,
  ShieldCheck,
  ClipboardCheck,
  UserCheck,
  LayoutDashboard,
  Layers,
  Milestone,
  ListChecks,
  MessageCircle,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_ROLES, EXECUTIVE_ROLES, type Role } from '@/lib/roles';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  CheckinStatus,
  CheckinType,
  DocStatus,
  OnboardingStatus,
  OnboardingTabId,
  ResponsibleRole,
  SurveyMilestone,
  TaskCategory,
  TaskPhase,
  TaskStatus,
  TaskType,
} from './types';

const TOKEN = {
  primary: { color: 'text-primary', bg: 'bg-primary-subtle' },
  accent: { color: 'text-accent', bg: 'bg-accent-subtle' },
  success: { color: 'text-success-ink', bg: 'bg-success-subtle' },
  warning: { color: 'text-warning-ink', bg: 'bg-warning-subtle' },
  danger: { color: 'text-danger-ink', bg: 'bg-danger-subtle' },
  info: { color: 'text-info-ink', bg: 'bg-info-subtle' },
  neutral: { color: 'text-ink-muted', bg: 'bg-surface-sunken' },
} as const;

const cls = (t: (typeof TOKEN)[keyof typeof TOKEN]) => `${t.bg} ${t.color}`;

const NEUTRAL_BADGE = 'border border-black bg-white text-black';

export const STATUS_CFG: StatusBadgeMap<OnboardingStatus> = {
  NOT_STARTED: { label: 'Não iniciado', cls: NEUTRAL_BADGE },
  IN_PROGRESS: { label: 'Em progresso', cls: NEUTRAL_BADGE },
  COMPLETED: { label: 'Concluído', cls: NEUTRAL_BADGE },
  ABANDONED: { label: 'Abandonado', cls: NEUTRAL_BADGE },
  ON_HOLD: { label: 'Em pausa', cls: NEUTRAL_BADGE },
};

export const TASK_STATUS_CFG: Record<
  TaskStatus,
  { icon: LucideIcon; cls: string }
> = {
  PENDING: { icon: Circle, cls: 'text-ink-faint' },
  IN_PROGRESS: { icon: Play, cls: 'text-info' },
  COMPLETED: { icon: Check, cls: 'text-success' },
  BLOCKED: { icon: Lock, cls: 'text-ink-faint' },
  SKIPPED: { icon: CornerDownRight, cls: 'text-ink-faint' },
};

export const CATEGORY_CFG: Record<
  TaskCategory,
  { label: string; icon: LucideIcon; cls: string }
> = {
  DOCUMENTS: { label: 'Documentos', icon: FileText, cls: cls(TOKEN.warning) },
  IT_ACCESS: {
    label: 'Acessos e Equipamentos',
    icon: Laptop,
    cls: cls(TOKEN.info),
  },
  TRAINING: {
    label: 'Formação obrigatória',
    icon: GraduationCap,
    cls: cls(TOKEN.accent),
  },
  SOCIAL: {
    label: 'Apresentações / Equipa',
    icon: Users,
    cls: cls(TOKEN.success),
  },
  BENEFITS: { label: 'Benefícios', icon: Gift, cls: cls(TOKEN.primary) },
  ADMIN: { label: 'Tarefas', icon: ClipboardList, cls: cls(TOKEN.neutral) },
  MEETING: {
    label: 'Reuniões de Equipa',
    icon: Calendar,
    cls: cls(TOKEN.danger),
  },
  POLICIES: {
    label: 'Políticas e Procedimentos',
    icon: ShieldCheck,
    cls: cls(TOKEN.neutral),
  },
  EVALUATION: {
    label: 'Avaliações',
    icon: ClipboardCheck,
    cls: cls(TOKEN.accent),
  },
  ONE_ON_ONE: {
    label: 'Reuniões 1:1',
    icon: UserCheck,
    cls: cls(TOKEN.danger),
  },
};

// Rótulos PT-PT dos enums Prisma. value = enum, validado por @IsEnum no
// backend (onboarding.dto.ts) — nunca traduzir o value, só o label.
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  TASK: 'Tarefa',
  COURSE: 'Curso',
  LEARNING_PATH: 'Percurso de aprendizagem',
  PROCESS: 'Processo',
  DOCUMENT: 'Documento',
  MEETING: 'Reunião',
};

// Movidos de PlanDetailModal.tsx para serem partilhados com DocumentsTab.tsx
// (Fase B, docs/onboarding.md ponto 6).
export const DOC_LABEL: Record<DocStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};
export const DOC_BADGE: Record<DocStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

// Fase C — Acompanhamento (docs/onboarding.md ponto 8).
export const CHECKIN_TYPE_LABELS: Record<CheckinType, string> = {
  DAY_1: '1.º dia',
  WEEK_1: '1.ª semana',
  DAY_30: '30 dias',
  DAY_60: '60 dias',
  DAY_90: '90 dias',
  CUSTOM: 'Avulso',
};
export const CHECKIN_STATUS_CFG: StatusBadgeMap<CheckinStatus> = {
  PENDING: { label: 'Pendente', cls: 'bg-warning-subtle text-warning-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success-subtle text-success-ink' },
  SKIPPED: { label: 'Saltado', cls: 'bg-surface-sunken text-ink-muted' },
};

export const RESPONSIBLE_LABELS: Record<ResponsibleRole, string> = {
  SELF: 'Colaborador',
  HR: 'RH',
  MANAGER: 'Gestor',
  IT: 'TI',
  BUDDY: 'Buddy / Mentor',
  EXTERNAL: 'Externo',
};

// Fase B: INTEGRATION/FOLLOW_UP/CONCLUSION são as 3 etapas novas
// (docs/onboarding.md ponto 4 — Integração/Acompanhamento/Conclusão).
// DAY_60/DAY_90 mantidos só para dados de templates antigos.
export const PHASE_LABELS: Record<TaskPhase, string> = {
  PRE_BOARDING: 'Pré-Onboarding',
  DAY_1: 'Primeiro Dia',
  WEEK_1: 'Primeira Semana',
  DAY_30: 'Primeiro Mês',
  DAY_60: 'Dia 60 (legado)',
  DAY_90: 'Dia 90 (legado)',
  INTEGRATION: 'Integração',
  FOLLOW_UP: 'Acompanhamento',
  CONCLUSION: 'Conclusão',
};

// Pesquisas de satisfação por marco. `day` = dias desde o início do plano a
// partir dos quais o marco fica disponível para resposta. Ordenados do mais
// cedo para o mais tarde.
export const SURVEY_MILESTONES: Array<{
  id: SurveyMilestone;
  day: number;
  label: string;
}> = [
  { id: 'DAY_1', day: 1, label: 'Dia 1' },
  { id: 'DAY_7', day: 7, label: 'Dia 7' },
  { id: 'DAY_30', day: 30, label: 'Dia 30' },
  { id: 'DAY_90', day: 90, label: 'Dia 90' },
];

export const SURVEY_MILESTONE_LABELS: Record<SurveyMilestone, string> =
  Object.fromEntries(SURVEY_MILESTONES.map((m) => [m.id, m.label])) as Record<
    SurveyMilestone,
    string
  >;

// Ordem de apresentação (PlanDetailModal/MyPlanView agrupam tarefas por
// esta ordem) — DAY_60/DAY_90 ficam entre DAY_30 e as 3 etapas novas para
// que tarefas antigas nessas fases continuem visíveis, mesmo não fazendo
// parte da estrutura de 7 etapas recomendada para templates novos.
export const PHASE_ORDER: TaskPhase[] = [
  'PRE_BOARDING',
  'DAY_1',
  'WEEK_1',
  'DAY_30',
  'DAY_60',
  'DAY_90',
  'INTEGRATION',
  'FOLLOW_UP',
  'CONCLUSION',
];

// Separadores de topo — nomenclatura e ordem seguem docs/onboarding.md
// (pontos 1-10). "O Meu Plano" (não numerado no doc) é a vista pessoal do
// colaborador e fica sempre visível, fora da numeração. `roles` espelha os
// @Roles() reais do backend (onboarding.controller.ts) — EXECUTIVE_ROLES
// (ADMIN/RH/GESTOR), não MGMT_ROLES de lib/roles.ts, porque esse inclui
// LIDER e o backend não autoriza LIDER nestas rotas
// (GET /onboarding/dashboard, GET /onboarding).
// Fase A (pontos 1-3): Visão Geral, Onboardings, Planos de Integração.
// Fase B (pontos 4-7, esta): Etapas/Tarefas/Documentos/Formação — leitura
// EXECUTIVE_ROLES, espelhando @Roles(ADMIN, RH, GESTOR) das novas rotas
// GET /onboarding/tasks|documents|training (onboarding.controller.ts).
// "Etapas" fica sem roles (como "Planos de Integração", de que depende —
// GET /onboarding/templates/:id/stages não tem @Roles() próprio).
// Fase C acrescenta Acompanhamento/Avaliação de Integração/Relatórios.
export const TABS: Array<{
  id: OnboardingTabId;
  label: string;
  icon: LucideIcon;
  roles?: readonly Role[];
}> = [
  { id: 'my-plan', label: 'O Meu Plano', icon: UserCheck },
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, roles: EXECUTIVE_ROLES },
  { id: 'plans', label: 'Onboardings', icon: ClipboardList, roles: EXECUTIVE_ROLES },
  { id: 'templates', label: 'Planos de Integração', icon: Layers },
  { id: 'stages', label: 'Etapas', icon: Milestone },
  { id: 'tasks', label: 'Tarefas', icon: ListChecks, roles: EXECUTIVE_ROLES },
  { id: 'documents', label: 'Documentos', icon: FileText, roles: EXECUTIVE_ROLES },
  { id: 'training', label: 'Formação', icon: GraduationCap, roles: EXECUTIVE_ROLES },
  { id: 'checkins', label: 'Acompanhamento', icon: MessageCircle, roles: EXECUTIVE_ROLES },
  { id: 'integration-evaluations', label: 'Avaliação de Integração', icon: ClipboardCheck, roles: EXECUTIVE_ROLES },
  // Relatórios espelha @Roles(ADMIN, RH) de GET /onboarding/reports/overview
  // — mais restrito que as outras (sem GESTOR), por isso usa ADMIN_ROLES.
  { id: 'reports', label: 'Relatórios', icon: FileBarChart, roles: ADMIN_ROLES },
];
