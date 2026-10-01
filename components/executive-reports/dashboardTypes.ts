// components/executive-reports/dashboardTypes.ts
// Tipos do dashboard executivo (docs/Executive_Reports.md §1-3, §5): filtros
// globais, KPIs e visão executiva. Espelham as respostas de
// GET /executive-reports/{tabs,overview,kpis}.

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
