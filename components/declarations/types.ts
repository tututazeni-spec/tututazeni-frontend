// components/declarations/types.ts
// Tipos do domínio "declarações" (documentos formais + formulários de
// vínculo laboral) — movidos verbatim de
// app/(platform)/declarations/page.tsx.

export type DocStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'GENERATED'
  | 'ISSUED'
  | 'EXPIRED';

export type WorkStatus =
  'DRAFT' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type WorkDeclType =
  | 'ONBOARDING'
  | 'PERIODIC'
  | 'EVENT'
  | 'RESIGNATION'
  | 'DIVERSITY'
  | 'COMPLIANCE'
  | 'GENERAL';

export interface Template {
  id: number;
  name: string;
  language: string;
  version: number;
  requiresApproval: boolean;
  active: boolean;
  purpose?: { id: number; name: string; category: string };
  variables?: string[];
}

export interface Purpose {
  id: number;
  name: string;
  category: string;
  requiresApproval: boolean;
}

export interface DocRequest {
  id: number;
  userId: number;
  status: DocStatus;
  createdAt: string;
  addressedTo?: string;
  observations?: string;
  referenceNumber?: string;
  verificationCode?: string;
  generatedAt?: string;
  issuedAt?: string;
  expiresAt?: string;
  template?: { id: number; name: string; language: string };
  purpose?: { id: number; name: string };
  user?: {
    id: number;
    name: string;
    email: string;
    employee?: { department: string };
  };
}

export interface WorkForm {
  id: number;
  title: string;
  type: WorkDeclType;
  mandatory: boolean;
  periodicity?: string;
  description?: string;
  active: boolean;
  questions?: Array<{
    id: number;
    key: string;
    label: string;
    fieldType: string;
    required: boolean;
    options: string[];
    conditionalKey?: string;
    conditionalValue?: string;
    order: number;
  }>;
  _count?: { submissions: number };
}

export interface WorkSubmission {
  id: number;
  userId: number;
  status: WorkStatus;
  submittedAt?: string;
  form?: { id: number; title: string; type: WorkDeclType };
  user?: { id: number; name: string; employee?: { department: string } };
  answers?: Array<{
    questionKey: string;
    value: string;
    question?: { label: string };
  }>;
}

export interface DashboardData {
  kpis: { pending: number; generated: number; issued: number; total: number };
}

export interface WorkDashboard {
  kpis: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    completionRate: number;
  };
}
