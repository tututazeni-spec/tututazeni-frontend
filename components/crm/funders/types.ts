// components/crm/funders/types.ts

export interface Funder {
  id: string;
  code: string;
  name: string;
  type: string;
  country: string | null;
  status: string;
  totalCommitted: number;
  totalReceived: number;
  _count?: { grants: number; interactions: number };
}

export interface Grant {
  id: string;
  code: string;
  title: string;
  amount: number;
  disbursed: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string | null;
  _count?: { disbursements: number };
}

export interface Interaction {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  outcome: string | null;
  user?: { fullName: string } | null;
}

export interface Report {
  id: string;
  title: string;
  period: string;
  dueDate: string;
  status: string;
}

export interface FunderDetail {
  id: string;
  code: string;
  name: string;
  legalName: string | null;
  type: string;
  status: string;
  country: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  contactTitle: string | null;
  currency: string;
  totalCommitted: number;
  totalReceived: number;
  totalPending: number;
  satisfactionAvg: number;
  reportingReqs: string | null;
  notes: string | null;
  createdBy?: { fullName: string } | null;
  assignedTo?: { fullName: string; email: string } | null;
  grants: Grant[];
  interactions: Interaction[];
  reports: Report[];
}

export interface OverdueReport {
  id: string;
  title: string;
  period: string;
  dueDate: string;
  status: string;
  funder: { name: string; code: string; email: string | null } | null;
  grant: { title: string; code: string } | null;
}

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-success-subtle text-success-ink',
  INACTIVE: 'bg-surface-sunken text-ink-muted',
  PROSPECT: 'bg-info-subtle text-info-ink',
  SUSPENDED: 'bg-danger-subtle text-danger-ink',
  FORMER: 'bg-warning-subtle text-warning-ink',
};

export const REPORT_COLORS: Record<string, string> = {
  PENDING: 'bg-surface-sunken text-ink-muted',
  SUBMITTED: 'bg-info-subtle text-info-ink',
  APPROVED: 'bg-success-subtle text-success-ink',
  REJECTED: 'bg-danger-subtle text-danger-ink',
  OVERDUE: 'bg-warning-subtle text-warning-ink',
};

export const TYPE_LABELS: Record<string, string> = {
  GOVERNMENT: 'Governo',
  BILATERAL: 'Bilateral',
  MULTILATERAL: 'Multilateral',
  NGO: 'ONG',
  PRIVATE_FOUNDATION: 'Fundação Privada',
  CORPORATE: 'Empresa',
  OTHER: 'Outro',
};

export interface GrantForm {
  title: string;
  amount: string;
  startDate: string;
  endDate: string;
}

export interface InteractionForm {
  type: string;
  subject: string;
  description: string;
  outcome: string;
}

export const GRANT_STATUS_OPTIONS = [
  'ACTIVE',
  'COMPLETED',
  'SUSPENDED',
  'CANCELLED',
  'CLOSED',
] as const;

// ─── Dashboard / relatório por período ─────────────────────────────────────
// Espelham GET /crm/funders/dashboard e /report (crm-funders.service.ts) —
// endpoints já existiam no backend sem consumidor no frontend.

export interface FunderDashboard {
  totals: {
    total: number;
    newThisMonth: number;
    active: number;
    activeGrants: number;
    overdueReports: number;
    reportsThisMonth: number;
    totalCommitted: number;
    totalReceived: number;
    totalPending: number;
    executionRate: number;
  };
  distributions: {
    byType: { type: string; _count: { id: number } }[];
    byStatus: { status: string; _count: { id: number } }[];
  };
  recentDisbursements: {
    id: string;
    amount: number;
    receivedAt: string;
    grant: { title: string; code: string };
    createdBy: { fullName: string } | null;
  }[];
  recentInteractions: {
    id: string;
    subject: string;
    date: string;
    funder: { name: string; code: string };
    user: { fullName: string } | null;
  }[];
}

export interface FunderReportSummary {
  period: { start: string; end: string };
  created: number;
  byType: { type: string; _count: { id: number } }[];
  grantsCreated: number;
  totalDisbursed: number;
  reportsSubmitted: number;
}

// ─── Criar/submeter relatório para financiador ─────────────────────────────
// POST /:id/reports (metadados) e PUT reports/:id/submit (anexar ficheiro) —
// existiam no backend sem nenhum consumidor no frontend.

export interface CreateReportForm {
  title: string;
  period: string;
  dueDate: string;
  grantId: string;
}

export const EMPTY_REPORT_FORM: CreateReportForm = {
  title: '',
  period: '',
  dueDate: '',
  grantId: '',
};
