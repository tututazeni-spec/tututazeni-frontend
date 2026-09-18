// components/career/succession/types.ts
// Tipos do separador "Sucessão" (Módulo Career, secção 7) — cargos
// críticos, planos de sucessão, matriz e dashboard. Espelha as respostas
// de GET /succession/* (src/succession/succession.service.ts).

export type ReadinessLevel =
  | 'READY_NOW'
  | 'READY_SOON'
  | 'READY_1_2_YEARS'
  | 'READY_2_3_YEARS'
  | 'NEEDS_DEVELOPMENT';

export type SuccessorPriority = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BusinessImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReplacementTime = 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
export type CoverageStatus = 'CRITICAL' | 'AT_RISK' | 'COVERED' | 'UNKNOWN';

export interface SuccessionCandidateRef {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  email?: string;
  position?: { name?: string | null } | null;
  department?: { name?: string | null } | null;
}

export interface SuccessionPlanEntry {
  id: number;
  criticalPositionId: number;
  candidateId: number;
  readinessLevel: ReadinessLevel;
  priority: SuccessorPriority;
  matchScore: number | null;
  geographicMobility: boolean;
  available: boolean;
  notes: string | null;
  readinessByDate: string | null;
  candidate: SuccessionCandidateRef;
}

export interface CriticalPositionEntry {
  id: number;
  positionId: number;
  businessImpact: BusinessImpact;
  replacementTime: ReplacementTime;
  exitRisk: RiskLevel;
  expectedExitDate: string | null;
  criticalReason: string | null;
  keyPersonRisk: boolean;
  minSuccessorsRequired: number;
  requiresDocumentation: boolean;
  position: {
    id: number;
    name: string;
    level?: string | null;
    users?: SuccessionCandidateRef[];
  };
  successionPlans: SuccessionPlanEntry[];
  _count: { successionPlans: number };
  coverageStatus: CoverageStatus;
  daysUntilExit: number | null;
  alert: string | null;
}

export interface SuccessionDashboard {
  kpis: {
    totalCriticalPositions: number;
    withoutSuccessor: number;
    coverageRate: number;
    readinessIndex: number;
    highRiskPositions: number;
    avgMatchScore: number;
  };
  criticalAlerts: Array<{
    id: number;
    position: string;
    exitRisk: RiskLevel;
    alert: string | null;
    daysUntilExit: number | null;
  }>;
}

export interface SuccessionMatrixRow {
  criticalPositionId: number;
  position: string;
  titular: string | null;
  sucessor: string | null;
  readinessLevel: ReadinessLevel | null;
  gap: number | null;
  exitRisk: RiskLevel;
}
