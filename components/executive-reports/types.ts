// components/executive-reports/types.ts
// Tipos do domínio de relatórios executivos: métricas, relatórios,
// templates e estatísticas. Extraído de
// app/(platform)/executive-reports/page.tsx.

export type ReportType =
  'FLASH' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM' | 'AUDIT';
export type ReportStatus =
  'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
export type KpiStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface Metric {
  id: number;
  label: string;
  value: number;
  unit: string | null;
  previousValue: number | null;
  target: number | null;
  status: KpiStatus | null;
  comment: string | null;
  sortOrder: number;
}

export interface Report {
  id: number;
  title: string;
  subtitle: string | null;
  type: ReportType;
  status: ReportStatus;
  confidentiality: string;
  period: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  achievements: string[];
  risks: string[];
  recommendations: string[];
  nextSteps: string[];
  narrative: string | null;
  filePath: string;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  generatedBy: { id: number; fullName: string; avatarUrl: string | null };
  department: { id: number; name: string } | null;
  metrics: Metric[];
  approvals?: unknown[];
  _count?: { accessLogs: number };
}

export interface ReportTemplate {
  id: number;
  type: ReportType;
  name: string;
  description?: string;
  sections: string[];
}

export interface ReportStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentReports: Report[];
}

export type View = 'list' | 'detail' | 'generate';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };
