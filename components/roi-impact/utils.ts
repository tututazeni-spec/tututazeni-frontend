// components/roi-impact/utils.ts
// Formatação de valores monetários abreviados (AOA 1.2M, AOA 340K, ...) e
// mapa de nível de confiança (HIGH/MEDIUM/LOW) para label + intent do Badge
// da fundação de design. Extraído de app/(platform)/roi-impact/page.tsx.

export function fmt$(val: number): string {
  if (val >= 1000000) return `AOA ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `AOA ${(val / 1000).toFixed(0)}K`;
  return `AOA ${val.toLocaleString()}`;
}

// Normaliza texto livre vindo do backend (insights, narrativas, alertas):
// troca o símbolo "$" por "AOA" e a palavra "turnover" por "Rotatividade",
// sem alterar o serviço roi-impact.
export function ptInsight(text: string): string {
  return text
    .replace(/\$\s?/g, 'AOA ')
    .replace(/turnover/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Rotatividade' : 'rotatividade'));
}

export const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: 'Alta Confiança',
  MEDIUM: 'Média Confiança',
  LOW: 'Baixa Confiança',
};

export const CONFIDENCE_INTENTS: Record<string, 'success' | 'warning' | 'danger'> = {
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'danger',
};
