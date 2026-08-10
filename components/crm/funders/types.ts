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
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  PROSPECT: 'bg-blue-100 text-blue-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  FORMER: 'bg-orange-100 text-orange-700',
};

export const REPORT_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  OVERDUE: 'bg-orange-100 text-orange-800',
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
