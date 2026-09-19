// components/evaluation/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de avaliação. Cores mapeadas para os tokens semânticos da
// fundação de design (Fase A):
// - STATUS_MAP/EVAL_TYPE_MAP usam StatusBadge (fallback seguro para
//   valores de enum ainda não mapeados, ver lib/statusBadge.ts).
// - SCORE_COLOR/SCORE_BG seguem a mesma convenção de 4 níveis já usada em
//   components/engagement/constants.ts (GRADE_COLOR/LEVEL_CONFIG):
//   score >= 4 success, >= 3 info, >= 2 warning, < 2 danger.
// Extraído verbatim (excepto cor) de app/(platform)/evaluation/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';

export const STATUS_MAP: StatusBadgeMap<string> = {
  DRAFT: { label: 'DRAFT', cls: 'bg-surface-sunken text-ink-muted' },
  PUBLISHED: { label: 'PUBLISHED', cls: 'bg-info-subtle text-info-ink' },
  ACTIVE: { label: 'ACTIVE', cls: 'bg-success-subtle text-success-ink' },
  PAUSED: { label: 'PAUSADO', cls: 'bg-warning-subtle text-warning-ink' },
  CALIBRATING: {
    label: 'CALIBRATING',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  COMPLETED: { label: 'COMPLETED', cls: 'bg-primary-subtle text-primary' },
  ARCHIVED: { label: 'ARCHIVED', cls: 'bg-surface-sunken text-ink-faint' },
};

// Estado agregado de uma linha da aba "Avaliações" (EvaluationRequestFilterDto
// status — PENDING/IN_PROGRESS/COMPLETED/SKIPPED).
export const REQUEST_STATUS_MAP: StatusBadgeMap<string> = {
  PENDING: { label: 'Pendente', cls: 'bg-surface-sunken text-ink-muted' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluída', cls: 'bg-success-subtle text-success-ink' },
  SKIPPED: { label: 'Ignorada', cls: 'bg-surface-sunken text-ink-faint' },
};

// docs/modulo_evaluation.md ponto 2, etapa 1 — "Tipo de avaliação" (EvalPurpose).
export const PURPOSE_LABEL: Record<string, string> = {
  PERFORMANCE: 'Avaliação de desempenho',
  PROBATION: 'Avaliação de período experimental',
  EXTRAORDINARY: 'Avaliação extraordinária',
  POST_TRAINING: 'Avaliação pós-formação',
  COMPETENCY: 'Avaliação de competências',
  GOALS: 'Avaliação de objetivos',
};

// docs/modulo_evaluation.md ponto 2, etapa 8 — "Fluxo" (EvalStage).
export const STAGE_LABEL: Record<string, string> = {
  SELF_EVAL: 'Autoavaliação',
  MANAGER_EVAL: 'Avaliação do gestor',
  HR_REVIEW: 'Revisão RH',
  CALIBRATION: 'Calibração',
  ONE_ON_ONE: 'Conversa 1:1',
  APPROVAL: 'Aprovação',
  DONE: 'Resultado final',
};
export const STAGE_ORDER = [
  'SELF_EVAL',
  'MANAGER_EVAL',
  'HR_REVIEW',
  'CALIBRATION',
  'ONE_ON_ONE',
  'APPROVAL',
  'DONE',
] as const;

// docs/modulo_evaluation.md ponto 2, etapa 3 — blocos seleccionáveis da
// estrutura da avaliação.
export const BLOCK_OPTIONS: { value: string; label: string }[] = [
  { value: 'GOALS', label: 'Objetivos & Metas' },
  { value: 'COMPETENCIES', label: 'Competências' },
  { value: 'BEHAVIORS', label: 'Comportamentos' },
  { value: 'RESPONSIBILITIES', label: 'Responsabilidades' },
  { value: 'RESULTS', label: 'Resultados' },
  { value: 'VALUES', label: 'Valores organizacionais' },
  { value: 'DEVELOPMENT', label: 'Desenvolvimento' },
];

// docs/modulo_evaluation.md ponto 2, etapa 2 — população abrangida.
export const POPULATION_TYPE_LABEL: Record<string, string> = {
  ALL: 'Todos os colaboradores',
  DEPARTMENT: 'Por departamento',
  UNIT: 'Por unidade',
  GROUP: 'Grupo de colaboradores',
};

export const TYPE_LABEL: Record<string, string> = {
  SELF: 'Autoavaliação',
  MANAGER: 'Gestor',
  PEER: 'Par',
  SUBORDINATE: 'Subordinado',
  CLIENT: 'Cliente',
};

// Badge de tipo de avaliador (PendingTab) — mapeia as 5 categorias para os
// 6 tokens semânticos disponíveis (uma por categoria, à excepção de
// `danger` que fica reservado para estados de erro/atraso reais).
export const EVAL_TYPE_MAP: StatusBadgeMap<string> = {
  SELF: { label: TYPE_LABEL.SELF, cls: 'bg-success-subtle text-success-ink' },
  MANAGER: {
    label: TYPE_LABEL.MANAGER,
    cls: 'bg-primary-subtle text-primary',
  },
  PEER: { label: TYPE_LABEL.PEER, cls: 'bg-info-subtle text-info-ink' },
  SUBORDINATE: {
    label: TYPE_LABEL.SUBORDINATE,
    cls: 'bg-warning-subtle text-warning-ink',
  },
  CLIENT: { label: TYPE_LABEL.CLIENT, cls: 'bg-accent-subtle text-accent' },
};

export const MODEL_LABEL: Record<string, string> = {
  '90': '90° (Gestor)',
  '180': '180° (Auto + Gestor)',
  '270': '270°',
  '360': '360° Completo',
  CONTINUOUS: 'Contínuo',
  PROJECT: 'Por Projecto',
};

export const SCORE_COLOR = (score: number) =>
  score >= 4
    ? 'text-success-ink'
    : score >= 3
      ? 'text-info-ink'
      : score >= 2
        ? 'text-warning-ink'
        : 'text-danger-ink';

// Meses para o filtro mês/ano do separador "Resultados" (ResultsTab) —
// mesma convenção de period "YYYY-MM" usada em components/payslips/format.ts.
export const MONTH_OPTIONS: { value: string; label: string }[] = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

// docs/modulo_evaluation.md pt.5 — "biblioteca central" de categorias de
// critério. Guardado como string livre no backend (EvaluationCriteria.category),
// não um enum Prisma — esta lista é só a sugestão apresentada no Select.
export const CRITERIA_CATEGORY_OPTIONS = [
  'Critérios de desempenho',
  'Competências comportamentais',
  'Competências técnicas',
  'Valores',
  'Liderança',
  'Resultados',
] as const;

// docs/modulo_evaluation.md pt.4 — categorias de modelo sugeridas.
// Guardado em EvaluationTemplate.type (string livre).
export const TEMPLATE_TYPE_OPTIONS = [
  'Avaliação anual',
  'Avaliação semestral',
  'Período experimental',
  'Liderança',
  'Administrativo',
  'Operacional',
  'Logística',
  'Indústria',
  'Lojas',
  'Modelo personalizado',
] as const;

export const SCORE_BG = (score: number) =>
  score >= 4
    ? 'bg-success-subtle border-success'
    : score >= 3
      ? 'bg-info-subtle border-info'
      : score >= 2
        ? 'bg-warning-subtle border-warning'
        : 'bg-danger-subtle border-danger';
