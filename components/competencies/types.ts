// components/competencies/types.ts
// Tipos do domínio de competências (catálogo, perfil, gap, skill
// matrix, dashboard RH). Extraído de
// app/(platform)/competencies/page.tsx.

export type CompetencyCategory =
  'HARD_SKILL' | 'SOFT_SKILL' | 'LANGUAGE' | 'TOOL' | 'LEADERSHIP' | 'FUNCTIONAL';
export type CompetencyStatus = 'ACTIVE' | 'INACTIVE' | 'IN_REVIEW';
export type CompetencySource =
  'MANUAL' | 'COURSE' | 'ASSESSMENT' | 'MANAGER' | 'HRIS' | 'TRAINING';
export type SeniorityLevel =
  'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR' | 'C_LEVEL';
// "Nível hierárquico" dos filtros §5/§6 usa Position.level (PositionLevel),
// não SeniorityLevel (que só existe em CompetencyModel/CareerRole) — ver
// backend competencies.dto.ts#SkillMatrixFilterDto.
export type PositionLevel =
  'INTERN' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR' | 'EXECUTIVE';

export interface ProficiencyLevel {
  id: number;
  competencyId: number;
  value: number;
  name: string;
  description: string | null;
  // docs/módulo_competencies.md §3 (Fase 2) — ver
  // docs/superpowers/specs/2026-09-25-competencies-fase2-design.md.
  code: string | null;
  minScore: number | null;
  maxScore: number | null;
  expectedBehaviors: string | null;
  knowledgeDemonstrated: string | null;
  autonomy: string | null;
  taskComplexity: string | null;
  observableEvidence: string | null;
  evaluationCriteria: string | null;
  status: CompetencyStatus;
}

/** Nível de proficiência com a competência-dona anexada — forma devolvida
 *  por GET /competencies/proficiency-levels (aba "Níveis de Proficiência"). */
export interface ProficiencyLevelWithCompetency extends ProficiencyLevel {
  competency: { id: number; name: string; category: CompetencyCategory };
}

export interface CompetencyOwner {
  id: number;
  fullName: string;
}

// docs/módulo_competencies.md §2 — Informações gerais + Configuração
// (Fase 1). Aplicabilidade/Critérios/Desenvolvimento ficam para fases
// futuras — ver docs/superpowers/specs/2026-09-24-competencies-fase1-design.md.
export interface CompetencyCatalogFields {
  code: string | null;
  family: string | null;
  objective: string | null;
  isCritical: boolean;
  isStrategic: boolean;
  isMandatory: boolean;
  isAssessable: boolean;
  isDevelopable: boolean;
  owner: CompetencyOwner | null;
}

export interface Competency extends CompetencyCatalogFields {
  id: number;
  name: string;
  description: string | null;
  category: CompetencyCategory;
  tags: string[];
  status: CompetencyStatus;
  _count: { userCompetencies: number; courses: number; positions: number };
  proficiencyLevels?: ProficiencyLevel[];
}

// Forma devolvida por GET /competencies/:id (competencies.service.ts#findOne).
export interface CompetencyDetail extends CompetencyCatalogFields {
  id: number;
  name: string;
  description: string | null;
  category: CompetencyCategory;
  tags: string[];
  status: CompetencyStatus;
  proficiencyLevels: ProficiencyLevel[];
  courses: Array<{
    id: number;
    levelGained: number;
    course: { id: number; title: string; status: string };
  }>;
  positions: Array<{
    id: number;
    requiredLevel: number;
    priority: string;
    position: { id: number; name: string; level: string | null } | null;
  }>;
  _count: { userCompetencies: number; endorsements: number };
}

export interface UserCompetency {
  id: number;
  competencyId: number;
  currentLevel: number;
  targetLevel: number | null;
  selfLevel: number | null;
  managerLevel: number | null;
  source: CompetencySource;
  notes: string | null;
  evaluatedAt: string;
  competency: Competency;
  gap: number | null;
  divergence: number | null;
}

export interface GapResult {
  competency: Competency;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  met: boolean;
  priority: string;
  weight: number;
  recommendedCourses: Array<{ id: number; title: string }>;
}

export interface GapAnalysis {
  gaps: GapResult[];
  totalGap: number;
  mandatoryGaps: number;
  readinessPercent: number;
}

export interface MatrixUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  position: { name: string; level: PositionLevel | null } | null;
}

export interface SkillMatrix {
  users: MatrixUser[];
  competencies: Competency[];
  matrix: Array<{
    user: MatrixUser;
    levels: Array<{ competencyId: number; level: number }>;
  }>;
}

export interface OrgDashboard {
  totalUsers: number;
  usersWithCompetencies: number;
  totalGaps: number;
  criticalGaps: Array<{
    id: number;
    name: string;
    category: string;
    usersWithGap: number;
  }>;
}

export interface CompetencyEvolutionEntry {
  id: number;
  competency?: { name: string };
  source: string;
  previousLevel: number;
  newLevel: number;
  createdAt: string;
}

export interface TopCompetency {
  competencyId: number;
  competency?: { name: string; category: string };
  _count: { competencyId: number };
  avgLevel: number;
}

// Forma devolvida por GET /competencies/overview (competencies.service.ts#getOverview).
export interface CompetencyOverview {
  total: number;
  byCategory: {
    technical: number;
    behavioral: number;
    leadership: number;
    functional: number;
    language: number;
    tool: number;
  };
  critical: number;
  strategic: number;
  active: number;
  inReview: number;
  avgProficiency: number;
  evaluatedUsers: number;
  biggestGaps: Array<{
    id: number;
    name: string;
    category: CompetencyCategory;
    isCritical: boolean;
    usersWithGap: number;
  }>;
  criticalAlerts: Array<{
    id: number;
    name: string;
    category: CompetencyCategory;
    isCritical: boolean;
    usersWithGap: number;
  }>;
  topCompetencies: TopCompetency[];
  /** null = ainda não medido — depende do tab "Avaliações" (fase futura). */
  pendingEvaluations: number | null;
}

