// components/crm/partners/types.ts

import type { CrmInteraction, CrmInteractionForm } from '../shared';

export interface Partner {
  id: string;
  code: string;
  name: string;
  type: string;
  tier: string;
  status: string;
  annualValue: number | null;
  assignedTo?: { fullName: string } | null;
  _count: { interactions: number; milestones: number };
}

// Partilhado com beneficiaries — ver components/crm/shared.tsx.
export type Interaction = CrmInteraction;

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  completedAt: string | null;
  status: string;
  value: number | null;
  currency: string;
  priority: string;
  createdBy?: { fullName: string } | null;
}

export interface PartnerDetail {
  id: string;
  code: string;
  name: string;
  legalName: string | null;
  type: string;
  tier: string;
  status: string;
  contactName: string | null;
  contactTitle: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  nif: string | null;
  city: string | null;
  province: string | null;
  annualValue: number | null;
  currency: string;
  revenueSharing: number | null;
  satisfactionAvg: number;
  contractStart: string | null;
  contractEnd: string | null;
  contractUrl: string | null;
  nextReviewAt: string | null;
  notes: string | null;
  createdBy?: { fullName: string } | null;
  assignedTo?: { fullName: string; email: string } | null;
  interactions: Interaction[];
  milestones: Milestone[];
}

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-success-subtle text-success-ink',
  INACTIVE: 'bg-surface-sunken text-ink-muted',
  NEGOTIATION: 'bg-info-subtle text-info-ink',
  SUSPENDED: 'bg-danger-subtle text-danger-ink',
  FORMER: 'bg-warning-subtle text-warning-ink',
};

export const TIER_COLORS: Record<string, string> = {
  PLATINUM: 'bg-accent-subtle text-accent',
  GOLD: 'bg-warning-subtle text-warning-ink',
  SILVER: 'bg-surface-sunken text-ink-muted',
  STANDARD: 'bg-info-subtle text-info-ink',
};

export const MILESTONE_COLORS: Record<string, string> = {
  PENDING: 'bg-surface-sunken text-ink-muted',
  IN_PROGRESS: 'bg-info-subtle text-info-ink',
  COMPLETED: 'bg-success-subtle text-success-ink',
  CANCELLED: 'bg-danger-subtle text-danger-ink',
  OVERDUE: 'bg-warning-subtle text-warning-ink',
};

// Lista partilhada — ver lib/provinces.ts (antes duplicada aqui e em
// components/crm/beneficiaries/types.ts).
export { ANGOLA_PROVINCES as PROVINCES } from '@/lib/provinces';

export const TYPE_LABELS: Record<string, string> = {
  TECHNOLOGY: 'Tecnologia',
  CONTENT: 'Conteúdo',
  TRAINING: 'Formação',
  FUNDING: 'Financiamento',
  INSTITUTIONAL: 'Institucional',
  COMMERCIAL: 'Comercial',
  MEDIA: 'Comunicação Social',
  GOVERNMENT: 'Governo',
  OTHER: 'Outro',
};

// Partilhado com beneficiaries — ver components/crm/shared.tsx.
export type InteractionForm = CrmInteractionForm;

// ─── Dashboard / expiring-contracts / overdue-milestones / relatório ───────
// Espelham GET /crm/partners/dashboard, /expiring-contracts,
// /overdue-milestones e /report (crm-partners.service.ts) — endpoints já
// existiam no backend sem consumidor no frontend.

export interface PartnerDashboard {
  totals: {
    total: number;
    newThisMonth: number;
    active: number;
    totalValueAOA: number;
    expiringContracts: number;
    overdueMilestones: number;
  };
  satisfaction: number;
  distributions: {
    byType: { type: string; _count: { id: number } }[];
    byTier: { tier: string; _count: { id: number } }[];
    byStatus: { status: string; _count: { id: number } }[];
  };
  recentInteractions: {
    id: string;
    type: string;
    subject: string;
    date: string;
    partner: { name: string; code: string };
    user: { fullName: string } | null;
  }[];
}

export interface ExpiringContract {
  id: string;
  code: string;
  name: string;
  contractEnd: string;
  contractUrl: string | null;
  annualValue: number | null;
  currency: string;
  assignedTo: { fullName: string; email: string } | null;
}

export interface OverdueMilestone {
  id: string;
  partnerId: string;
  title: string;
  dueDate: string;
  status: string;
  partner: { name: string; code: string };
  createdBy: { fullName: string } | null;
}

export interface PartnerReport {
  period: { start: string; end: string };
  created: number;
  byType: { type: string; _count: { id: number } }[];
  byTier: { tier: string; _count: { id: number } }[];
  totalValue: number;
  interactions: number;
  milestonesCompleted: number;
}

export interface MilestoneForm {
  title: string;
  description: string;
  dueDate: string;
  value: string;
  currency: string;
  priority: string;
}

export const EMPTY_MILESTONE_FORM: MilestoneForm = {
  title: '',
  description: '',
  dueDate: '',
  value: '',
  currency: 'AOA',
  priority: 'MEDIUM',
};
