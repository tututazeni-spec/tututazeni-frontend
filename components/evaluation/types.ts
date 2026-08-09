// components/evaluation/types.ts
// Tipos do domínio "avaliação 360º/desempenho" — movidos verbatim de
// app/(platform)/evaluation/page.tsx.

export type Tab =
  'overview' | 'cycles' | 'pending' | 'results' | 'analytics' | 'calibration';

export interface MyProgress {
  completed: number;
  pending: number;
  completionRate: number;
}

export interface AnalyticsTopPerformer {
  user?: {
    fullName?: string;
    avatarUrl?: string;
    department?: { name?: string };
  };
  avgScore: number;
  percentile: number;
}

export interface AnalyticsByDepartment {
  department: string;
  avgScore: number;
}

export interface AnalyticsData {
  hasData: boolean;
  message?: string;
  kpis: {
    totalParticipants: number;
    avgScore?: number;
    participationRate: number;
    totalEvaluations: number;
  };
  distribution: Record<string, number>;
  topPerformers?: AnalyticsTopPerformer[];
  byDepartment?: AnalyticsByDepartment[];
}

export interface BiasedEvaluator {
  evaluatorId: number;
  avg: number;
  deviation: number;
}

export interface CalibrationParticipant {
  evaluated: {
    id: number;
    fullName?: string;
    avatarUrl?: string;
    position?: { name?: string };
    department?: { name?: string };
  };
  avgScore: number;
  percentile: number;
  dispersion?: number;
}

export interface CalibrationData {
  biasedEvaluators?: BiasedEvaluator[];
  globalAvg?: number;
  participants?: CalibrationParticipant[];
}

export interface Cycle {
  id: number;
  name: string;
  model: string;
  status: string;
  startDate: string;
  endDate: string;
  participation: { total: number; completed: number; rate: number };
}

export interface EvalRequest {
  id: number;
  type: string;
  status: string;
  dueDate?: string;
  evaluated: {
    id: number;
    fullName: string;
    avatarUrl?: string;
    position?: { name: string };
    department?: { name: string };
  };
  cycle?: { id: number; name: string; endDate?: string };
}

export interface EvalResults {
  evaluated: {
    id: number;
    fullName: string;
    position?: { name: string };
    department?: { name: string };
  };
  finalScore: number;
  scoreLabel: string;
  byType: Record<string, number>;
  competencies: Record<number, number>;
  concordance: {
    selfScore: number;
    othersScore: number;
    gap: number;
    label: string;
  } | null;
  totalEvaluators: number;
  qualitative: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  hasResults?: boolean;
}
