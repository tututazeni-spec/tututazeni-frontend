// components/monitoring/types.ts

import type { BadgeProps } from '@/components/ui/Badge';

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

export const OKR_STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  ON_TRACK: 'success',
  AT_RISK: 'warning',
  OFF_TRACK: 'danger',
  COMPLETED: 'info',
};

export const EVALUATION_STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  PENDING: 'neutral',
  OPEN: 'info',
  CLOSED: 'success',
};
