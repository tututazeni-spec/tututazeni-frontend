// components/evaluation/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de avaliação. Extraído verbatim de
// app/(platform)/evaluation/page.tsx.

export const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CALIBRATING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-indigo-100 text-indigo-700',
  ARCHIVED: 'bg-slate-100 text-slate-400',
};

export const TYPE_LABEL: Record<string, string> = {
  SELF: '🟢 Autoavaliação',
  MANAGER: '🟣 Gestor',
  PEER: '🔵 Par',
  SUBORDINATE: '🟡 Subordinado',
  CLIENT: '🟠 Cliente',
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
    ? 'text-emerald-600'
    : score >= 3
      ? 'text-teal-600'
      : score >= 2
        ? 'text-amber-600'
        : 'text-red-600';

export const SCORE_BG = (score: number) =>
  score >= 4
    ? 'bg-emerald-50 border-emerald-200'
    : score >= 3
      ? 'bg-teal-50 border-teal-200'
      : score >= 2
        ? 'bg-amber-50 border-amber-200'
        : 'bg-red-50 border-red-200';
