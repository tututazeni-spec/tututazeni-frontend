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

// Secção 7, acrescento 4 — quebra do match por eixo (Desempenho/Potencial/
// Competências/Gaps). Calculado a pedido em findOneCriticalPosition(), não
// persistido — potentialScore fica null quando o candidato não tem
// colocação 9-box (distingue "sem dado" de "potencial médio").
export interface SuccessionMatchDetails {
  compScore: number;
  perfScore: number;
  expScore: number;
  potentialScore: number | null;
  gaps: Array<{
    competencyId: number;
    requiredLevel: number;
    currentLevel: number;
    gap: number;
  }>;
}

// Secção 7, acrescento 3 — resumo do plano de preparação do sucessor
// (DevelopmentPlan origin=SUCCESSION gerado via "Gerar PDI"). null antes de
// gerado.
export interface SuccessionDevelopmentPlanSummary {
  id: number;
  status: string;
  overallProgress: number;
  actions: Array<{ type: string; status: string }>;
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
  matchDetails?: SuccessionMatchDetails;
  developmentPlan?: SuccessionDevelopmentPlanSummary | null;
}

// GET /succession/critical-positions/:id/history — secção 7 "histórico de
// sucessão" (auditoria de mudanças, via AuditService comum).
export interface SuccessionHistoryEntry {
  id: number;
  action: string;
  entity: 'CriticalPosition' | 'SuccessionPlan';
  entityId: number | null;
  user: { id: number; fullName: string; avatarUrl?: string | null } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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
