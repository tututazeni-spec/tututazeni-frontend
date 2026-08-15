// components/crm/beneficiaries/types.ts

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

export interface Interaction {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  outcome: string | null;
  satisfaction: number | null;
  user?: { fullName: string } | null;
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

export interface InteractionForm {
  type: string;
  subject: string;
  description: string;
  outcome: string;
  satisfaction: string;
}

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

export const PROVINCES = [
  'BENGO',
  'BENGUELA',
  'BIE',
  'CABINDA',
  'CUANDO_CUBANGO',
  'CUANZA_NORTE',
  'CUANZA_SUL',
  'CUNENE',
  'HUAMBO',
  'HUILA',
  'LUANDA',
  'LUNDA_NORTE',
  'LUNDA_SUL',
  'MALANJE',
  'MOXICO',
  'NAMIBE',
  'UIGE',
  'ZAIRE',
];
