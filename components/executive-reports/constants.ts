// components/executive-reports/constants.ts
// Mapas de badges/labels e títulos do módulo de relatórios
// executivos. Extraído de app/(platform)/executive-reports/page.tsx.
//
// TYPE_CFG/STATUS_CFG/KPI_STATUS usam os tokens semânticos da fundação de
// design (Fase A) — 6 tipos de relatório mapeiam 1:1 para
// primary/accent/success/warning/danger/info + neutral, mesmo padrão de
// TOKEN usado em components/reports/constants.ts.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { KpiStatus, ReportStatus, ReportType, View } from './types';

const TOKEN = {
  primary: { color: 'text-primary', bg: 'bg-primary-subtle' },
  success: { color: 'text-success-ink', bg: 'bg-success-subtle' },
  warning: { color: 'text-warning-ink', bg: 'bg-warning-subtle' },
  danger: { color: 'text-danger-ink', bg: 'bg-danger-subtle' },
  info: { color: 'text-info-ink', bg: 'bg-info-subtle' },
  neutral: { color: 'text-ink-muted', bg: 'bg-surface-sunken' },
} as const;

export const TYPE_CFG: Record<
  ReportType,
  { label: string; color: string; bg: string }
> = {
  FLASH: { label: 'Flash (Semanal)', ...TOKEN.warning },
  MONTHLY: { label: 'Mensal', ...TOKEN.info },
  QUARTERLY: { label: 'Trimestral', ...TOKEN.primary },
  ANNUAL: { label: 'Anual', ...TOKEN.success },
  CUSTOM: { label: 'Personalizado', ...TOKEN.neutral },
  AUDIT: { label: 'Auditoria', ...TOKEN.danger },
};

export const STATUS_CFG: StatusBadgeMap<ReportStatus> = {
  DRAFT: { label: 'Rascunho', cls: `${TOKEN.neutral.bg} ${TOKEN.neutral.color}` },
  IN_REVIEW: { label: 'Em revisão', cls: `${TOKEN.warning.bg} ${TOKEN.warning.color}` },
  APPROVED: { label: 'Aprovado', cls: `${TOKEN.info.bg} ${TOKEN.info.color}` },
  PUBLISHED: { label: 'Publicado', cls: `${TOKEN.success.bg} ${TOKEN.success.color}` },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-surface-sunken text-ink-faint' },
};

export const KPI_STATUS: Record<
  KpiStatus,
  { color: string; bg: string; icon: string }
> = {
  GREEN: { ...TOKEN.success, icon: '🟢' },
  YELLOW: { ...TOKEN.warning, icon: '🟡' },
  RED: { ...TOKEN.danger, icon: '🔴' },
};

// Rótulos PT-PT das secções de template devolvidas pelo backend em inglês
// (executive-reports.service.ts#getTemplates). Mantém-se a chave inglesa
// como fonte e traduz-se só na apresentação — mesmo padrão de SEV_LABEL/
// TYPE_LABEL usado nos insights de reports.
export const SECTION_LABEL: Record<string, string> = {
  headcount: 'Efectivos',
  learning_week: 'Semana de formação',
  alerts: 'Alertas',
  people: 'Pessoas',
  learning: 'Formação',
  pdi: 'PDI',
  performance: 'Desempenho',
  executive_summary: 'Sumário executivo',
  roi: 'ROI',
  succession: 'Sucessão',
  diversity: 'Diversidade',
  benchmark: 'Benchmark',
};

export const TITLES: Record<View, string> = {
  list: 'Relatórios Executivos',
  detail: 'Detalhe do Relatório',
  generate: 'Gerar Relatório',
};
