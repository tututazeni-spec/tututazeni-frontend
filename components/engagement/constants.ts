// components/engagement/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de engagement. Cores mapeadas para os tokens semânticos da
// fundação de design (Fase A) — GRADE_COLOR passou de string combinada
// para { text, border } (o OverviewTab deixa de precisar de fatiar a
// string para extrair só a cor do texto).

export const LEVEL_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  EXCELLENT: {
    label: 'Excelente',
    color: 'text-success-ink',
    bg: 'bg-success-subtle border-success',
  },
  GOOD: {
    label: 'Bom',
    color: 'text-info-ink',
    bg: 'bg-info-subtle border-info',
  },
  FAIR: {
    label: 'Razoável',
    color: 'text-warning-ink',
    bg: 'bg-warning-subtle border-warning',
  },
  AT_RISK: {
    label: 'Em Risco',
    color: 'text-danger-ink',
    bg: 'bg-danger-subtle border-danger',
  },
};

export const GRADE_COLOR: Record<string, { text: string; border: string }> = {
  A: { text: 'text-success-ink', border: 'border-success' },
  B: { text: 'text-info-ink', border: 'border-info' },
  C: { text: 'text-warning-ink', border: 'border-warning' },
  D: { text: 'text-danger-ink', border: 'border-danger' },
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
