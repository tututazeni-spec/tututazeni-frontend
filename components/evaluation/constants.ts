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
  CALIBRATING: {
    label: 'CALIBRATING',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  COMPLETED: { label: 'COMPLETED', cls: 'bg-primary-subtle text-primary' },
  ARCHIVED: { label: 'ARCHIVED', cls: 'bg-surface-sunken text-ink-faint' },
};

export const TYPE_LABEL: Record<string, string> = {
  SELF: '🟢 Autoavaliação',
  MANAGER: '🟣 Gestor',
  PEER: '🔵 Par',
  SUBORDINATE: '🟡 Subordinado',
  CLIENT: '🟠 Cliente',
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

export const SCORE_BG = (score: number) =>
  score >= 4
    ? 'bg-success-subtle border-success'
    : score >= 3
      ? 'bg-info-subtle border-info'
      : score >= 2
        ? 'bg-warning-subtle border-warning'
        : 'bg-danger-subtle border-danger';
