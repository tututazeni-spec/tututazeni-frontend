// components/roi-impact/types.ts
// Formas dos dados de ROI/impacto vindos da API.
// Extraído de app/(platform)/roi-impact/page.tsx.

export type Tab =
  | 'executive'
  | 'roi-analysis'
  | 'impact'
  | 'evaluation-models'
  | 'costs'
  | 'kpis'
  | 'correlations'
  | 'scenarios'
  | 'benchmarks'
  | 'reports'
  | 'config';

export interface RoiBreakdown {
  key: string | number | null;
  avgRoi: number;
  count: number;
}

export interface TopInitiative {
  id: number;
  name: string;
  initiativeType: string;
  initiative: string | null;
  roiPercent: number | null;
  computedBenefit: number | null;
}

export interface ExecutiveData {
  headline?: {
    overallRoi?: number;
    totalBenefit?: number;
    totalCost?: number;
    costPerLearner?: number | null;
    costPerHour?: number | null;
    impactedEmployees?: number;
    activeMeasuring?: number;
    positiveRoiInitiatives?: number;
    negativeOrIndeterminateInitiatives?: number;
    status?: string;
    narrative?: string;
  };
  domains?: {
    learning?: { roi?: number; cost?: number; completions?: number };
    retention?: { savedValue?: number; turnoverRate?: number };
    performance?: { lift?: number; benefit?: number };
  };
  byDepartment?: RoiBreakdown[];
  byUnit?: RoiBreakdown[];
  byInitiativeType?: RoiBreakdown[];
  roiEvolution?: RoiBreakdown[];
  topInitiatives?: TopInitiative[];
  alerts?: Array<{ severity: string; message: string }>;
  topInsights?: string[];
  confidence?: string;
}

// ─────────────────────────────────────────────────────────────────
// ROI da Formação (docs/roi-impact.md §2)
// ─────────────────────────────────────────────────────────────────

export type RoiInitiativeType = 'CURSO' | 'FORMACAO' | 'PERCURSO' | 'PDI' | 'MENTORIA' | 'EVENTO';

export type RoiAnalysisStatus =
  | 'EM_PREPARACAO'
  | 'EM_MEDICAO'
  | 'DADOS_INSUFICIENTES'
  | 'CALCULADO'
  | 'VALIDADO'
  | 'REVISTO'
  | 'ARQUIVADO';

export type RoiBenefitType =
  | 'PRODUTIVIDADE'
  | 'QUALIDADE'
  | 'REDUCAO_ERROS'
  | 'REDUCAO_ROTATIVIDADE'
  | 'REDUCAO_ACIDENTES'
  | 'AUMENTO_VENDAS'
  | 'REDUCAO_TEMPO_CICLO'
  | 'SATISFACAO_CLIENTE'
  | 'OUTRO';

export interface RoiAnalysisRow {
  id: number;
  name: string;
  initiativeType: RoiInitiativeType;
  initiative: string | null;
  departmentId: number | null;
  unit: string | null;
  participants: number;
  totalCost: number;
  costPerParticipant: number | null;
  estimatedBenefit: number | null;
  realizedBenefit: number | null;
  roiPercent: number | null;
  paybackMonths: number | null;
  confidenceLevel: string | null;
  status: RoiAnalysisStatus;
  measurementPeriodDays: number | null;
}

export interface RoiAnalysisListData {
  total: number;
  analyses: RoiAnalysisRow[];
}

export interface InitiativeOption {
  id: number;
  label: string;
}

// ─────────────────────────────────────────────────────────────────
// Impacto no Negócio (docs/roi-impact.md §3)
// ─────────────────────────────────────────────────────────────────

export type ImpactSubjectType = 'COLABORADOR' | 'EQUIPA' | 'DEPARTAMENTO';

export type ImpactCategory =
  | 'PRODUTIVIDADE'
  | 'QUALIDADE'
  | 'ROTATIVIDADE'
  | 'ABSENTISMO'
  | 'SEGURANCA'
  | 'VENDAS_RECEITA'
  | 'SATISFACAO_CLIENTE'
  | 'SATISFACAO_COLABORADOR'
  | 'TEMPO_RESPOSTA'
  | 'CUMPRIMENTO_SLA'
  | 'COMPLIANCE'
  | 'CUSTO_EVITADO';

