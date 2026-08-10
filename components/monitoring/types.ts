// components/monitoring/types.ts

export interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string | null;
  progress: number;
  status: string;
}

export interface Objective {
  id: string;
  title: string;
  type: string;
  progress: number;
  owner?: { fullName: string } | null;
  keyResults?: KeyResult[];
}

export interface Cycle {
  id: string;
  name: string;
}

export interface MyEvaluation {
  id: string;
  type: string;
  status: string;
  finalScore: number | null;
  cycle?: { name: string; type: string } | null;
  evaluator?: { fullName: string } | null;
}

export interface ToComplete {
  id: string;
  type: string;
  status: string;
  user?: { fullName: string } | null;
  cycle?: { name: string } | null;
}

export interface Indicator {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  baseline: number | null;
  target: number | null;
  frequency: string;
  category: string | null;
  _count?: { records: number };
}

export const OKR_STATUS_COLORS: Record<string, string> = {
  ON_TRACK: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-yellow-100 text-yellow-800',
  OFF_TRACK: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export const EVALUATION_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-green-100 text-green-800',
};
