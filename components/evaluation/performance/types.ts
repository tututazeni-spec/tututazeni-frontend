// components/evaluation/performance/types.ts
// Tipos e rótulos da avaliação de desempenho estruturada
// (docs/avaliacao_desempenho_robusta_claude_code.md). Os valores espelham os
// enums do backend (src/evaluation/evaluation.dto.ts); os cálculos
// (classificação ponderada, completude) vivem só no backend.

export interface RatingLevel {
  value: number;
  label: string;
  description: string;
}

export interface RatingBand {
  min: number;
  max: number;
  label: string;
}

export interface RatingScaleResponse {
  levels: RatingLevel[];
  bands: RatingBand[];
}

/** Escala de reserva enquanto GET /evaluations/rating-scale não responde. */
export const FALLBACK_RATING_LEVELS: RatingLevel[] = [
  {
    value: 1,
    label: 'Muito fraco',
    description:
      'Não demonstra a competência ou apresenta desempenho muito abaixo do esperado.',
  },
  {
    value: 2,
    label: 'Insuficiente',
    description:
      'Demonstra a competência de forma limitada e abaixo do esperado.',
  },
  {
    value: 3,
    label: 'Bom',
    description: 'Cumpre o nível de desempenho esperado.',
  },
  {
    value: 4,
    label: 'Muito bom',
    description: 'Demonstra desempenho acima do esperado com consistência.',
  },
  {
    value: 5,
    label: 'Excelente',
    description:
      'Demonstra domínio elevado e supera consistentemente as expectativas.',
  },
];

export type ImprovementPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export const IMPROVEMENT_PRIORITY_LABELS: Record<ImprovementPriority, string> =
  {
    BAIXA: 'Baixa',
    MEDIA: 'Média',
    ALTA: 'Alta',
    CRITICA: 'Crítica',
  };

export type RecommendationActionType =
  | 'FORMACAO'
  | 'MENTORIA'
  | 'ACOMPANHAMENTO'
  | 'COACHING'
  | 'PROJETO_PRATICO'
  | 'ALTERACAO_PROCESSO'
  | 'OUTRA';

export const ACTION_TYPE_LABELS: Record<RecommendationActionType, string> = {
  FORMACAO: 'Formação',
  MENTORIA: 'Mentoria',
  ACOMPANHAMENTO: 'Acompanhamento',
  COACHING: 'Coaching',
  PROJETO_PRATICO: 'Projeto prático',
  ALTERACAO_PROCESSO: 'Alteração de processo',
  OUTRA: 'Outra',
};

export const RECOMMENDATION_PRIORITY_LABELS: Record<number, string> = {
  1: 'Baixa',
  2: 'Moderada',
  3: 'Média',
  4: 'Alta',
  5: 'Crítica',
};

/** `key` é só local (React key + referência das recomendações às áreas). */
export interface StrengthDraft {
  key: string;
  competencyId?: number;
  competency: string;
  score?: number;
  description: string;
  evidence: string;
  impact: string;
  comment: string;
}

export interface ImprovementDraft {
  key: string;
  competencyId?: number;
  competency: string;
  score?: number;
  description: string;
  evidence: string;
  impact: string;
  priority?: ImprovementPriority;
  comment: string;
}

export interface RecommendationDraft {
  key: string;
  improvementKey: string;
  action: string;
  objective: string;
  actionType?: RecommendationActionType;
  responsibleId?: number;
  /** Formação real recomendada (não cria inscrição). */
  trainingId?: number;
  dueDate: string;
  successIndicator: string;
  priority?: number;
  notes: string;
}

export const newKey = () =>
  `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const emptyStrength = (): StrengthDraft => ({
  key: newKey(),
  competency: '',
  description: '',
  evidence: '',
  impact: '',
  comment: '',
});

export const emptyImprovement = (): ImprovementDraft => ({
  key: newKey(),
  competency: '',
  description: '',
  evidence: '',
  impact: '',
  comment: '',
});

export const emptyRecommendation = (): RecommendationDraft => ({
  key: newKey(),
  improvementKey: '',
  action: '',
  objective: '',
  dueDate: '',
  successIndicator: '',
  notes: '',
});