export interface ImpactRecordRow {
  id: number;
  subjectType: ImpactSubjectType;
  subjectLabel: string | null;
  initiativeType: RoiInitiativeType;
  initiative: string | null;
  category: ImpactCategory;
  indicatorName: string;
  valueBefore: number | null;
  valueAfter: number | null;
  variation: number | null;
  observationPeriodStart: string | null;
  observationPeriodEnd: string | null;
  attributionPercent: number | null;
  attributedImpact: number | null;
  dataSource: string | null;
  validatedById: number | null;
  validatedAt: string | null;
}

export interface ImpactRecordListData {
  total: number;
  records: ImpactRecordRow[];
}

export interface ImpactCategorySummaryRow {
  category: ImpactCategory;
  count: number;
  avgAttributionPercent: number | null;
  attributedTotal: number;
}

// ─────────────────────────────────────────────────────────────────
// Modelos de Avaliação (docs/roi-impact.md §4)
// ─────────────────────────────────────────────────────────────────

export type RoiModelStatus = 'ACTIVO' | 'INACTIVO';

export interface RoiEvaluationLevel {
  level: number;
  name: string;
  mandatory: boolean;
  weight: number;
}

export interface RoiEvaluationApplicability {
  initiativeTypes?: RoiInitiativeType[];
  criticality?: string[];
  minCost?: number;
}

export interface RoiEvaluationModelRow {
  id: number;
  name: string;
  description: string | null;
  levels: RoiEvaluationLevel[];
  applicability: RoiEvaluationApplicability | null;
  status: RoiModelStatus;
}

// ─────────────────────────────────────────────────────────────────
// Custos & Investimento (docs/roi-impact.md §5)
// ─────────────────────────────────────────────────────────────────

export type CostCategory = 'DIRETO' | 'INDIRETO' | 'OPORTUNIDADE';

export type CostSubCategory =
  | 'FORMADOR_CONSULTOR'
  | 'MATERIAL_DIDATICO'
  | 'PLATAFORMA_LICENCAS'
  | 'SALA_LOGISTICA'
  | 'DESLOCACAO_ALOJAMENTO'
  | 'CERTIFICACAO'
  | 'HORAS_TRABALHO_PERDIDAS'
  | 'SUBSTITUICAO_COBERTURA'
  | 'COORDENACAO_GESTAO_RH'
  | 'PRODUCAO_NAO_REALIZADA'
  | 'ATRASO_PROJETOS';

export interface CostEntryRow {
  id: number;
  initiativeType: RoiInitiativeType;
  initiativeId: number | null;
  category: CostCategory;
  subCategory: CostSubCategory;
  description: string | null;
  amount: number;
  source: string | null;
  incurredAt: string | null;
  createdAt: string;
}

export interface CostEntryListData {
  total: number;
  entries: CostEntryRow[];
}

export interface CostConsolidationRow {
  initiativeType: RoiInitiativeType;
  initiativeId: number | null;
  initiative: string | null;
  participants: number;
  costDirect: number;
  costIndirect: number;
  costOpportunity: number;
  costTotal: number;
  costPerParticipant: number | null;
  entryCount: number;
}

export interface CostConsolidationData {
  total: number;
  rows: CostConsolidationRow[];
  grandTotal: { direct: number; indirect: number; opportunity: number; total: number };
}

export interface LaborCostEstimateRow {
  userId: number;
  fullName: string;
  hourlyRate: number | null;
  cost: number | null;
  payslipPeriod: string | null;
  confidence: string;
}

export interface LaborCostEstimateData {
  hours: number;
  breakdown: LaborCostEstimateRow[];
  totalCost: number;
  note: string | null;
}

// ─────────────────────────────────────────────────────────────────
// Indicadores & KPIs (docs/roi-impact.md §6)
// ─────────────────────────────────────────────────────────────────

export type KpiCategory =
  | 'PRODUTIVIDADE'
  | 'QUALIDADE'
  | 'PESSOAS'
  | 'FINANCEIRO'
  | 'CLIENTE'
  | 'SEGURANCA'
  | 'COMPLIANCE';

export type KpiFrequency = 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export type KpiDefinitionStatus = 'ACTIVO' | 'INACTIVO';

