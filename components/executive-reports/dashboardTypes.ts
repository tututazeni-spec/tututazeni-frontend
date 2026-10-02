// components/executive-reports/dashboardTypes.ts
// Tipos do dashboard executivo (docs/Executive_Reports.md §1-3, §5): filtros
// globais, KPIs e visão executiva. Espelham as respostas de
// GET /executive-reports/{tabs,overview,kpis}.

import type { OmittedSection, ReportSection } from './reportTypes';

export type ExecutiveTabId =
  | 'overview'
  | 'strategic'
  | 'hr'
  | 'training'
  | 'performance'
  | 'attendance'
  | 'costs'
  | 'departments'
  | 'projects'
  | 'risks'
  | 'custom'
  | 'scheduled'
  | 'history';

export interface ExecutiveTab {
  id: ExecutiveTabId;
  label: string;
  hint: string;
}

export type PeriodFilter = 'month' | 'quarter' | 'year' | 'custom';
export type CompareFilter = 'previous' | 'previous_year' | 'target';

export interface ExecutiveFilters {
  period: PeriodFilter;
  dateFrom?: string;
  dateTo?: string;
  unitId?: number;
  departmentId?: number;
  compareWith: CompareFilter;
  // Filtros adicionais (§5)
  positionId?: number;
  contractType?: string;
  courseId?: number;
  kpiState?: KpiState;
}

export type KpiState =
  'ON_TARGET' | 'WARNING' | 'CRITICAL' | 'NO_TARGET' | 'NO_DATA';

export interface ExecutiveKpi {
  code: string;
  name: string;
  shortLabel: string;
  description: string;
  formula: string;
  unit: '%' | 'pessoas' | 'acções';
  direction: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'NEUTRAL';
  value: number | null;
  previousValue: number | null;
  change: number | null;
  changePct: number | null;
  target: number | null;
  deviation: number | null;
  warningThreshold: number | null;
  criticalThreshold: number | null;
  state: KpiState;
  trend: { label: string; value: number | null }[] | null;
  sourceModules: string[];
  lastUpdatedAt: string;
}

export interface ExecutiveContext {
  period: PeriodFilter;
  compareWith: CompareFilter;
  unitId: number | null;
  departmentId: number | null;
  positionId?: number | null;
  contractType?: string | null;
  courseId?: number | null;
  kpiState?: KpiState | null;
  current: { start: string; end: string };
  comparison: { start: string; end: string } | null;
}

export interface LabelValue {
  label: string;
  value: number;
}

export interface ExecutiveAlert {
  code: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  sourceModules: string[];
}

export interface ExecutiveOverview {
  context: ExecutiveContext;
  kpis: ExecutiveKpi[];
  workforce: {
    total: number;
    hires: number;
    exits: number;
    netBalance: number;
    turnoverLast12Months: number | null;
    byDepartment: LabelValue[];
    byPosition: LabelValue[];
    byContractType: LabelValue[];
  };
  training: {
    enrollmentsEligible: number;
    enrollmentsCompleted: number;
    participants: number;
    hours: number;
  };
  performance: {
    reviewsTotal: number;
    reviewsCompleted: number;
    completionPct: number | null;
  };
  competencies: {
    collaboratorsEvaluated: number;
    evaluatedPct: number | null;
    gapsIdentified: number;
  };
  leave: { pending: number; inCourse: number };
  onboarding: { inProgress: number; completed: number };
  development: { activePlans: number; overdueActions: number };
  pending: {
    overdueMandatoryTraining: number;
    overdueActions: number;
    pendingLeaveApprovals: number;
  };
  alerts: ExecutiveAlert[];
}

export interface ExecutiveKpisResponse {
  context: ExecutiveContext;
  kpis: ExecutiveKpi[];
}

export interface Unit {
  id: number;
  name: string;
}

export interface FilterOptions {
  positions: { id: number; name: string }[];
  courses: { id: number; title: string }[];
  contractTypes: string[];
  kpiStates: KpiState[];
}

// ─── Gráficos (§6) ───────────────────────────────────────────────────────────

export interface DepartmentRow {
  id: number;
  name: string;
  headcount: number;
  performance: number | null;
  trainingCompletion: number | null;
  absenteeism: number | null;
  turnover: number | null;
  overduePdi: number;
  overdueMandatory: number;
}

export interface DepartmentChartsResponse {
  context: ExecutiveContext;
  departments: DepartmentRow[];
  targets: {
    performance: number | null;
    trainingCompletion: number | null;
    absenteeism: number | null;
    turnover: number | null;
  };
  composition: {
    categories: string[];
    series: { key: string; values: number[] }[];
  };
}

export interface GoalChartsResponse {
  context: ExecutiveContext;
  vsTarget: {
    code: string;
    label: string;
    actual: number;
    target: number;
    deviation: number | null;
    direction: ExecutiveKpi['direction'];
    state: KpiState;
    unit: ExecutiveKpi['unit'];
  }[];
  execution: {
    label: string;
    done: number;
    total: number;
    pct: number | null;
    source: string;
  }[];
}

export type RiskLevel = 'OK' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
export type RiskColumn =
  | 'turnover'
  | 'absenteeism'
  | 'overduePdi'
  | 'overdueMandatory';

export interface RiskCell {
  value: number | null;
  rate?: number | null;
  level: RiskLevel;
}

export interface RiskException {
  id: number;
  title: string;
  person: string;
  department: string | null;
  dueDate: string | null;
  daysOverdue: number | null;
}

export interface RiskChartsResponse {
  context: ExecutiveContext;
  criteria: Record<
    RiskColumn,
    { label: string; warning: number; critical: number; rule: string }
  >;
  heatmap: {
    id: number;
    name: string;
    headcount: number;
    cells: Record<RiskColumn, RiskCell>;
  }[];
  exceptions: {
    overduePdiActions: RiskException[];
    overdueMandatoryTraining: RiskException[];
    staleLeaveApprovals: RiskException[];
  };
}

export type SourceStatus = 'INTEGRATED' | 'PLANNED' | 'CONTEXT' | 'REPLACED';

export interface SourceEntry {
  module: string;
  consumes: string;
  status: SourceStatus;
  usedBy: string[];
  restricted?: boolean;
  note?: string;
  recordCount: number | null;
}

export interface SourcesResponse {
  summary: {
    total: number;
    integrated: number;
    withData: number;
    planned: number;
  };
  sources: SourceEntry[];
  checkedAt: string;
}

// GET /executive-reports/{workforce,training,performance,attendance,organization,costs}
export interface DomainResponse {
  domain: string;
  title: string;
  context: ExecutiveContext;
  kpis: ExecutiveKpi[];
  sections: ReportSection[];
  omitted: OmittedSection[];
  sourceModules: string[];
}
