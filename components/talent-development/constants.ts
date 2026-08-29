// components/talent-development/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo. Extraído verbatim de app/(platform)/talent-development/page.tsx.
//
// Cores mapeadas para os tokens semânticos da fundação de design (Fase A).
// TIER_CFG/STATUS_CFG passaram de mapas soltos de classe (usados em spans
// à mão) para StatusBadgeMap consumidos por components/ui/StatusBadge —
// mesmo padrão já usado em components/sucession/constants.ts
// (RISK_CFG/READINESS_CFG/COVERAGE_CFG).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { Tier } from './types';

export const TIER_CFG: StatusBadgeMap<Tier> = {
  HIGH: { label: 'HiPo', cls: 'bg-success-subtle text-success-ink' },
  MEDIUM: { label: 'Médio', cls: 'bg-warning-subtle text-warning-ink' },
  DEVELOPING: { label: 'Dev.', cls: 'bg-surface-sunken text-ink-muted' },
};

export const TIER_LABEL: Record<Tier, string> = {
  HIGH: 'Alto Potencial',
  MEDIUM: 'Médio',
  DEVELOPING: 'Em Desenvolvimento',
};

export const TIER_DOT: Record<Tier, string> = {
  HIGH: 'bg-success',
  MEDIUM: 'bg-warning',
  DEVELOPING: 'bg-ink-faint',
};

export const STATUS_CFG: StatusBadgeMap<string> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  ACTIVE: { label: 'Activo', cls: 'bg-info-subtle text-info-ink' },
  PAUSED: { label: 'Em Pausa', cls: 'bg-warning-subtle text-warning-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success-subtle text-success-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-danger-subtle text-danger-ink' },
};

// Etiqueta curta de estado para botões de filtro (o valor bruto continua a
// ser a chave enviada para o backend).
export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Activo',
  PAUSED: 'Em Pausa',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-ink-faint',
  MEDIUM: 'text-warning-ink',
  HIGH: 'text-danger-ink',
  CRITICAL: 'text-danger',
};

export const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

// Grau do Talent Health Score (A–D) — mesmo padrão de
// components/engagement/constants.ts#GRADE_COLOR (piloto).
export const GRADE_COLOR: Record<string, { text: string; border: string }> = {
  A: { text: 'text-success-ink', border: 'border-success' },
  B: { text: 'text-info-ink', border: 'border-info' },
  C: { text: 'text-warning-ink', border: 'border-warning' },
  D: { text: 'text-danger-ink', border: 'border-danger' },
};