export interface KpiDefinitionRow {
  id: number;
  name: string;
  code: string;
  category: KpiCategory;
  description: string | null;
  unit: string;
  formula: string | null;
  dataSource: string | null;
  frequency: KpiFrequency;
  targetValue: number | null;
  benchmarkNote: string | null;
  responsibleId: number | null;
  status: KpiDefinitionStatus;
}

export interface KpiDefinitionListData {
  total: number;
  kpis: KpiDefinitionRow[];
}

export interface KpiCategorySummaryRow {
  category: KpiCategory;
  count: number;
}

// ─────────────────────────────────────────────────────────────────
// Correlações (docs/roi-impact.md §7)
// ─────────────────────────────────────────────────────────────────

export type CorrelationType =
  | 'HORAS_FORMACAO_DESEMPENHO'
  | 'COMPETENCIAS_PRODUTIVIDADE'
  | 'PDI_RETENCAO'
  | 'INVESTIMENTO_ROTATIVIDADE'
  | 'ONBOARDING_TEMPO_PRODUTIVIDADE'
  | 'MENTORIA_PROGRESSAO_CARREIRA'
  | 'LIDERANCA_ENGAGEMENT_EQUIPA';

export interface CorrelationDefinition {
  type: CorrelationType;
  label: string;
  xLabel: string;
  yLabel: string;
  description: string;
}

export interface CorrelationDataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface CorrelationRow {
  id: number;
  type: CorrelationType;
  label: string;
  departmentId: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  xLabel: string;
  yLabel: string;
  sampleSize: number;
  coefficient: number | null;
  pValue: number | null;
  significant: boolean | null;
  note: string | null;
  createdAt: string;
}

export interface CorrelationDetail extends CorrelationRow {
  dataPoints: CorrelationDataPoint[];
}

export interface CorrelationListData {
  total: number;
  correlations: CorrelationRow[];
}

// ─────────────────────────────────────────────────────────────────
// Cenários & Simulações (docs/roi-impact.md §8)
// ─────────────────────────────────────────────────────────────────

export type ScenarioCase = 'OTIMISTA' | 'REALISTA' | 'PESSIMISTA';

export interface ScenarioCaseProjection {
  cost: number;
  benefit: number;
  roiPercent: number;
  paybackMonths: number | null;
}

export type ScenarioProjections = Record<ScenarioCase, ScenarioCaseProjection>;

export interface ScenarioRow {
  id: number;
  name: string;
  initiativeType: RoiInitiativeType;
  description: string | null;
  departmentId: number | null;
  targetAudienceCount: number | null;
  estimatedCost: number;
  basedOnAnalysisId: number | null;
  expectedBenefit: number | null;
  assumptions: string | null;
  note: string | null;
  roiPercent: number | null;
  paybackMonths: number | null;
  projections: ScenarioProjections | null;
  createdAt: string;
}

export interface ScenarioDetail extends ScenarioRow {
  basedOnAnalysis: {
    id: number;
    name: string;
    roiPercent: number | null;
    computedBenefit: number | null;
    computedCost: number | null;
  } | null;
}

export interface ScenarioListData {
  total: number;
  scenarios: ScenarioRow[];
}

export interface ScenarioCompareData {
  scenarios: ScenarioRow[];
  bestId: number | null;
}

// ─────────────────────────────────────────────────────────────────
// Benchmarks (docs/roi-impact.md §9)
// ─────────────────────────────────────────────────────────────────

export type BenchmarkType = 'INTERNO' | 'EXTERNO';

export interface BenchmarkRow {
  id: number;
  name: string;
  type: BenchmarkType;
  source: string;
  referenceYear: number;
  value: number;
  unit: string;
  kpiDefinitionId: number | null;
  indicatorName: string | null;
  observations: string | null;
  createdAt: string;
}

export interface BenchmarkListData {
  total: number;
  benchmarks: BenchmarkRow[];
}

export interface BenchmarkBestWorst {
  initiativeType: RoiInitiativeType;
  best: { id: number; name: string; roiPercent: number | null } | null;
  worst: { id: number; name: string; roiPercent: number | null } | null;
}

export interface BenchmarkInternalComparisonsData {
  totalAnalyses: number;
  byDepartment: RoiBreakdown[];
  byUnit: RoiBreakdown[];
  byCycle: RoiBreakdown[];
  bestWorstByType: BenchmarkBestWorst[];
}

