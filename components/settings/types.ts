// components/settings/types.ts
// Tipos do módulo de definições (docs/modulo_settings.md).

export type Tab =
  | 'perfil'
  | 'visao-geral'
  | 'permissoes'
  | 'utilizadores'
  | 'seguranca'
  | 'notificacoes'
  | 'integracoes';

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

export interface DepartmentScopes {
  departments: { id: number; name: string }[];
  roles: { id: number; name: string; departmentIds: number[] }[];
}

// ─── §4 Segurança ──────────────────────────────────────────────────────────

export type TwoFactorMode = 'OPTIONAL' | 'REQUIRED_PRIVILEGED' | 'REQUIRED_ALL';

export interface SecurityPolicy {
  passwordMinLength: number;
  passwordRequireSymbol: boolean;
  passwordExpiryDays: number;
  maxFailedAttempts: number;
  lockoutMinutes: number;
  sessionIdleMinutes: number;
  accessTokenMinutes: number;
  refreshTokenDays: number;
  twoFactorMode: TwoFactorMode;
}

export interface LockedUser {
  id: number;
  fullName: string;
  email: string;
  lockedUntil: string | null;
}

export interface SessionRow {
  id: number;
  userId: number;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  user?: { fullName: string; email: string };
}

export interface LoginHistoryRow {
  id: number;
  userId: number | null;
  action: string;
  status: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  reason?: string;
  user?: { fullName: string; email: string } | null;
}

export interface LoginHistoryPage {
  data: LoginHistoryRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface TwoFactorStatus {
  enabled: boolean;
  mode: TwoFactorMode;
}

// ─── §5 Notificações ───────────────────────────────────────────────────────

export interface NotificationSettings {
  channels: { inApp: boolean; email: boolean; whatsapp: boolean };
  events: Record<string, boolean>;
  sendWindow: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    weekdaysOnly: boolean;
  };
  criticalBypassWindow: boolean;
  timeZone: string;
  eventKeys: string[];
  activeTemplates: number;
}

// ─── §6 Integrações ────────────────────────────────────────────────────────

export interface IntegrationSettings {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    from: string;
    hasPassword: boolean;
  };
  whatsapp: {
    enabled: boolean;
    number: string;
    accountSid: string;
    hourlyLimit: number;
    dailyLimit: number;
    hasAuthToken: boolean;
  };
  isis: {
    enabled: boolean;
    enabledModules: string[];
    dailyLimitPerUser: number;
  };
  isisModuleOptions: string[];
}

export interface IntegrationsOverview {
  smtp: { configured: boolean; source: 'settings' | 'env' };
  whatsapp: { enabled: boolean };
  isis: { enabled: boolean; modules: string[] };
  integrationsByStatus: Record<string, number>;
  activeApiKeys: number;
  activeWebhooks: number;
}

export interface WhatsAppStatus {
  enabled: boolean;
  connected: boolean;
  providerStatus?: string;
  error?: string;
  usage: {
    lastHour: number;
    lastDay: number;
    hourlyLimit: number;
    dailyLimit: number;
  };
}
