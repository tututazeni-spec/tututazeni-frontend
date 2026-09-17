// components/monitoring/types.ts

import type { BadgeProps } from '@/components/ui/Badge';

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

export const EVALUATION_STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  PENDING: 'neutral',
  OPEN: 'info',
  CLOSED: 'success',
};