export interface BenchmarkSectorComparisonData {
  internalAvgRoi: number | null;
  sampleSize: number;
  externalBenchmarks: BenchmarkRow[];
  note: string | null;
}

// ─────────────────────────────────────────────────────────────────
// Relatórios (docs/roi-impact.md §10)
// ─────────────────────────────────────────────────────────────────

export type RoiReportKey =
  | 'roi-consolidated'
  | 'roi-by-dimension'
  | 'impact-by-indicator'
  | 'training-cost-vs-budget'
  | 'budget-execution'
  | 'top-initiatives'
  | 'insufficient-data'
  | 'roi-evolution'
  | 'onboarding-retention'
  | 'leadership-engagement'
  | 'executive-summary';

export interface RoiReportFilter {
  from?: string;
  to?: string;
  departmentId?: number;
  unit?: string;
  initiativeType?: RoiInitiativeType;
  evaluationModelUsed?: string;
  status?: RoiAnalysisStatus;
  hierarchyLevel?: string;
  limit?: number;
}

export interface RoiConsolidatedData {
  period: { from: string | null; to: string | null };
  totalAnalyses: number;
  totalCost: number;
  totalBenefit: number;
  netBenefit: number;
  avgRoi: number | null;
  byStatus: { status: RoiAnalysisStatus; count: number }[];
}

export interface RoiByDimensionData {
  total: number;
  byDepartment: RoiBreakdown[];
  byUnit: RoiBreakdown[];
  byInitiativeType: RoiBreakdown[];
}

export interface ImpactByIndicatorRow {
  indicatorName: string;
  category: ImpactCategory;
  records: number;
  avgAttributedImpact: number | null;
  avgAttributionPercent: number | null;
}

export interface ImpactByIndicatorData {
  total: number;
  indicators: ImpactByIndicatorRow[];
}

export interface TrainingPlanExecutionRow {
  planId: number;
  name: string;
  year: number;
  period: string;
  status: string;
  plannedBudget: number;
  realizedBudget: number;
  executionRatePercent: number | null;
  variance: number;
}

export interface TrainingPlansExecutionData {
  plans: TrainingPlanExecutionRow[];
  totalPlannedBudget: number;
  totalRealizedBudget: number;
  overallExecutionRatePercent: number | null;
}

export interface TopInitiativesReportData {
  total: number;
  top: TopInitiative[];
}

export interface InsufficientDataInitiativeRow {
  id: number;
  name: string;
  initiativeType: RoiInitiativeType;
  department: string | null;
  costRegistered: boolean;
  totalCostSoFar: number;
  createdAt: string;
}

export interface InsufficientDataReportData {
  total: number;
  expensiveWithoutReturn: number;
  initiatives: InsufficientDataInitiativeRow[];
}

export interface RoiEvolutionYearRow {
  year: number;
  avgRoi: number;
  count: number;
  totalBenefit: number;
  totalCost: number;
}

export interface RoiEvolutionReportData {
  years: RoiEvolutionYearRow[];
}

export interface OnboardingCohort {
  count: number;
  retentionRatePercent: number | null;
}

export interface OnboardingRetentionReportData {
  completedCohort: OnboardingCohort;
  incompleteCohort: OnboardingCohort;
  abandonedCohort: OnboardingCohort;
  note: string | null;
}

export interface LeadershipEngagementRow {
  leaderId: number;
  leaderName: string;
  avgProgress: number;
  teamSize: number;
  avgEngagement: number | null;
}

export interface LeadershipEngagementReportData {
  leaders: LeadershipEngagementRow[];
  note: string | null;
}

// ─────────────────────────────────────────────────────────────────
// Configurações (docs/roi-impact.md §11)
// ─────────────────────────────────────────────────────────────────

export interface RoiConfigData {
  currency: string;
  discountRatePercent: number | null;
  defaultIsolationFactors: Record<string, number>;
  level45CostThreshold: number | null;
  defaultMeasurementPeriods: number[];
  defaultBenefitValidatorIds: number[];
  benefitConversionFormulas: Record<string, string>;
  financialAccessRoles: string[];
  operationalOnlyRoles: string[];
  alertNoMeasurementDays: number | null;
  alertRoiBelowExpectedPercent: number | null;
}
