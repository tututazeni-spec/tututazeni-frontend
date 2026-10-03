// components/processes/approval-types.ts
// Tipos da aba «Aprovações» (docs/Modulo_Processes.md §7).

import type {
  ApprovalMode,
  InstanceStatus,
  PersonRef,
  ProcessPriority,
  StepComment,
  StepType,
} from './types';

export type ApprovalStatus =
  | 'WAITING'
  | 'PENDING'
  | 'INFO_REQUESTED'
  | 'ESCALATED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'CANCELLED';

export type ApprovalDecision =
  | 'APPROVE'
  | 'REJECT'
  | 'RETURN'
  | 'REQUEST_INFO'
  | 'DELEGATE'
  | 'ESCALATE';

export interface ApprovalView {
  id: number;
  code: string;
  process: { id: number; code: string; title: string };
  instance: {
    id: number;
    code: string | null;
    title: string;
    priority: ProcessPriority;
    status: InstanceStatus;
  };
  step: { id: number; order: number; title: string; type: StepType };
  sourceModule: string | null;
  entity: { type: string | null; id: string | null; target: PersonRef };
  requester: PersonRef;
  approver: PersonRef | null;
  approverRole: string | null;
  level: string | null;
  escalationLevel: number;
  round: number;
  sequence: number;
  mode: ApprovalMode;
  status: ApprovalStatus;
  submittedAt: string;
  dueAt: string | null;
  isOverdue: boolean;
  requesterComment: string | null;
  documentIds: number[];
  dataVersion: string | null;
  decidedVersion: string | null;
  decision: string | null;
  justification: string | null;
  decidedAt: string | null;
  decidedById: number | null;
  nextSteps: string[];
  executorId: number | null;
  permissions: {
    canDecide: boolean;
    canDelegate: boolean;
    canEscalate: boolean;
    canRespond: boolean;
    segregated: boolean;
  };
}

export interface ApprovalKpis {
  pending: number;
  overdue: number;
  decidedToday: number;
  avgDecisionHours: number | null;
  approvalRate: number | null;
}

export interface PaginatedApprovals {
  data: ApprovalView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  scope: 'mine' | 'requested' | 'all';
  kpis: ApprovalKpis;
}

export interface ApprovalSnapshotStep {
  order: number;
  title: string;
  status: string;
  result: string | null;
  notes: string | null;
  formData: unknown;
  evidenceIds: number[];
}

export interface ApprovalDetail extends ApprovalView {
  snapshot: {
    instance: Record<string, unknown>;
    steps: ApprovalSnapshotStep[];
  } | null;
  group: Array<{
    id: number;
    code: string;
    sequence: number;
    status: ApprovalStatus;
    decision: string | null;
    decidedAt: string | null;
    approver: PersonRef | null;
  }>;
  comments: StepComment[];
  history: Array<{
    id: number;
    action: string;
    createdAt: string;
    user: PersonRef;
    meta: Record<string, unknown> | null;
  }>;
}
