// components/assessments/types.ts
// Tipos do domínio "avaliações" (quiz/exame/diagnóstico) — movidos
// verbatim de app/(platform)/assessments/page.tsx.

export type QType =
  | 'MULTIPLE_CHOICE_SINGLE'
  | 'MULTIPLE_CHOICE_MULTI'
  | 'TRUE_FALSE'
  | 'OPEN_TEXT'
  | 'FILE_UPLOAD'
  | 'ORDERING';

export type AStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type AttemptStatus =
  'IN_PROGRESS' | 'SUBMITTED' | 'PASSED' | 'FAILED' | 'EXPIRED';

export interface QOption {
  text: string;
  isCorrect?: boolean;
  feedback?: string;
}

export interface Question {
  id: number;
  type: QType;
  questionText: string;
  mediaUrl: string | null;
  options: QOption[] | null; // parsed from JSON
  weight: number;
  difficulty: number;
  seq: number;
}

export interface Assessment {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: AStatus;
  passingScore: number;
  maxAttempts: number;
  cooldownHours: number;
  timeLimitMinutes: number;
  feedbackMode: string;
  randomizeQuestions: boolean;
  allowReview: boolean;
  createdAt: string;
  questions: Question[];
  _count: { questions: number; attempts: number };
}

export interface AttemptAnswer {
  questionId: number;
  selectedIndices?: number[];
  textAnswer?: string;
  fileUrl?: string;
}

export interface AttemptResult {
  attempt: {
    id: number;
    status: AttemptStatus;
    score: number;
    passed: boolean | null;
  };
  score: number;
  passed: boolean | null;
  totalQuestions: number;
  correctAnswers: number;
  needsManualReview: boolean;
  results?: Array<{
    questionId: number;
    questionText: string;
    isCorrect: boolean | null;
    earnedPoints: number;
    correctAnswer?: string;
    explanation?: string;
    options?: QOption[];
  }>;
}

export type View = 'list' | 'player' | 'result' | 'review';

export interface Attempt {
  id: number;
  savedAnswers?: string;
}

// A API devolve as perguntas com `options` ainda como JSON bruto (string ou
// já array, conforme a origem) — só depois de parseOptions() é que passam a
// respeitar o formato QOption[] | null usado no resto do módulo.
export interface RawQuestion extends Omit<Question, 'options'> {
  options: string | QOption[] | null;
}
export interface RawAssessment extends Omit<Assessment, 'questions'> {
  questions: RawQuestion[];
}

export interface MyAttemptSummary {
  id: number;
  assessmentId: number;
  status: AttemptStatus;
  score: number | null;
  startedAt: string;
  assessment?: { title: string; passingScore: number };
}

export interface AttemptAnswerDetail {
  id: number;
  isCorrect: boolean | null;
  textAnswer?: string;
  reviewComment?: string;
  question?: { questionText: string };
}

export interface AttemptDetail {
  assessment?: { title: string };
  score: number | null;
  status: AttemptStatus;
  timeSpentMinutes?: number;
  answers?: AttemptAnswerDetail[];
}
