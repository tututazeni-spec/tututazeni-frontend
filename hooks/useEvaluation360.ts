// hooks/useEvaluation360.ts
// Container da página de Avaliação 360º — hoje devolve dados mock, mas já
// na forma exacta que uma query real devolveria, para que a troca para o
// backend real seja só dentro deste ficheiro (nenhum componente de
// apresentação em components/evaluation360/ precisa de mudar).
// Extraído porque a página inteira (2159 linhas) estava 100% em dados mock
// module-level, sem nenhum ponto de wiring; a apresentação foi depois
// separada em components/evaluation360/Evaluation360View.tsx + sub-
// componentes, deixando app/(platform)/evaluation360/page.tsx como container
// puro — ver memory project_innova_component_separation_audit.
//
// Quando o backend existir, substituir os `return` abaixo por
// `useApiQuery`/`useApiMutation` a estes endpoints (mantendo a mesma forma
// de retorno):
//   result        → GET /evaluation360/participants/:userId/result
//   cycle         → GET /evaluation360/cycles/current
//   cycles        → GET /evaluation360/cycles
//   competencies  → já incluído em result.competencies acima
//   nineBox       → GET /evaluation360/nine-box?cycleId=...
//   feedbacks     → GET /evaluation360/feedback/continuous?userId=...
//   formQuestions → GET /evaluation360/forms/:formId/questions

'use client';

import type {
  CompetencyScore,
  ContinuousFeedback,
  CycleInfo,
  EvaluationQuestion,
  NineBoxEntry,
  ParticipantResult,
} from '@/components/evaluation360/types';

// ─── MOCK DATA ────────────────────────────────────────────────

const MOCK_COMPETENCIES: CompetencyScore[] = [
  {
    id: '1',
    name: 'Comunicação',
    category: 'Interpessoal',
    type: 'SOFT_SKILL',
    selfScore: 4.2,
    othersScore: 3.6,
    managerScore: 3.5,
    peerScore: 3.7,
    gap: 0.6,
    benchmark: 3.8,
  },
  {
    id: '2',
    name: 'Liderança',
    category: 'Gestão',
    type: 'LEADERSHIP',
    selfScore: 3.8,
    othersScore: 4.1,
    managerScore: 4.3,
    peerScore: 3.9,
    gap: -0.3,
    benchmark: 3.5,
  },
  {
    id: '3',
    name: 'Pensamento Estratégico',
    category: 'Cognitivo',
    type: 'HARD_SKILL',
    selfScore: 4.0,
    othersScore: 3.8,
    managerScore: 4.0,
    peerScore: 3.7,
    gap: 0.2,
    benchmark: 3.6,
  },
  {
    id: '4',
    name: 'Trabalho em Equipa',
    category: 'Interpessoal',
    type: 'SOFT_SKILL',
    selfScore: 3.5,
    othersScore: 4.3,
    managerScore: 4.5,
    peerScore: 4.2,
    gap: -0.8,
    benchmark: 4.0,
  },
  {
    id: '5',
    name: 'Resiliência',
    category: 'Comportamental',
    type: 'SOFT_SKILL',
    selfScore: 4.5,
    othersScore: 4.0,
    managerScore: 4.0,
    peerScore: 3.9,
    gap: 0.5,
    benchmark: 3.7,
  },
  {
    id: '6',
    name: 'Inovação',
    category: 'Cognitivo',
    type: 'HARD_SKILL',
    selfScore: 3.2,
    othersScore: 3.4,
    managerScore: 3.3,
    peerScore: 3.5,
    gap: -0.2,
    benchmark: 3.2,
  },
  {
    id: '7',
    name: 'Foco em Resultados',
    category: 'Execução',
    type: 'HARD_SKILL',
    selfScore: 4.3,
    othersScore: 4.4,
    managerScore: 4.6,
    peerScore: 4.3,
    gap: -0.1,
    benchmark: 4.1,
  },
  {
    id: '8',
    name: 'Bem-estar e Disciplina',
    category: 'Vitalidade',
    type: 'VITALITY',
    selfScore: 3.9,
    othersScore: 4.0,
    managerScore: 4.0,
    peerScore: 4.0,
    gap: -0.1,
    benchmark: 3.5,
  },
];

const MOCK_RESULT: ParticipantResult = {
  userId: 'u1',
  fullName: 'Maria João Santos',
  position: 'Coordenadora de Projectos',
  department: 'Operações',
  overallScore: 3.95,
  weightedScore: 4.02,
  selfScore: 3.93,
  managerScore: 4.15,
  peerScore: 3.88,
  competencies: MOCK_COMPETENCIES,
  strengths: [MOCK_COMPETENCIES[6], MOCK_COMPETENCIES[3], MOCK_COMPETENCIES[1]],
  gaps: [MOCK_COMPETENCIES[5], MOCK_COMPETENCIES[0], MOCK_COMPETENCIES[4]],
  isEligiblePromotion: true,
  isEligibleBonus: true,
};

