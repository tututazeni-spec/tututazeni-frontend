// components/roi-impact/utils.ts
// Formatação de valores monetários abreviados ($1.2M, $340K, ...) e mapa
// de nível de confiança (HIGH/MEDIUM/LOW) para label + intent do Badge da
// fundação de design. Extraído de app/(platform)/roi-impact/page.tsx.

export function fmt$(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

export const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: 'Alta Confiança',
  MEDIUM: 'Média Confiança',
  LOW: 'Baixa Confiança ⚠️',
};

export const CONFIDENCE_INTENTS: Record<string, 'success' | 'warning' | 'danger'> = {
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'danger',
};
