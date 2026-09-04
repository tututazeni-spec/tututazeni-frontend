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
}

// Partilhado com partners — ver components/crm/shared.tsx.
export type InteractionForm = CrmInteractionForm;

export const EMPTY_INTERACTION_FORM: InteractionForm = {
  type: 'CALL',
  subject: '',
  description: '',
  outcome: '',
  satisfaction: '',
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-success-subtle text-success-ink',
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
