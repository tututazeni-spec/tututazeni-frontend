// components/career-plans/types.ts
// Tipos do domínio de planos de carreira: readiness, metas, planos,
// cargos, simulação e analytics. Extraído de
// app/(platform)/career-plans/page.tsx.

export type ReadinessLevel = 'READY' | 'DEVELOPING' | 'STARTING';
export type GoalStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type GoalType =
  'COURSE' | 'PROJECT' | 'MENTORING' | 'CERTIFICATION' | 'SKILL' | 'OTHER';

export interface SkillGap {
  skillId: number;
  skillName: string;
  skillType: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  weight: number;
  mandatory: boolean;
}

export interface Readiness {
  score: number;
  readinessLevel: ReadinessLevel;
  readinessEmoji: string;
  targetRoleName: string;
  skillGaps: SkillGap[];
  missingSkills: SkillGap[];
  metRequirements: number;
  totalRequirements: number;
  recommendedCourses: Array<{ id: number; title: string }>;
}

export interface CareerGoal {
  id: number;
  title: string;
  type: GoalType;
  status: GoalStatus;
  progress: number;
  dueDate?: string;
  skillId?: number;
}

export interface CareerPlan {
  id: number;
  userId: number;
  title: string;
  status: string;
  targetDate?: string;
  readiness?: Readiness;
  currentRole?: { id: number; name: string; level: number };
  targetRole?: { id: number; name: string; level: number };
  careerPath?: {
    id: number;
    name: string;
    type: string;
    steps: Array<{
      order: number;
      role: { id: number; name: string; level: number };
    }>;
  };
  goals: CareerGoal[];
  mentor?: { id: number; name: string };
}

export interface Role {
  id: number;
  name: string;
  department: string;
  level: number;
  seniority?: string;
  skillRequirements?: Array<{
    skill: { name: string; type: string };
    requiredLevel: number;
    mandatory: boolean;
  }>;
}

export interface SimulationResult {
  targetRole: { name: string };
  readiness: Readiness;
  estimatedMonths: number;
  estimatedDate: string;
  recommendedActions?: Array<{ id: number; title: string }>;
}

export interface CareerPlansAnalytics {
  plans: { active: number; completed: number };
  promotions: { approved: number };
  avgPromotionDays: number;
}

export type TabKey = 'my' | 'team' | 'analytics';
