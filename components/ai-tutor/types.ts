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
  content: QuizQuestion[] | Flashcard[] | string;
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
}

export interface SessionDetail {
  messages: Message[];
}

export interface Recommendation {
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

export type View = 'chat' | 'history' | 'generate' | 'recommendations';
