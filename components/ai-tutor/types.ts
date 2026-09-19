// components/ai-tutor/types.ts
// Tipos do domínio de Tutor IA: mensagens, sessões, geração de
// conteúdo e recomendações. Extraído de app/(platform)/ai-tutor/page.tsx.

export interface Message {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  latencyMs: number | null;
  rating: number | null;
  provider: string | null;
  agentAction: string | null;
  /** Rótulos da Base de Conhecimento citados nesta resposta (secção 3). */
  sourceLabels?: string[];
}

export interface Session {
  id: number;
  courseId: number | null;
  startedAt: string;
  endedAt: string | null;
  course?: { id: number; title: string } | null;
  _count?: { messages: number };
}

export interface QuizQuestion {
  question: string;
  options?: string[];
  correct: string;
  explanation?: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface GeneratedContent {
  type: string;
  content: ExerciseContent;
  raw: string;
  provider: string;
}

export interface StartSessionResponse {
  session: { id: number };
  greeting: string;
  provider?: { provider: string };
}

export interface SendMessageResponse {
  message: {
    id: number;
    content: string;
    createdAt: string;
    agentAction: string | null;
  };
  latencyMs: number | null;
  provider: string | null;
  sources?: Array<{ type: string; id: number | string; title: string; label: string }>;
}

export interface SessionDetail {
  messages: Message[];
}

export interface Recommendation {
  logId: number | null;
  courses: Array<{
    id: number;
    title: string;
    category: string;
    workloadHours: number | null;
  }>;
  competencyGaps: string[];
  aiInsight: string;
  provider: string;
}

export type View =
  | 'chat'
  | 'recommendations'
  | 'overview'
  | 'knowledge'
  | 'sessions'
  | 'exercises'
  | 'analytics'
  | 'settings';

// ─── Exercícios (secção 5) ──────────────────────────────────────────────────────

export interface TrueFalseItem {
  statement: string;
  isTrue: boolean;
  explanation?: string;
}

export interface OpenQuestionItem {
  question: string;
  modelAnswer?: string;
}

export interface PracticalCaseItem {
  scenario: string;
  question: string;
  keyPoints?: string[];
}

export interface SimulationItem {
  situation: string;
  options: Array<{ text: string; consequence: string; isBest?: boolean }>;
}

export interface ScenarioItem {
  context: string;
  challenge: string;
  reflectionQuestion?: string;
}

export type ExerciseContent =
  | QuizQuestion[]
  | TrueFalseItem[]
  | OpenQuestionItem[]
  | PracticalCaseItem[]
  | SimulationItem[]
  | ScenarioItem[]
  | Flashcard[]
  | string;

export interface ExerciseFeedbackResponse {
  feedback: string;
  provider: string;
}

// ─── Base de Conhecimento (secção 3) ────────────────────────────────────────────

export interface KnowledgeSource {
  type: 'COURSE' | 'LESSON' | 'LIBRARY' | 'DOCUMENT';
  id: number | string;
  title: string;
  snippet: string;
  label: string;
}

export interface KnowledgeSources {
  courses: number;
  lessons: number;
  libraryItems: number;
  documents: number;
  documentsByCategory: Array<{ category: string; count: number }>;
  total: number;
  authorizedDocCategories: readonly string[];
}

// ─── Visão Geral (secção 1) ──────────────────────────────────────────────────────

export interface AiTutorOverview {
  conversasHoje: number;
  utilizadoresAtivos?: number;
  sessoesAprendizagem: number;
  perguntasRespondidas: number;
  cursosApoiados?: number;
  taxaConclusao: number;
  horasAprendizagem: number;
  perguntasFrequentes?: Array<{ question: string; count: number }>;
  cursosMaisUtilizados?: Array<{ title: string; count: number }>;
  temasMaisProcurados?: Array<{ theme: string; count: number }>;
  utilizadoresMaisAtivos?: Array<{ userId: number; fullName: string; count: number }>;
}

// ─── Sessões (secção 4) ──────────────────────────────────────────────────────────

export interface AdminSessionRow {
  id: number;
  user: { id: number; fullName: string } | null;
  course: { id: number; title: string } | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  questions: number;
  contentsConsulted: number;
  avgRating: number | null;
}

// ─── Histórico (secção 6) ────────────────────────────────────────────────────────

export interface ActivityFeed {
  questions: Array<{ id: number; content: string; createdAt: string; sessionId: number }>;
  exercises: Array<{
    id: number;
    type: string;
    topic: string | null;
    courseId: number | null;
    count: number | null;
    createdAt: string;
  }>;
  recommendations: Array<{
    id: number;
    createdAt: string;
    courseIds: number[];
    accepted: boolean;
  }>;
  sourcesConsulted: Array<{ title: string; type: string; consultedAt: string }>;
}

// ─── Analytics (secção 7) ────────────────────────────────────────────────────────

export interface AiTutorAnalytics {
  utilizadoresDoAiTutor: number;
  taxaDeUtilizacao: number;
  sessoesPorColaborador: number;
  tempoMedioMinutos: number;
  exerciciosRealizados: number;
  recomendacoesAceites: number;
  perguntasPorCurso: Array<{ title: string; count: number }>;
  perguntasSemResposta: Array<{ question: string; count: number }>;
}

// ─── Configurações (secção 8) ────────────────────────────────────────────────────

export interface AiTutorSettingsData {
  allowOutsideKnowledge: boolean;
  sourceOnlyMode: boolean;
  showSources: boolean;
  temperature: number;
  defaultLanguage: string;
  dailyMessageLimit: number | null;
  historyRetentionDays: number | null;
  customSystemPromptAddendum: string | null;
}