// docs/módulo_competencies.md §4 (Fase 2) — ver
// docs/superpowers/specs/2026-09-25-competencies-fase2-design.md.
export interface CompetencyModelItem {
  id: number;
  competencyId: number;
  weight: number;
  expectedLevel: number;
  isMandatory: boolean;
  isCritical: boolean;
  competency: { id: number; name: string; category: CompetencyCategory };
}

export interface CompetencyModel {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  objective: string | null;
  type: string | null;
  positionFamily: string | null;
  hierarchyLevel: SeniorityLevel | null;
  status: CompetencyStatus;
  version: number;
  effectiveDate: string | null;
  endDate: string | null;
  department: { id: number; name: string } | null;
  owner: CompetencyOwner | null;
  _count: { items: number };
}

export interface CompetencyModelDetail
  extends Omit<CompetencyModel, '_count'> {
  items: CompetencyModelItem[];
}

// docs/módulo_competencies.md §6 (Fase 3) — forma devolvida por GET
// /competencies/evaluations (competencies.service.ts#getEvaluations). A
// avaliação em si acontece nos módulos Evaluation/Evaluation360; esta lista
// apresenta o resultado já gravado em UserCompetency.
export type CompetencyEvaluationStatus = 'ATINGIDO' | 'ABAIXO_DO_ESPERADO' | 'SEM_META';

export interface CompetencyEvaluation {
  id: number;
  colaborador: string;
  colaboradorId: number;
  colaboradorAvatarUrl: string | null;
  departamento: string | null;
  cargo: string | null;
  avaliador: string | null;
  competencia: string;
  competenciaId: number;
  categoria: CompetencyCategory;
  tipoAvaliacao: string;
  source: CompetencySource;
  nivelObtido: number;
  nivelEsperado: number | null;
  gap: number | null;
  data: string;
  estado: CompetencyEvaluationStatus;
  comentarios: string | null;
  evidencias: string | null;
  proximaAvaliacao: string | null;
}

// docs/módulo_competencies.md §7 — forma devolvida por GET /competencies/gaps
// (competencies.service.ts#getGaps). Prioridade/Estado são derivados, não
// persistidos — ver comentário do endpoint no backend.
export type CompetencyGapPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CompetencyGapStatus =
  | 'IDENTIFICADO'
  | 'EM_DESENVOLVIMENTO'
  | 'EM_ACOMPANHAMENTO'
  | 'RESOLVIDO'
  | 'ENCERRADO';
export type CompetencyGapImpact = 'ALTO' | 'MEDIO' | 'BAIXO';

export interface CompetencyGap {
  id: number;
  colaborador: string;
  colaboradorId: number;
  colaboradorAvatarUrl: string | null;
  departamentoId: number | null;
  departamento: string | null;
  cargo: string | null;
  competencia: string;
  competenciaId: number;
  categoria: CompetencyCategory;
  nivelAtual: number;
  nivelEsperado: number;
  gap: number;
  prioridade: CompetencyGapPriority;
  competenciaCritica: boolean;
  impacto: CompetencyGapImpact;
  dataIdentificacao: string;
  planoDesenvolvimentoAssociado: { id: number; name: string } | null;
  estado: CompetencyGapStatus;
}

// docs/módulo_competencies.md §8 — forma devolvida por GET
// /competencies/development (competencies.service.ts#getDevelopmentActions).
// Tipo/Estado espelham DevelopmentPlanAction (ActionType/ActionStatus no
// Prisma) — enum completo, distinto do subconjunto usado em
// components/development-plans/types.ts.
export type DevelopmentActionType =
  | 'COURSE'
  | 'MENTORING'
  | 'COACHING'
  | 'READING'
  | 'PROJECT'
  | 'JOB_ROTATION'
  | 'MICROLEARNING'
  | 'WORKSHOP'
  | 'CERTIFICATION'
  | 'SHADOWING'
  | 'PEER_COACHING'
  | 'FEEDBACK'
  | 'CONFERENCE'
  | 'LEADERSHIP_EXPOSURE'
  | 'OTHER';
export type DevelopmentActionStatus =
  'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED' | 'OVERDUE';
export type DevelopmentResult = 'MELHOROU' | 'MANTEVE' | 'PENDENTE';

export interface CompetencyDevelopmentAction {
  id: string;
  actionId: number;
  colaborador: string;
  colaboradorId: number;
  colaboradorAvatarUrl: string | null;
  departamento: string | null;
  competencia: string;
  competenciaId: number;
  categoria: CompetencyCategory;
  gap: number | null;
  nivelAtual: number | null;
  nivelObjetivo: number | null;
  acao: string;
  tipoAcao: DevelopmentActionType;
  cursoFormacao: string | null;
  cursoFormacaoId: number | null;
  pdiAssociado: { id: number; name: string };
  responsavel: string | null;
  dataInicio: string | null;
  dataPrevistaConclusao: string | null;
  estado: DevelopmentActionStatus;
  progresso: number;
  resultado: DevelopmentResult;
  nivelAposDesenvolvimento: number | null;
}

export type View =
  | 'overview'
  | 'catalog'
  | 'levels'
  | 'models'
  | 'my-profile'
  | 'matrix'
  | 'evaluations'
  | 'gaps'
  | 'development'
  | 'dashboard'
  | 'competency-map';
