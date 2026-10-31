// components/evaluation/formalEvaluationTypes.ts
// Tipos do domínio "avaliações formais" — Assessment (type=EXAM) do backend
// src/assessments, exposto dentro do módulo evaluation. Não confundir com
// components/evaluation/types.ts (ciclos 360°, backend src/evaluation).

export type FormalQuestionType =
  'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTI' | 'OPEN_TEXT';

export type FormalEvaluationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface FormalEvaluation {
  id: number;
  title: string;
  description: string | null;
  /** Imagem do cartão (data URL ou URL), opcional. */
  imageUrl?: string | null;
  status: FormalEvaluationStatus;
  courseId: number | null;
  passingScore: number;
  maxGrade: number;
  targetDepartmentIds: number[];
  availableFrom: string | null;
  availableUntil: string | null;
  createdAt: string;
  _count: { questions: number; attempts: number };
  /** Só em /assessments/available: a tentativa já submetida pelo próprio utilizador. */
  myAttempt?: MyAttempt | null;
}

export interface MyAttempt {
  id: number;
  status: string;
  score: number | null;
  passed: boolean | null;
  needsManualReview: boolean;
  submittedAt: string | null;
  displayGrade: number | null;
  qualitativeLabel: string | null;
}

/** Avaliação em rascunho com as perguntas e respostas correctas (GET /assessments/:id/edit). */
export interface FormalEvaluationDetail extends FormalEvaluation {
  questions: {
    id: number;
    type: FormalQuestionType;
    questionText: string;
    weight: number;
    seq: number;
    /** JSON: `[{ text, isCorrect }]`; nulo nas respostas abertas. */
    options: string | null;
  }[];
}

export interface RosterRow {
  attemptId: number;
  userId: number;
  fullName: string;
  department: string | null;
  score: number | null;
  displayGrade: number | null;
  qualitativeLabel: string | null;
  passed: boolean | null;
  status: string;
  submittedAt: string | null;
}

export interface ResultsRoster {
  assessment: {
    id: number;
    title: string;
    maxGrade: number;
    passingScore: number;
  };
  roster: RosterRow[];
}

export interface AttemptReviewAnswer {
  id: number;
  isCorrect: boolean | null;
  textAnswer?: string | null;
  reviewComment?: string | null;
  question?: { questionText: string };
}

export interface AttemptReview {
  id: number;
  score: number | null;
  status: string;
  qualitativeLabel: string | null;
  displayGrade: number | null;
  user?: { id: number; fullName: string };
  assessment: { title: string; maxGrade: number; passingScore: number };
  answers: AttemptReviewAnswer[];
}

export interface DraftOption {
  text: string;
  isCorrect: boolean;
}

export interface DraftQuestion {
  type: FormalQuestionType;
  questionText: string;
  weight: number;
  options: DraftOption[];
}
