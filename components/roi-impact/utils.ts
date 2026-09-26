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

// Impacto no Negócio (docs/roi-impact.md §3)
export const IMPACT_SUBJECT_TYPE_LABELS: Record<string, string> = {
  COLABORADOR: 'Colaborador',
  EQUIPA: 'Equipa',
  DEPARTAMENTO: 'Departamento',
};

export const IMPACT_CATEGORY_LABELS: Record<string, string> = {
  PRODUTIVIDADE: 'Produtividade',
  QUALIDADE: 'Qualidade',
  ROTATIVIDADE: 'Rotatividade',
  ABSENTISMO: 'Absentismo',
  SEGURANCA: 'Segurança',
  VENDAS_RECEITA: 'Vendas/Receita',
  SATISFACAO_CLIENTE: 'Satisfação do cliente',
  SATISFACAO_COLABORADOR: 'Satisfação/engagement do colaborador',
  TEMPO_RESPOSTA: 'Tempo de resposta/ciclo',
  CUMPRIMENTO_SLA: 'Cumprimento de SLA',
  COMPLIANCE: 'Compliance',
  CUSTO_EVITADO: 'Custo evitado',
};

// Modelos de Avaliação (docs/roi-impact.md §4)
export const ROI_MODEL_STATUS_LABELS: Record<string, string> = {
  ACTIVO: 'Ativo',
  INACTIVO: 'Inativo',
};

export const ROI_MODEL_STATUS_INTENTS: Record<string, 'success' | 'neutral'> = {
  ACTIVO: 'success',
  INACTIVO: 'neutral',
};

// Custos & Investimento (docs/roi-impact.md §5)
export const COST_CATEGORY_LABELS: Record<string, string> = {
  DIRETO: 'Direto',
  INDIRETO: 'Indireto',
  OPORTUNIDADE: 'Oportunidade',
};

export const COST_CATEGORY_INTENTS: Record<string, 'info' | 'warning' | 'danger'> = {
  DIRETO: 'info',
  INDIRETO: 'warning',
  OPORTUNIDADE: 'danger',
};

export const COST_SUBCATEGORY_LABELS: Record<string, string> = {
  FORMADOR_CONSULTOR: 'Formador/consultor externo',
  MATERIAL_DIDATICO: 'Material didático',
  PLATAFORMA_LICENCAS: 'Plataforma/licenças',
  SALA_LOGISTICA: 'Sala/logística',
  DESLOCACAO_ALOJAMENTO: 'Deslocação e alojamento',
  CERTIFICACAO: 'Certificação',
  HORAS_TRABALHO_PERDIDAS: 'Horas de trabalho perdidas',
  SUBSTITUICAO_COBERTURA: 'Substituição/cobertura durante ausência',
  COORDENACAO_GESTAO_RH: 'Coordenação e gestão do RH',
  PRODUCAO_NAO_REALIZADA: 'Produção não realizada',
  ATRASO_PROJETOS: 'Atraso de projetos associados',
};

// Agrupa as subcategorias por categoria — usado no Select do formulário
// "Nova Linha de Custo" para o utilizador escolher directamente a
// subcategoria (a categoria é sempre derivada no backend).
export const COST_SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  DIRETO: [
    'FORMADOR_CONSULTOR',
    'MATERIAL_DIDATICO',
    'PLATAFORMA_LICENCAS',
    'SALA_LOGISTICA',
    'DESLOCACAO_ALOJAMENTO',
    'CERTIFICACAO',
  ],
  INDIRETO: ['HORAS_TRABALHO_PERDIDAS', 'SUBSTITUICAO_COBERTURA', 'COORDENACAO_GESTAO_RH'],
  OPORTUNIDADE: ['PRODUCAO_NAO_REALIZADA', 'ATRASO_PROJETOS'],
};

