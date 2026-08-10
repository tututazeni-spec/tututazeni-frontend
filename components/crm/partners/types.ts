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
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  NEGOTIATION: 'bg-blue-100 text-blue-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  FORMER: 'bg-orange-100 text-orange-700',
};

export const TIER_COLORS: Record<string, string> = {
  PLATINUM: 'bg-purple-100 text-purple-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  SILVER: 'bg-gray-100 text-gray-700',
  STANDARD: 'bg-blue-50 text-blue-700',
};

export const MILESTONE_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
  OVERDUE: 'bg-orange-100 text-orange-800',
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
