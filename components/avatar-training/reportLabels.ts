// components/avatar-training/reportLabels.ts
// Tradução para português dos relatórios da aba Relatórios: o backend devolve
// os nomes das colunas (camelCase), estados (enums) e fontes em inglês técnico;
// aqui passam a texto legível. Chaves/valores desconhecidos ficam como vêm.

import {
  ASSIGNMENT_STATUS,
  ATTEMPT_STATUS,
  EXPERIENCE_LABEL,
  PROGRAM_STATUS,
} from './constants';

export const REPORT_TITLE: Record<string, string> = {
  AI_TUTOR: 'Tutor de IA',
};

const COLUMN: Record<string, string> = {
  avatarId: 'ID do avatar',
  avatar: 'Avatar',
  language: 'Idioma',
  sessions: 'Sessões',
  learners: 'Formandos',
  completed: 'Concluídas',
  avgDurationMinutes: 'Duração média (min)',
  byExperienceType: 'Por tipo de experiência',
  programId: 'ID da formação',
  program: 'Formação',
  attempts: 'Tentativas',
  byStatus: 'Por estado',
  completionRate: 'Taxa de conclusão (%)',
  evaluated: 'Avaliadas',
  avgScore: 'Nota média',
  bestScore: 'Melhor nota',
  passRate: 'Taxa de aprovação (%)',
  evolution: 'Evolução',
  session: 'Sessão',
  experienceType: 'Tipo de experiência',
  sessionId: 'ID da sessão',
  scenario: 'Cenário',
  finished: 'Terminadas',
  byCriterion: 'Por critério',
  criterion: 'Critério',
  reviews: 'Revisões',
  assessedAt: 'Avaliado em',
  attempt: 'Tentativa',
  attemptId: 'ID da tentativa',
  user: 'Utilizador',
  userId: 'ID do utilizador',
  competencyId: 'ID da competência',
  competency: 'Competência',
  score: 'Nota',
  levelBefore: 'Nível anterior',
  levelAfter: 'Nível posterior',
  applied: 'Aplicado',
  results: 'Resultados',
  levelUpdates: 'Subidas de nível',
  avgLevelGain: 'Ganho médio de nível',
  id: 'ID',
  status: 'Estado',
  dueDate: 'Prazo',
  assigned: 'Atribuídas',
  pending: 'Pendentes',
  overdue: 'Em atraso',
  assignmentId: 'ID da atribuição',
  learner: 'Formando',
  daysOverdue: 'Dias de atraso',
  departmentId: 'ID do departamento',
  department: 'Departamento',
  requests: 'Pedidos',
  noSource: 'Sem fonte',
  escalated: 'Escalados',
  unavailable: 'Indisponíveis',
  helpRequests: 'Pedidos de ajuda',
  step: 'Passo',
  stepKey: 'Passo',
  unansweredRate: 'Taxa sem resposta (%)',
  toReview: 'Para rever',
  tutorResponses: 'Respostas do tutor',
  unanswered: 'Sem resposta',
  errors: 'Erros',
  failures: 'Falhas',
  failureRate: 'Taxa de falhas (%)',
  avgLatencyMs: 'Latência média (ms)',
  tokens: 'Tokens',
  avgTokensPerRequest: 'Tokens por pedido (média)',
  estimatedCost: 'Custo estimado',
  costNote: 'Nota de custo',
  provider: 'Fornecedor',
  serviceType: 'Tipo de serviço',
  costPerUnit: 'Custo por unidade',
  monthlyCostLimit: 'Limite mensal de custo',
  monthToDate: 'Gasto no mês',
  percentOfLimit: '% do limite',
  totalEstimatedCost: 'Custo total estimado',
  sessionsWithVoice: 'Sessões com voz',
  costPerSession: 'Custo por sessão',
  costPerCompletedSession: 'Custo por sessão concluída',
  createdAt: 'Criado em',
  action: 'Acção',
  entity: 'Entidade',
  entityId: 'ID da entidade',
  errorCode: 'Código de erro',
  count: 'Total',
  lastAt: 'Última ocorrência',
  providerFailures: 'Falhas de fornecedor',
  tutorFailures: 'Falhas do tutor',
  interruptedSessions: 'Sessões interrompidas',
  auditByAction: 'Auditoria por acção',
  recentAudit: 'Auditoria recente',
  metadata: 'Detalhes',
};

