// components/processes/types.ts
// Tipos do domínio "processos" (BPM/SOP) — movidos verbatim de
// app/(platform)/processes/page.tsx.

export type ProcessStatus = 'DRAFT' | 'IN_REVIEW' | 'ACTIVE' | 'ARCHIVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type StepType =
  'START' | 'END' | 'TASK' | 'DECISION' | 'GATEWAY' | 'REVIEW';
export type InstanceStatus =
  'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
export type TaskStatus =
  'WAITING' | 'PENDING' | 'COMPLETED' | 'REJECTED' | 'ESCALATED' | 'SKIPPED';

export interface ProcessStep {
  id: number;
  type: StepType;
  title: string;
  description: string | null;
  order: number;
  responsibleRole: string | null;
  slaHours: number | null;
  estimatedMinutes: number | null;
  requiresUpload: boolean;
  checklist: string[];
  responsible: { id: number; fullName: string } | null;
}

export interface Process {
  id: number;
  code: string;
  title: string;
  description: string | null;
  objective: string | null;
  scope: string | null;
  version: string;
  status: ProcessStatus;
  riskLevel: RiskLevel;
  category: string | null;
  tags: string[];
  defaultSlaHours: number | null;
  estimatedMinutes: number | null;
  nextReviewDate: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: number; fullName: string };
  department: { id: number; name: string } | null;
  steps: ProcessStep[];
  _count: { instances: number };
}

export interface StepProgress {
  id: number;
  stepId: number;
  stepOrder: number;
  status: TaskStatus;
  notes: string | null;
  completedAt: string | null;
  slaDeadline: string | null;
  duration: number | null;
  step: ProcessStep;
  completedBy: { id: number; fullName: string } | null;
}

export interface ProcessInstance {
  id: number;
  processId: number;
  processVersion: string;
  status: InstanceStatus;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
  slaDeadline: string | null;
  process: { id: number; title: string; code: string; riskLevel: RiskLevel };
  initiatedBy: { id: number; fullName: string };
  targetUser: { id: number; fullName: string };
  stepProgress: StepProgress[];
  _count?: { stepProgress: number };
}

export interface MyTask extends StepProgress {
  instance: {
    id: number;
    process: { code: string; title: string };
    targetUser: { fullName: string };
  };
}

export interface PaginatedProcesses {
  data: Process[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Dashboard {
  processes: { active: number; draft: number; inReview: number };
  instances: { inProgress: number; completed: number };
  compliance: { overdueSteps: number; slaComplianceRate: number | null };
  recentInstances: ProcessInstance[];
}
