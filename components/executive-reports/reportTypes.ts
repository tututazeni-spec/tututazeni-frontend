// components/executive-reports/reportTypes.ts
// Tipos dos relatórios predefinidos/personalizados/agendados e dos alertas
// (docs/Executive_Reports.md §7-9). Espelham as respostas do backend.

export type ExportFormat = 'PDF' | 'XLSX' | 'CSV';
export type ScheduleFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface ReportSection {
  key: string;
  title: string;
  sourceModules: string[];
  columns: { key: string; label: string }[];
  rows: Record<string, string | number | null>[];
  note?: string;
}

export interface OmittedSection {
  key: string;
  reason: string;
}

export interface TemplateOption {
  code: string;
  id?: number;
  name: string;
  description?: string | null;
  category: string;
  version: number;
  predefined: boolean;
  period?: string;
  sections?: { key: string; title: string }[];
  config?: CustomConfig;
}

export interface BuilderSectionOption {
  key: string;
  title: string;
  sourceModules: string[];
}

export interface CustomConfig {
  sections: string[];
  kpiCodes?: string[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PreviewResponse {
  sections: ReportSection[];
  omitted: OmittedSection[];
  sourceModules: string[];
}

export interface GeneratedReport {
  id: number;
  title: string;
  sections: ReportSection[];
  omitted: OmittedSection[];
}

export interface ScheduleRun {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  delivered: number[];
  rejected: number[];
  errorMessage: string | null;
  reportId: number | null;
}

export interface ReportSchedule {
  id: number;
  name: string;
  templateCode: string | null;
  templateId: number | null;
  frequency: ScheduleFrequency;
  hour: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  format: ExportFormat;
  recipientIds: number[];
  active: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  createdBy: { id: number; fullName: string };
  runs: ScheduleRun[];
}

export interface ArchiveRow {
  id: number;
  title: string;
  templateCode: string | null;
  templateVersion: number | null;
  formulaVersion: string | null;
  period: string | null;
  createdAt: string;
  confidentiality: string;
  filters: { applied?: Record<string, unknown> } | null;
  generatedBy: { id: number; fullName: string };
  schedule: { id: number; name: string } | null;
  _count: { accessLogs: number };
}

export interface ArchiveResponse {
  data: ArchiveRow[];
  total: number;
  page: number;
  totalPages: number;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export interface ExecutiveAlert {
  id: number;
  ruleCode: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  sourceModule: string;
  link: string | null;
  status: AlertStatus;
  dueDate: string | null;
  detectedAt: string;
  overdue: boolean;
  owner: { id: number; fullName: string } | null;
}

export interface AlertEvent {
  id: number;
  action: string;
  comment: string | null;
  createdAt: string;
  user: { id: number; fullName: string } | null;
}

export interface AlertsResponse {
  data: ExecutiveAlert[];
  total: number;
  summary: {
    activeBySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export interface AlertRule {
  code: string;
  name: string;
  sourceModule: string;
  condition: string;
  unit: string | null;
  available: boolean;
  defaultThreshold: number | null;
  threshold: number | null;
  severity: AlertSeverity;
  active: boolean;
  owner: { id: number; fullName: string } | null;
  approvedAt: string | null;
}
