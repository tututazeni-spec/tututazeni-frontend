// components/competency-map/types.ts
// Tipos do domínio de mapa de competências (skills, gap analysis,
// radar, catálogo). Extraído de
// app/(platform)/competency-map/page.tsx.

export type SkillType =
  'TECHNICAL' | 'BEHAVIORAL' | 'LEADERSHIP' | 'LANGUAGE' | 'CERTIFICATION';
export type ReadinessLevel = 'READY' | 'DEVELOPING' | 'STARTING';
export type GapPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface EmployeeSkill {
  id: number;
  skillId: number;
  currentLevel: number;
  targetLevel?: number;
  managerValidated: boolean;
  source: string;
  skill: {
    id: number;
    name: string;
    type: SkillType;
    category?: { name: string };
    maxLevel: number;
  };
}

export interface GapEntry {
  skillId: number;
  skillName: string;
  skillType: SkillType;
  category?: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  weight: number;
  mandatory: boolean;
  priority: GapPriority;
  hasGap: boolean;
}

export interface GapAnalysis {
  targetRole?: string;
  readinessScore: number;
  readinessLevel: ReadinessLevel;
  totalRequirements: number;
  metRequirements: number;
  gaps: { mandatory: GapEntry[]; optional: GapEntry[]; all: GapEntry[] };
  recommendedCourses: Array<{ id: number; title: string }>;
}

export interface CompetencyMap {
  userId: number;
  skills: EmployeeSkill[];
  byType: Record<SkillType, EmployeeSkill[]>;
  total: number;
  avgScore: number;
  gapAnalysis: GapAnalysis;
}

export interface RadarData {
  userId: number;
  readinessScore: number;
  radarByType: Array<{
    type: SkillType;
    avgCurrent: number;
    avgRequired: number;
    count: number;
  }>;
}

export interface CatalogueSkill {
  id: number;
  name: string;
  type: SkillType;
  maxLevel: number;
  category?: { name: string };
  _count?: { employeeSkills: number };
}
