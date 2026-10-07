// components/avatar-training/constants.ts
import {
  Award,
  BarChart2,
  BookOpen,
  Bot,
  ClipboardCheck,
  GraduationCap,
  Hammer,
  History,
  LayoutDashboard,
  Presentation,
  Settings,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import type { PillTabItem } from '@/components/ui/PillTabs';
import type { Role } from '@/lib/roles';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  AssignmentStatus,
  AttemptStatus,
  AvatarStatus,
  AvatarType,
  ExperienceType,
  ProgramStatus,
  SourceType,
  TabId,
} from './types';

// Espelham AVATAR_*_ROLES em src/avatar-training/avatar-training.helpers.ts.
export const ADMIN_ROLES: readonly Role[] = ['ADMIN', 'RH'];
export const AUTHOR_ROLES: readonly Role[] = ['ADMIN', 'RH', 'INSTRUCTOR'];
export const PROGRESS_ROLES: readonly Role[] = [
  'ADMIN',
  'RH',
  'DIRECTOR',
  'GESTOR',
  'LIDER',
  'AUDITOR',
  'INSTRUCTOR',
];

export const TABS: Array<PillTabItem & { id: TabId; roles?: readonly Role[] }> =
  [
    {
      id: 'overview',
      label: 'Visão Geral',
      hint: 'Resumo do módulo',
      icon: LayoutDashboard,
    },
    {
      id: 'room',
      label: 'Sala de Formação Virtual',
      hint: 'Sessões ao vivo',
      icon: Presentation,
    },
    {
      id: 'programs',
      label: 'Formações com Avatar',
      hint: 'Programas publicados',
      icon: GraduationCap,
    },
    {
      id: 'simulations',
      label: 'Simulações',
      hint: 'Cenários práticos',
      icon: Workflow,
    },
    {
      id: 'builder',
      label: 'Construtor de Sessões',
      hint: 'Criar sessões',
      icon: Hammer,
      roles: AUTHOR_ROLES,
    },
    {
      id: 'knowledge',
      label: 'Base de Conhecimento',
      hint: 'Fontes dos avatares',
      icon: BookOpen,
      roles: AUTHOR_ROLES,
    },
    {
      id: 'assessments',
      label: 'Avaliações',
      hint: 'Provas práticas',
      icon: ClipboardCheck,
      roles: AUTHOR_ROLES,
    },
    {
      id: 'competencies',
      label: 'Competências',
      hint: 'Níveis e evidências',
      icon: Award,
    },
    {
      id: 'avatars',
      label: 'Avatares',
      hint: 'Gestão de avatares',
      icon: Bot,
      roles: AUTHOR_ROLES,
    },
    {
      id: 'progress',
      label: 'Progresso dos Formandos',
      hint: 'Evolução dos formandos',
      icon: TrendingUp,
    },
    {
      id: 'reports',
      label: 'Relatórios',
      hint: 'Métricas e exportação',
      icon: BarChart2,
      roles: PROGRESS_ROLES,
    },
    {
      id: 'settings',
      label: 'Configurações',
      hint: 'Parâmetros do módulo',
      icon: Settings,
      roles: AUTHOR_ROLES,
    },
    {
      id: 'history',
      label: 'Histórico',
      hint: 'Sessões anteriores',
      icon: History,
    },
  ];

export const EXPERIENCE_LABEL: Record<ExperienceType, string> = {
  GUIDED_LESSON: 'Aula guiada',
  Q_AND_A: 'Perguntas e respostas',
  ROLE_PLAY: 'Role-play',
  PROCEDURE_DEMO: 'Demonstração de procedimento',
  PRACTICAL_ASSESSMENT: 'Avaliação prática',
  PERSONALIZED_REVIEW: 'Revisão personalizada',
};

export const PROGRAM_STATUS: StatusBadgeMap<ProgramStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-warning-subtle text-warning-ink' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-success-subtle text-success-ink' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-surface-sunken text-ink-faint' },
};

export const AVATAR_STATUS: StatusBadgeMap<AvatarStatus> = {
  ACTIVE: { label: 'Activo', cls: 'bg-success-subtle text-success-ink' },
  TESTING: { label: 'Em teste', cls: 'bg-warning-subtle text-warning-ink' },
  INACTIVE: { label: 'Inactivo', cls: 'bg-surface-sunken text-ink-muted' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-surface-sunken text-ink-faint' },
};

export const ASSIGNMENT_STATUS: StatusBadgeMap<AssignmentStatus> = {
  ASSIGNED: { label: 'Atribuída', cls: 'bg-info-subtle text-info-ink' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-primary-subtle text-primary' },
  COMPLETED: { label: 'Concluída', cls: 'bg-success-subtle text-success-ink' },
  OVERDUE: { label: 'Em atraso', cls: 'bg-danger-subtle text-danger-ink' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-surface-sunken text-ink-faint' },
};

export const ATTEMPT_STATUS: StatusBadgeMap<AttemptStatus> = {
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-primary-subtle text-primary' },
  PAUSED: { label: 'Em pausa', cls: 'bg-warning-subtle text-warning-ink' },
  SUBMITTED: { label: 'Submetida', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluída', cls: 'bg-success-subtle text-success-ink' },
  FAILED: { label: 'Reprovada', cls: 'bg-danger-subtle text-danger-ink' },
  ABANDONED: { label: 'Abandonada', cls: 'bg-surface-sunken text-ink-faint' },
};

export const SIMULATION_TYPES: readonly ExperienceType[] = [
  'ROLE_PLAY',
  'PRACTICAL_ASSESSMENT',
];

export const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermédio',
  ADVANCED: 'Avançado',
  EXPERT: 'Especialista',
};

export const LEVEL_FIT_LABEL = {
  MATCH: 'Adequada ao seu nível',
  EASIER: 'Abaixo do seu nível (revisão)',
  HARDER: 'Acima do seu nível',
} as const;

export const AVATAR_TYPE_LABEL: Record<AvatarType, string> = {
  IMAGE: 'Imagem',
  AVATAR_2D: 'Avatar 2D',
  AVATAR_3D: 'Avatar 3D',
  VIDEO: 'Vídeo',
};

export const SOURCE_LABEL: Record<SourceType, string> = {
  COURSE: 'Curso',
  LESSON: 'Lição',
  DOCUMENT: 'Documento',
  LIBRARY_ITEM: 'Item da biblioteca',
};

export const LANGUAGE_ITEMS = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
];

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  CREATE: 'Criado',
  UPDATE: 'Alterado',
  TEST: 'Testado',
};
