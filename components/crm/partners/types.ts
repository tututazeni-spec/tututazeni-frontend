// components/crm/partners/types.ts

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

export interface Interaction {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  outcome: string | null;
  satisfaction: number | null;
  user?: { fullName: string } | null;
}

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

export const TYPES = [
  'TECHNOLOGY',
  'CONTENT',
  'TRAINING',
  'FUNDING',
  'INSTITUTIONAL',
  'COMMERCIAL',
  'MEDIA',
  'GOVERNMENT',
  'OTHER',
];

export interface InteractionForm {
  type: string;
  subject: string;
  description: string;
  outcome: string;
  satisfaction: string;
}
