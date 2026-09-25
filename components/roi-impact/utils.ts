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

// ROI da Formação (docs/roi-impact.md §2)
export const INITIATIVE_TYPE_LABELS: Record<string, string> = {
  CURSO: 'Curso',
  FORMACAO: 'Formação',
  PERCURSO: 'Percurso',
  PDI: 'PDI',
  MENTORIA: 'Mentoria',
  EVENTO: 'Evento',
};

export const ANALYSIS_STATUS_LABELS: Record<string, string> = {
  EM_PREPARACAO: 'Em preparação',
  EM_MEDICAO: 'Em medição',
  DADOS_INSUFICIENTES: 'Dados insuficientes',
  CALCULADO: 'Calculado',
  VALIDADO: 'Validado',
  REVISTO: 'Revisto',
  ARQUIVADO: 'Arquivado',
};

export const ANALYSIS_STATUS_INTENTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  EM_PREPARACAO: 'neutral',
  EM_MEDICAO: 'info',
  DADOS_INSUFICIENTES: 'warning',
  CALCULADO: 'info',
  VALIDADO: 'success',
  REVISTO: 'success',
  ARQUIVADO: 'neutral',
};

export const BENEFIT_TYPE_LABELS: Record<string, string> = {
  PRODUTIVIDADE: 'Produtividade',
  QUALIDADE: 'Qualidade',
  REDUCAO_ERROS: 'Redução de erros',
  REDUCAO_ROTATIVIDADE: 'Redução de rotatividade',
  REDUCAO_ACIDENTES: 'Redução de acidentes',
  AUMENTO_VENDAS: 'Aumento de vendas',
  REDUCAO_TEMPO_CICLO: 'Redução de tempo de ciclo',
  SATISFACAO_CLIENTE: 'Satisfação do cliente',
  OUTRO: 'Outro',
};
