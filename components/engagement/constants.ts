// components/engagement/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de engagement. Extraído verbatim de
// app/(platform)/engagement/page.tsx.

export const LEVEL_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  EXCELLENT: {
    label: 'Excelente',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  GOOD: {
    label: 'Bom',
    color: 'text-teal-700',
    bg: 'bg-teal-50 border-teal-200',
  },
  FAIR: {
    label: 'Razoável',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  AT_RISK: {
    label: 'Em Risco',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
  },
};

export const GRADE_COLOR: Record<string, string> = {
  A: 'text-emerald-600 border-emerald-400',
  B: 'text-teal-600 border-teal-400',
  C: 'text-amber-600 border-amber-400',
  D: 'text-red-600 border-red-400',
};

export const MOOD_EMOJI: Record<number, string> = {
  5: '😄',
  4: '🙂',
  3: '😐',
  2: '😔',
  1: '😞',
};

export const MOOD_LABEL: Record<number, string> = {
  5: 'Óptimo',
  4: 'Bem',
  3: 'Normal',
  2: 'Triste',
  1: 'Péssimo',
};
