// components/history/types.ts
// Tipos do domínio de histórico: hub organizacional (docs/history.md),
// timeline pessoal, marcos e estatísticas de actividade.

export type Tab =
  | 'overview'
  | 'history'
  | 'employee'
  | 'movements'
  | 'org'
  | 'documents'
  | 'activities'
  | 'reports';

export interface PersonRef {
  id: number;
  fullName: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Timeline pessoal / marcos / estatísticas ────────────────────────

export interface Milestone {
  icon: string;
  title: string;
  date: string;
  type: string;
}

export interface HistoryStats {
  streak?: number;
  activeDays?: number;
  completions?: number;
  xpPoints?: number;
  heatmap?: Record<string, number>;
  byCategory?: Record<string, number>;
}

export interface TimelineEvent {
  id: string;
  source: string;
  timestamp: string;
  category: string;
  module: string;
  milestone: boolean;
  icon: string;
  title: string;
  description?: string | null;
  action: string;
  entity: string;
  entityId?: string | number;
  userId: number;
  user?: { fullName: string; avatarUrl?: string };
}

export interface GroupedEvents {
  month: string;
  items: TimelineEvent[];
}

// ─── Hub organizacional ──────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  timestamp: string;
  origin: string;
  actor: PersonRef | null;
  affected: PersonRef | null;
  module: string;
  entity: string;
  entityId: number | null;
  reference: string | null;
  eventType: string;
  title: string;
  description: string | null;
  status: string;
}

export interface Movement {
  id: string;
  timestamp: string;
  type: string;
  typeLabel: string;
  employee: PersonRef | null;
  registeredBy: PersonRef | null;
  prevPosition: string | null;
  newPosition: string | null;
  prevDepartment: string | null;
  newDepartment: string | null;
  prevManager: string | null;
  newManager: string | null;
  reason: string | null;
  notes: string | null;
  origin: string;
}

export interface OrgChange {
  id: string;
  timestamp: string;
  department: string | null;
  unit: string | null;
  change: string;
  field: string | null;
  before: string | null;
  after: string | null;
  responsible: PersonRef | null;
  reason: string | null;
}

export interface DocRecord {
  id: string;
  timestamp: string;
  document: string;
  subject: string | null;
  type: string;
  eventType: string;
  action: string;
  version: string | null;
  user: PersonRef | null;
  status: string;
  origin: string;
}

export interface Overview {
  period: { from: string; to: string };
  kpis: {
    totalEvents: number;
    eventsToday: number;
    eventsMonth: number;
    admissions: number;
    transfers: number;
    positionChanges: number;
    departmentChanges: number;
    salaryChanges: number;
    evaluationsCompleted: number;
    trainingsCompleted: number;
    documentsAdded: number;
    requestsApproved: number;
    requestsRejected: number;
  };
  recent: HistoryEntry[];
  topUsers: { user: PersonRef | null; count: number }[];
  topModules: { module: string; count: number }[];
}

export interface ReportResult {
  type: string;
  title: string;
  columns: string[];
  rows: Record<string, string | number>[];
  generatedAt: string;
}

// ─── Filtros globais (docs/history.md §8) ────────────────────────────

export type PeriodPreset =
  | 'today'
  | '7d'
  | 'month'
  | 'lastMonth'
  | 'year'
  | 'all'
  | 'custom';

export interface HistoryFilters {
  preset: PeriodPreset;
  from: string;
  to: string;
  affected: PersonRef | null;
  actor: PersonRef | null;
  responsible: PersonRef | null;
  module: string;
  entity: string;
  departmentId: string;
  unitId: string;
  eventType: string;
  status: string;
  search: string;
}
