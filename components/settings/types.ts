// components/settings/types.ts
// Tipos do módulo de definições (docs/modulo_settings.md).

export type Tab =
  | 'perfil'
  | 'visao-geral'
  | 'permissoes'
  | 'utilizadores'
  | 'seguranca'
  | 'notificacoes'
  | 'integracoes'
  | 'certificados'
  | 'privacidade'
  | 'licenca'
  | 'auditoria'
  | 'autenticacao'
  | 'email'
  | 'whatsapp'
  | 'backups'
  | 'sistema';

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

// ─── §7 Certificados ───────────────────────────────────────────────────────

export interface CertificateSettings {
  academyLogoUrl: string | null;
  signatureUrl: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  defaultText: string | null;
  numberingPrefix: string;
  numberingNextSeq: number;
  numberingPadding: number;
  verificationCodeLength: number;
  nextNumberPreview: string;
}

export type CertificateTemplateType =
  | 'COURSE'
  | 'PROGRAM'
  | 'COMPETENCY'
  | 'ATTENDANCE'
  | 'PARTICIPATION'
  | 'ACHIEVEMENT';

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  type: CertificateTemplateType;
  html: string;
  cssStyle: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  isDefault: boolean;
  isActive: boolean;
  validityDays: number | null;
  createdAt: string;
}

// ─── §8 Privacidade (LPDP) ─────────────────────────────────────────────────

export interface ConsentTextVersion {
  version: number;
  text: string;
  publishedAt: string;
}

export interface PrivacySettings {
  dpoName: string;
  dpoEmail: string;
  dpoPhone: string;
  retentionDays: number;
  anonymizationEnabled: boolean;
  exportEnabled: boolean;
  autoDeleteOnRequest: boolean;
  consentVersions: ConsentTextVersion[];
  currentConsentVersion: ConsentTextVersion | null;
  openRequests: number;
}

export type DsrType = 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY' | 'OBJECTION';
export type DsrStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface DataSubjectRequest {
  id: number;
  requesterName: string;
  requesterEmail: string;
  type: DsrType;
  status: DsrStatus;
  details: string | null;
  resolutionNote: string | null;
  userId: number | null;
  requestedAt: string;
  resolvedAt: string | null;
}

export interface DataSubjectRequestsPage {
  items: DataSubjectRequest[];
  total: number;
  page: number;
  limit: number;
}

// ─── §9 Licença e Módulos ──────────────────────────────────────────────────

export interface LicenseSettings {
  plan: string;
  isActive: boolean;
  maxUsers: number;
  currentUsers: number;
  trialEndsAt: string | null;
  trialStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  contractStartDate: string | null;
  contractEndDate: string | null;
  modules: Record<string, boolean>;
  moduleOptions: string[];
}

// ─── §10 Auditoria e Dados ──────────────────────────────────────────────────

export interface AuditDataOverview {
  health: 'OK' | 'WARNING' | 'DISABLED';
  serviceEnabled: boolean;
  lastEventAt: string | null;
  events24h: number;
  failedOperations24h: number;
  deniedOperations24h: number;
  totalEvents7d: number | null;
  backup: { destination: string | null; frequency: string | null; configured: boolean };
  exports: {
    byStatus: Array<{ status: string; count: number }>;
    expiredPendingPurge: number;
  };
  policy: {
    coveredModules: string[];
    requiredEvents: string[];
    viewRoles: string[];
    exportRoles: string[];
    retentionDays: Record<string, number>;
    archivePolicy: string;
    maskSensitive: boolean;
    updatedAt: string | null;
  };
  links: { logs: string; exports: string; policy: string };
}

// ─── §11 Autenticação / SSO ─────────────────────────────────────────────────

export type OidcProviderKey = 'GOOGLE' | 'MICROSOFT' | 'OIDC';

export interface AuthSettings {
  ssoEnabled: boolean;
  ssoProvider: OidcProviderKey | null;
  oidc: { clientId: string; tenantId: string; issuer: string; hasClientSecret: boolean };
  ldap: {
    enabled: boolean;
    url: string;
    bindDn: string;
    baseDn: string;
    userFilter: string;
    emailAttribute: string;
    nameAttribute: string;
    startTls: boolean;
    hasBindPassword: boolean;
  };
  enforceSsoOnly: boolean;
  oidcProviderOptions: readonly OidcProviderKey[];
}

