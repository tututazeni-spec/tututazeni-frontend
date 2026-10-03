// components/crm/beneficiaries/types.ts

import type { CrmInteraction, CrmInteractionForm } from '../shared';

export interface Beneficiary {
  id: string;
  code: string;
  fullName: string;
  type: string;
  status: string;
  province: string | null;
  email: string | null;
  phone: string | null;
  nextFollowUpAt: string | null;
  assignedTo?: { fullName: string } | null;
  _count: { interactions: number };
}

export interface BeneficiaryList {
  data: Beneficiary[];
  total: number;
  totalPages: number;
}

// Base partilhada com partners — ver components/crm/shared.tsx.
export interface Interaction extends CrmInteraction {
  /** Marcador local enquanto a API não confirma (optimistic UI). */
  _optimistic?: boolean;
}

export interface BeneficiaryDocument {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  isVerified: boolean;
  createdAt: string;
  documentNumber?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  validationStatus?: string;
  validatedAt?: string | null;
  validatedBy?: { fullName: string } | null;
  notes?: string | null;
}

export interface BeneficiaryBenefit {
  id: string;
  kind: string;
  name: string;
  amount: number | null;
  currency: string;
  awardedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  notes: string | null;
}

export interface BeneficiaryParticipation {
  id: string;
  program: string;
  project: string | null;
  province: string | null;
  municipality: string | null;
  locality: string | null;
  cohort: string | null;
  programEdition: string | null;
  enrolledAt: string | null;
  startDate: string | null;
  completedAt: string | null;
  status: string;
  attendanceRate: number | null;
  performance: string | null;
  certification: string | null;
  employability: string | null;
  referral: string | null;
  finalResult: string | null;
  impact: string | null;
}

export interface BeneficiaryHistoryEntry {
  id: number;
  action: string;
  entity: string;
  metadata: string | null;
  createdAt: string;
  user: { fullName: string } | null;
}

export interface Need {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
}

export interface BeneficiaryDetail {
  id: string;
  code: string;
  fullName: string;
  type: string;
  status: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  nif: string | null;
  satisfactionAvg: number;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  createdBy?: { fullName: string } | null;
  assignedTo?: { fullName: string; email: string } | null;
  interactions: Interaction[];
  documents: BeneficiaryDocument[];
  needs: Need[];
  benefits: BeneficiaryBenefit[];
  participations: BeneficiaryParticipation[];
  totalBenefits: number;
  currency: string;
  isEligible: boolean | null;
  consentDataProcessing: boolean;
  consentCommunications: boolean;
  consentDataSharing: boolean;
  authorizedChannels: string[];
  consentStatus: string;
  consentAt: string | null;
  consentRevokedAt: string | null;
  communicationPreferences: string | null;
  accountManager?: { fullName: string; email: string } | null;
  updatedBy?: { fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  // Restantes campos de perfil (formConfig.ts) — lidos por chave.
  [key: string]: unknown;
}

// Partilhado com partners — ver components/crm/shared.tsx.
export interface InteractionForm extends CrmInteractionForm {
  channel: string;
  nextAction: string;
  nextActionDate: string;
  notes: string;
}

export const EMPTY_INTERACTION_FORM: InteractionForm = {
  type: 'CALL',
  subject: '',
  description: '',
  outcome: '',
  satisfaction: '',
  channel: '',
  nextAction: '',
  nextActionDate: '',
  notes: '',
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-success-subtle text-success-ink',
  BENEFIT_ACTIVE: 'bg-success-subtle text-success-ink',
  ELIGIBLE: 'bg-success-subtle text-success-ink',
  UNDER_FOLLOW_UP: 'bg-info-subtle text-info-ink',
  SUSPENDED: 'bg-warning-subtle text-warning-ink',
  NOT_ELIGIBLE: 'bg-danger-subtle text-danger-ink',
  BENEFIT_ENDED: 'bg-surface-sunken text-ink-muted',
  ARCHIVED: 'bg-surface-sunken text-ink-muted',
  INACTIVE: 'bg-surface-sunken text-ink-muted',
  PROSPECT: 'bg-info-subtle text-info-ink',
  FORMER: 'bg-warning-subtle text-warning-ink',
  BLOCKED: 'bg-danger-subtle text-danger-ink',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-surface-sunken text-ink-muted',
  MEDIUM: 'bg-info-subtle text-info-ink',
  HIGH: 'bg-warning-subtle text-warning-ink',
  URGENT: 'bg-danger-subtle text-danger-ink',
};

// Lista partilhada — ver lib/provinces.ts (antes duplicada aqui e em
// components/crm/partners/types.ts).
export { ANGOLA_PROVINCES as PROVINCES } from '@/lib/provinces';

// ─── Dashboard / follow-ups / relatório ─────────────────────────────────────

export interface BeneficiaryDashboard {
  totals: {
    total: number;
    newThisMonth: number;
    active: number;
    pendingFollowUps: number;
    openNeeds: number;
  };
  satisfaction: number;
  distributions: {
    byType: { type: string; _count: { id: number } }[];
    byStatus: { status: string; _count: { id: number } }[];
    byProvince: { province: string; _count: { id: number } }[];
  };
  recentInteractions: {
    id: string;
    type: string;
    subject: string;
    date: string;
    beneficiary: { fullName: string; code: string };
    user: { fullName: string } | null;
  }[];
}

export interface FollowUp {
  id: string;
  code: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  nextFollowUpAt: string;
  assignedTo: { fullName: string } | null;
  _count: { interactions: number };
}

export interface BeneficiaryReport {
  period: { start: string; end: string };
  created: number;
  interactions: number;
  byType: { type: string; _count: { id: number } }[];
  byProvince: { province: string; _count: { id: number } }[];
}

export interface NeedForm {
  category: string;
  description: string;
  priority: string;
}

export const EMPTY_NEED_FORM: NeedForm = {
  category: '',
  description: '',
  priority: 'MEDIUM',
};
