// components/competencies/types.ts
// Tipos do domínio de competências (catálogo, perfil, gap, skill
// matrix, dashboard RH). Extraído de
// app/(platform)/competencies/page.tsx.

export type CompetencyCategory =
  'HARD_SKILL' | 'SOFT_SKILL' | 'LANGUAGE' | 'TOOL' | 'LEADERSHIP' | 'FUNCTIONAL';
export type CompetencyStatus = 'ACTIVE' | 'INACTIVE' | 'IN_REVIEW';
export type CompetencySource =
  'MANUAL' | 'COURSE' | 'ASSESSMENT' | 'MANAGER' | 'HRIS';

export interface ProficiencyLevel {
  id: number;
  value: number;
  name: string;
  description: string | null;
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
  position: { name: string } | null;
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

export type View =
  | 'overview'
  | 'catalog'
  | 'my-profile'
  | 'matrix'
  | 'dashboard'
  | 'competency-map';