const VALUE: Record<string, string> = {
  TTS: 'Voz (texto para fala)',
  STT: 'Reconhecimento de voz',
  VIDEO: 'Vídeo',
  NO_SOURCE: 'Sem fonte',
  ESCALATED: 'Escalado',
  UNAVAILABLE: 'Indisponível',
  AI_TUTOR: 'Tutor de IA',
  CREATE: 'Criar',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  APPROVE: 'Aprovar',
  ASSIGN: 'Atribuir',
  START: 'Iniciar',
  COMPLETE: 'Concluir',
  SUBMIT: 'Submeter',
  REVIEW: 'Rever',
  LINK: 'Associar',
  TEST: 'Testar',
  VALIDATE_RUBRIC: 'Validar rubrica',
  AI_TUTOR_REQUEST: 'Pedido ao tutor de IA',
  AVATAR_AI_TUTOR_CALL: 'Chamada ao tutor de IA',
  AVATAR_TRAINING_LINK: 'Ligação de formação com avatar',
  AVATAR_TRAINING_NOTIFY: 'Notificação de formação com avatar',
  AVATAR_TRAINING_REMINDERS: 'Lembretes de formação com avatar',
  AVATAR_TRAINING_RETENTION: 'Retenção de dados da formação',
  AVATAR_TTS_ERROR: 'Erro de voz',
  AVATAR_USAGE_RECORD_FAILED: 'Falha ao registar utilização',
  CERTIFICATE_ISSUED: 'Certificado emitido',
  CERTIFICATE_REQUEST: 'Pedido de certificado',
  TrainingAvatar: 'Avatar',
};

const SOURCE_TERMS: Array<[RegExp, string]> = [
  [/AvatarTrainingAttempt/g, 'tentativas'],
  [/AvatarTrainingAssignment/g, 'atribuições'],
  [/AvatarTrainingSession/g, 'sessões'],
  [/AvatarTrainingInteraction/g, 'interacções'],
  [/AvatarTrainingUsage/g, 'utilização'],
  [/AvatarTrainingProviderConfig/g, 'configuração de fornecedores'],
  [/AvatarTrainingCompetencyResult/g, 'resultados de competências'],
  [/TrainingAvatar/g, 'avatares'],
  [/UserCompetency/g, 'competências do utilizador'],
  [/User\.departmentId/g, 'departamento do utilizador'],
  [/AuditLog/g, 'registo de auditoria'],
  [/\.experienceType/g, ' (tipo de experiência)'],
  [/\.score \/ passed/g, ' (nota / aprovação)'],
  [/\.score/g, ' (nota)'],
  [/\.passed/g, ' (aprovação)'],
  [/ONBOARDING/g, 'integração'],
  [/AI-Tutor/g, 'Tutor de IA'],
];

/** Etiqueta em português do cabeçalho de uma coluna. */
export function columnLabel(key: string): string {
  return COLUMN[key] ?? key;
}

/** Fonte do relatório sem nomes técnicos de tabelas. */
export function sourceLabel(source: string): string {
  return SOURCE_TERMS.reduce((s, [re, t]) => s.replace(re, t), source);
}

/** Texto de fórmula/nota com «AI-Tutor» em português. */
export function textLabel(text: string): string {
  return text.replace(/AI-Tutor/g, 'Tutor de IA');
}

function valueLabel(v: string): string {
  return (
    EXPERIENCE_LABEL[v as keyof typeof EXPERIENCE_LABEL] ??
    ATTEMPT_STATUS[v as keyof typeof ATTEMPT_STATUS]?.label ??
    ASSIGNMENT_STATUS[v as keyof typeof ASSIGNMENT_STATUS]?.label ??
    PROGRAM_STATUS[v as keyof typeof PROGRAM_STATUS]?.label ??
    VALUE[v] ??
    v
  );
}

/** Valor de uma célula em português (estados, tipos e objectos aninhados). */
export function cellLabel(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (Array.isArray(v)) return v.map(cellLabel).join('; ');
  if (typeof v === 'object')
    return Object.entries(v as Record<string, unknown>)
      .map(([k, x]) => `${COLUMN[k] ?? valueLabel(k)}: ${cellLabel(x)}`)
      .join(', ');
  if (typeof v === 'string') return textLabel(valueLabel(v));
  return String(v);
}