const MOCK_CYCLE: CycleInfo = {
  id: 'c1',
  name: 'Avaliação Semestral 2025 — S1',
  model: 'DEG_360',
  status: 'COMPLETED',
  startDate: '2025-01-15',
  endDate: '2025-03-31',
  participantsCount: 84,
  completedCount: 79,
};

// Antes construído inline na tab "Ciclos" (page.tsx); movido para aqui
// porque é dado do domínio, não JSX.
const MOCK_CYCLES: CycleInfo[] = [
  MOCK_CYCLE,
  {
    ...MOCK_CYCLE,
    id: 'c2',
    name: 'Avaliação Anual 2024',
    status: 'COMPLETED',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    participantsCount: 76,
    completedCount: 72,
  },
];

const MOCK_NINE_BOX: NineBoxEntry[] = [
  {
    participantId: 'u1',
    name: 'Maria João',
    performance: 'HIGH',
    potential: 'HIGH',
    score: 4.02,
  },
  {
    participantId: 'u2',
    name: 'Carlos Silva',
    performance: 'HIGH',
    potential: 'MID',
    score: 3.85,
  },
  {
    participantId: 'u3',
    name: 'Ana Pinto',
    performance: 'MID',
    potential: 'HIGH',
    score: 3.6,
  },
  {
    participantId: 'u4',
    name: 'João Ferreira',
    performance: 'MID',
    potential: 'MID',
    score: 3.4,
  },
  {
    participantId: 'u5',
    name: 'Sofia Lima',
    performance: 'LOW',
    potential: 'MID',
    score: 2.9,
  },
  {
    participantId: 'u6',
    name: 'Rui Costa',
    performance: 'HIGH',
    potential: 'LOW',
    score: 3.7,
  },
  {
    participantId: 'u7',
    name: 'Diana Martins',
    performance: 'MID',
    potential: 'LOW',
    score: 3.1,
  },
  {
    participantId: 'u8',
    name: 'Pedro Alves',
    performance: 'LOW',
    potential: 'LOW',
    score: 2.5,
  },
  {
    participantId: 'u9',
    name: 'Filipa Gomes',
    performance: 'LOW',
    potential: 'HIGH',
    score: 3.2,
  },
];

const MOCK_FEEDBACKS: ContinuousFeedback[] = [
  {
    id: 'f1',
    fromName: 'Carlos Silva',
    type: 'RECOGNITION',
    message:
      'Excelente apresentação ao cliente ontem. Demonstrou clareza e confiança nas respostas.',
    competency: 'Comunicação',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'f2',
    fromName: 'Gestora Ana Rodrigues',
    type: 'DEVELOPMENT',
    message:
      'Sugiro que te foque mais em delegar tarefas operacionais para te libertares para o estratégico.',
    competency: 'Liderança',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'f3',
    fromName: 'Sofia Lima',
    type: 'RECOGNITION',
    message:
      'Sempre disponível para apoiar a equipa. Uma referência em trabalho colaborativo!',
    competency: 'Trabalho em Equipa',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

// Antes hardcoded dentro de EvaluationFormTab (page.tsx); movido para aqui
// pela mesma razão que MOCK_CYCLES — é dado, não apresentação.
const MOCK_FORM_QUESTIONS: EvaluationQuestion[] = [
  {
    id: 'q1',
    text: 'Com que frequência demonstra iniciativa para resolver problemas sem esperar instruções?',
    type: 'FREQUENCY',
    competency: 'Proactividade',
  },
  {
    id: 'q2',
    text: 'Como avalia a capacidade de comunicação clara e assertiva deste colaborador?',
    type: 'LIKERT',
    competency: 'Comunicação',
  },
  {
    id: 'q3',
    text: 'Em que medida este colaborador colabora eficazmente com outros membros da equipa?',
    type: 'LIKERT',
    competency: 'Trabalho em Equipa',
  },
  {
    id: 'q4',
    text: 'Com que frequência entrega resultados dentro dos prazos definidos?',
    type: 'FREQUENCY',
    competency: 'Foco em Resultados',
  },
  {
    id: 'q5',
    text: 'Como avalia a capacidade de adaptação a mudanças e situações de pressão?',
    type: 'LIKERT',
    competency: 'Resiliência',
  },
];

// ─── Hook ─────────────────────────────────────────────────────

export function useEvaluation360() {
  return {
    result: MOCK_RESULT,
    cycle: MOCK_CYCLE,
    cycles: MOCK_CYCLES,
    competencies: MOCK_COMPETENCIES,
    nineBox: MOCK_NINE_BOX,
    feedbacks: MOCK_FEEDBACKS,
    formQuestions: MOCK_FORM_QUESTIONS,
    loading: false,
  };
}