export interface AuthTestResult {
  ok: boolean;
  error?: string;
  issuer?: string;
  authorizationEndpoint?: string;
}

// ─── §12 Email ───────────────────────────────────────────────────────────────

export type EmailTemplateKey = 'PASSWORD_RESET' | 'USER_INVITE';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailSettingsView {
  smtp: IntegrationSettings['smtp'];
  signature: string;
  templates: Record<EmailTemplateKey, EmailTemplate>;
  templateKeys: readonly EmailTemplateKey[];
  placeholders: Record<EmailTemplateKey, readonly string[]>;
}

export interface EmailTestResult {
  ok: boolean;
  to?: string;
  subject?: string;
  preview?: string;
  error?: string;
}

// ─── §13 WhatsApp ────────────────────────────────────────────────────────────

export type WhatsAppProvider = 'TWILIO' | 'META';
export type WhatsAppEventKey = 'NOTIFICATION' | 'AUTOMATION' | 'CORPORATE_EVENT';

export interface WhatsAppTemplateMapping {
  name: string;
  language: string;
}

export interface WhatsAppSettingsView {
  enabled: boolean;
  provider: WhatsAppProvider;
  number: string;
  accountSid: string;
  hasAuthToken: boolean;
  hourlyLimit: number;
  dailyLimit: number;
  meta: {
    phoneNumberId: string;
    businessAccountId: string;
    apiVersion: string;
    hasAccessToken: boolean;
  };
  authorizedEvents: WhatsAppEventKey[];
  templates: Record<WhatsAppEventKey, WhatsAppTemplateMapping>;
  eventOptions: readonly WhatsAppEventKey[];
  status: {
    enabled: boolean;
    connected: boolean;
    error?: string;
    providerStatus?: string;
    displayPhoneNumber?: string;
    verifiedName?: string;
    qualityRating?: string;
    usage: { lastHour: number; lastDay: number; hourlyLimit: number; dailyLimit: number };
  };
}

export interface WhatsAppMetaTemplate {
  name: string;
  language: string;
  status: string;
  category: string;
}

// ─── §14 Backups ─────────────────────────────────────────────────────────────

export type BackupFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface BackupSettingsForm {
  enabled: boolean;
  frequency: BackupFrequency;
  hour: number;
  day: number;
  destinationDir: string;
  retentionDays: number;
  minCopies: number;
}

export interface BackupRunRow {
  id: number;
  trigger: 'MANUAL' | 'SCHEDULED' | 'PRE_RESTORE';
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  filePath: string | null;
  sizeBytes: number | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  deletedAt: string | null;
  restoredAt: string | null;
}

export interface BackupsView {
  settings: BackupSettingsForm;
  frequencyOptions: readonly BackupFrequency[];
  nextRunAt: string | null;
  health: 'DISABLED' | 'NEVER' | 'HEALTHY' | 'STALE' | 'FAILED';
  lastSuccessAt: string | null;
  storedCopies: number;
  storedBytes: number;
  tools: { pgDump: boolean; pgRestore: boolean };
  restoreEnabled: boolean;
  runs: BackupRunRow[];
}

// ─── §15 Sistema ─────────────────────────────────────────────────────────────

export interface SystemSettingsForm {
  maintenance: { enabled: boolean; message: string };
  pagination: { maxPageSize: number };
  uploads: { maxFileSizeMb: number; allowedMimeTypes: string[] };
  jobs: { retentionDays: number };
}

export interface SystemSettingsView {
  settings: SystemSettingsForm;
  limits: { maxPageSizeCeiling: number; maxUploadMbCeiling: number };
  mimeTypeOptions: readonly string[];
  queueNames: readonly string[];
  cacheNamespaces: readonly string[];
}

export interface SystemStatus {
  queues: {
    name: string;
    paused: boolean;
    counts: Record<string, number> | null;
  }[];
  cache: { connected: boolean; keys?: number; usedMemoryMb?: number | null; enabled?: boolean };
  db: { connected: boolean; latencyMs?: number; sizeMb?: number; poolMax?: number };
  process: { uptimeSeconds: number; nodeVersion: string; memoryMb: number; env: string };
}
