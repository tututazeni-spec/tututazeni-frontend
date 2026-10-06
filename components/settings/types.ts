// components/settings/types.ts
// Tipos do módulo de definições (docs/modulo_settings.md).

export type Tab =
  | 'perfil'
  | 'visao-geral'
  | 'permissoes'
  | 'utilizadores'
  | 'seguranca';

export interface OrganizationSettings {
  id: string;
  tenantCode: string;
  tenantName: string;
  platformName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  nif: string | null;
  address: string | null;
  phone: string | null;
  contactEmail: string | null;
  website: string | null;
  sector: string | null;
  country: string | null;
  defaultTimezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
}

export interface UserPolicy {
  requiredFields: string[];
  allowedEmailDomains: string[];
  defaultRoleId: number | null;
  invitesEnabled: boolean;
  invitationExpiryDays: number;
  forcePasswordChangeOnFirstLogin: boolean;
  inactiveAfterDays: number;
  requiredFieldOptions: string[];
}

export interface UsersOverview {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  suspended: number;
  maxUsers: number;
}

export interface InactiveUser {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  department: { id: number; name: string } | null;
  role: { id: number; name: string } | null;
}

export interface InactiveUsersResult {
  thresholdDays: number;
  total: number;
  items: InactiveUser[];
}
