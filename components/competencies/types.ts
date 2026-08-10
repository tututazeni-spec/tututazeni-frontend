// components/competencies/types.ts
// Tipos do domínio de competências (catálogo, perfil, gap, skill
// matrix, dashboard RH). Extraído de
// app/(platform)/competencies/page.tsx.

export type CompetencyCategory =
  'HARD_SKILL' | 'SOFT_SKILL' | 'LANGUAGE' | 'TOOL' | 'LEADERSHIP';
export type CompetencyStatus = 'ACTIVE' | 'INACTIVE';
export type CompetencySource =
  'MANUAL' | 'COURSE' | 'ASSESSMENT' | 'MANAGER' | 'HRIS';

export interface ProficiencyLevel {
  id: number;
  value: number;
  name: string;
  description: string | null;
}

export interface Competency {
  id: number;
  name: string;
  description: string | null;
  category: CompetencyCategory;
  tags: string[];
  status: CompetencyStatus;
  _count: { userCompetencies: number; courses: number; positions: number };
  proficiencyLevels?: ProficiencyLevel[];
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

export type View = 'catalog' | 'my-profile' | 'matrix' | 'dashboard';
