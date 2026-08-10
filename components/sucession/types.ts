// components/sucession/types.ts
// Tipos do domínio de planeamento de sucessão: cargos críticos, planos
// de sucessão, talent pool e mapa organizacional. Extraído de
// app/(platform)/sucession/page.tsx.

export type ReadinessLevel = 'READY_NOW' | 'READY_SOON' | 'NEEDS_DEVELOPMENT';
export type SuccessorPriority = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BusinessImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CoverageStatus = 'COVERED' | 'AT_RISK' | 'CRITICAL';

export interface CriticalPosition {
  id: number;
  positionId: number;
  businessImpact: BusinessImpact;
  exitRisk: RiskLevel;
  expectedExitDate: string | null;
  keyPersonRisk: boolean;
  minSuccessorsRequired: number;
  criticalReason: string | null;
  coverageStatus: CoverageStatus;
  daysUntilExit: number | null;
  alert: string | null;
  position: {
    id: number;
    name: string;
    level: string | null;
    users: Array<{ id: number; fullName: string; avatarUrl: string | null }>;
    department: { id: number; name: string } | null;
  };
  successionPlans: SuccessionPlan[];
  _count: { successionPlans: number };
}

export interface SuccessionPlan {
  id: number;
  readinessLevel: ReadinessLevel;
  priority: SuccessorPriority;
  matchScore: number | null;
  geographicMobility: boolean;
  available: boolean;
  notes: string | null;
  candidate: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
    department: { name: string } | null;
  };
}

export interface TalentPoolEntry {
  id: number;
  readinessLevel: ReadinessLevel;
  geographicMobility: boolean;
  notes: string | null;
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    email: string;
    hireDate: string | null;
    position: { name: string } | null;
    department: { name: string } | null;
    performanceReviews: Array<{
      score: number | null;
      category: string | null;
    }>;
  };
  mentor: {
    id: number;
    fullName: string;
    position: { name: string } | null;
  } | null;
}

export interface OrgChartNode {
  id: number;
  position: {
    id: number;
    name: string;
    level: string | null;
    users: Array<{ id: number; fullName: string; avatarUrl: string | null }>;
    department: { id: number; name: string } | null;
  };
  exitRisk: RiskLevel;
  businessImpact: BusinessImpact;
  keyPersonRisk: boolean;
  daysUntilExit: number | null;
  coverageStatus: CoverageStatus;
  successors: Array<{
    id: number;
    fullName: string;
    avatarUrl: string | null;
    readinessLevel: ReadinessLevel;
    priority: SuccessorPriority;
    matchScore: number | null;
  }>;
}

export interface Dashboard {
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

export interface PositionSummary {
  criticalPosition: CriticalPosition;
  coverageStatus: CoverageStatus;
  daysUntilExit: number | null;
  byReadiness: Partial<Record<ReadinessLevel, SuccessionPlan[]>>;
}

export type View = 'dashboard' | 'org-chart' | 'talent-pool' | 'positions';
