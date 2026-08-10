// components/executive-reports/constants.ts
// Mapas de badges/labels e títulos do módulo de relatórios
// executivos. Extraído de app/(platform)/executive-reports/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { KpiStatus, ReportStatus, ReportType, View } from './types';

export const TYPE_CFG: Record<
  ReportType,
  { label: string; icon: string; cls: string }
> = {
  FLASH: {
    label: 'Flash (Semanal)',
    icon: '⚡',
    cls: 'bg-amber-50 text-amber-700',
  },
  MONTHLY: { label: 'Mensal', icon: '📅', cls: 'bg-blue-50 text-blue-700' },
  QUARTERLY: {
    label: 'Trimestral',
    icon: '📊',
    cls: 'bg-purple-50 text-purple-700',
  },
  ANNUAL: { label: 'Anual', icon: '📈', cls: 'bg-emerald-50 text-emerald-700' },
  CUSTOM: {
    label: 'Personalizado',
    icon: '✏️',
    cls: 'bg-gray-100 text-gray-600',
  },
  AUDIT: { label: 'Auditoria', icon: '🔍', cls: 'bg-red-50 text-red-700' },
};

export const STATUS_CFG: StatusBadgeMap<ReportStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: 'Aprovado', cls: 'bg-blue-50 text-blue-700' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-emerald-50 text-emerald-700' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-gray-100 text-gray-400' },
};

export const KPI_STATUS: Record<
  KpiStatus,
  { color: string; bg: string; icon: string }
> = {
  GREEN: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: '🟢' },
  YELLOW: { color: 'text-amber-700', bg: 'bg-amber-50', icon: '🟡' },
  RED: { color: 'text-red-700', bg: 'bg-red-50', icon: '🔴' },
};

export const TITLES: Record<View, string> = {
  list: 'Relatórios Executivos',
  detail: 'Detalhe do Relatório',
  generate: 'Gerar Relatório',
};