// Inverso do mapa acima — só para pré-visualização no formulário (a
// categoria real é sempre derivada no backend a partir da subcategoria
// escolhida, nunca aceite do cliente).
export const CATEGORY_BY_COST_SUBCATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(COST_SUBCATEGORIES_BY_CATEGORY).flatMap(([category, subs]) =>
    subs.map((sub) => [sub, category]),
  ),
);

// Indicadores & KPIs (docs/roi-impact.md §6)
export const KPI_CATEGORY_LABELS: Record<string, string> = {
  PRODUTIVIDADE: 'Produtividade',
  QUALIDADE: 'Qualidade',
  PESSOAS: 'Pessoas',
  FINANCEIRO: 'Financeiro',
  CLIENTE: 'Cliente',
  SEGURANCA: 'Segurança',
  COMPLIANCE: 'Compliance',
};

export const KPI_FREQUENCY_LABELS: Record<string, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export const KPI_STATUS_LABELS: Record<string, string> = {
  ACTIVO: 'Ativo',
  INACTIVO: 'Inativo',
};

export const KPI_STATUS_INTENTS: Record<string, 'success' | 'neutral'> = {
  ACTIVO: 'success',
  INACTIVO: 'neutral',
};

// Correlações (docs/roi-impact.md §7)
export const CORRELATION_TYPE_LABELS: Record<string, string> = {
  HORAS_FORMACAO_DESEMPENHO: 'Horas de formação × desempenho',
  COMPETENCIAS_PRODUTIVIDADE: 'Competências × produtividade',
  PDI_RETENCAO: 'PDI × retenção',
  INVESTIMENTO_ROTATIVIDADE: 'Investimento × rotatividade',
  ONBOARDING_TEMPO_PRODUTIVIDADE: 'Onboarding × tempo até produtividade',
  MENTORIA_PROGRESSAO_CARREIRA: 'Mentoria × progressão de carreira',
  LIDERANCA_ENGAGEMENT_EQUIPA: 'Liderança × engagement da equipa',
};

// Convenção estatística comum: |r| < 0.3 fraca, < 0.6 moderada, >= 0.6 forte
// (independente do sinal — a força não implica direcção nem causalidade).
export function correlationStrengthLabel(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.6) return 'Forte';
  if (abs >= 0.3) return 'Moderada';
  return 'Fraca';
}

// Cenários & Simulações (docs/roi-impact.md §8)
export const SCENARIO_CASE_LABELS: Record<string, string> = {
  OTIMISTA: 'Otimista',
  REALISTA: 'Realista',
  PESSIMISTA: 'Pessimista',
};

export const SCENARIO_CASE_INTENTS: Record<string, 'success' | 'info' | 'warning'> = {
  OTIMISTA: 'success',
  REALISTA: 'info',
  PESSIMISTA: 'warning',
};

// Benchmarks (docs/roi-impact.md §9)
export const BENCHMARK_TYPE_LABELS: Record<string, string> = {
  INTERNO: 'Interno',
  EXTERNO: 'Externo',
};

export const BENCHMARK_TYPE_INTENTS: Record<string, 'info' | 'neutral'> = {
  INTERNO: 'neutral',
  EXTERNO: 'info',
};

// Relatórios (docs/roi-impact.md §10)
export const ROI_REPORT_LABELS: Record<string, string> = {
  'roi-consolidated': 'ROI consolidado da Academia',
  'roi-by-dimension': 'ROI por departamento/unidade/tipo',
  'impact-by-indicator': 'Impacto no negócio por indicador',
  'training-cost-vs-budget': 'Custo de formação vs. orçamento',
  'budget-execution': 'Execução orçamental da Academia',
  'top-initiatives': 'Top iniciativas por ROI',
  'insufficient-data': 'Iniciativas sem dados suficientes',
  'roi-evolution': 'Evolução do ROI ano a ano',
  'onboarding-retention': 'Impacto do onboarding na retenção',
  'leadership-engagement': 'Impacto da liderança no engagement',
  'executive-summary': 'Relatório executivo para Administração',
};
