// components/leadership/types.ts
// Tipos do domínio de liderança (programas, equipa, feedback 360°,
// ranking, kudos). Extraído de app/(platform)/leadership/page.tsx.

export type ProgramLevel = 'INITIAL' | 'INTERMEDIATE' | 'ADVANCED';
export type ParticipantStatus =
  'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'WITHDRAWN';
export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';
export type Competency =
  | 'COMMUNICATION'
  | 'DEVELOPMENT'
  | 'RECOGNITION'
  | 'AUTONOMY'
  | 'FAIRNESS'
  | 'EXAMPLE'
  | 'STRATEGY'
  | 'RESILIENCE';

export interface LeadershipProgram {
  id: number;
  name: string;
  description: string | null;
  level: ProgramLevel;
  status: string;
  durationWeeks: number | null;
  mandatory: boolean;
  _count: { participants: number };
}

export interface Participant {
  id: number;
  userId: number;
  programId: number;
  progress: number;
  status: ParticipantStatus;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
}

export interface TeamMember {
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
    department: { name: string } | null;
  };
  latestReview: {
    score: number | null;
    category: string | null;
    status: string;
  } | null;
  pendingApprovals: number;
  feedbackCount: number;
  statusColor: HealthStatus;
}

export interface TeamDashboard {
  team: TeamMember[];
  alerts: Array<{
    userId: number;
    name: string;
    type: string;
    message: string;
  }>;
  teamHealth: {
    globalScore: number;
    healthStatus: HealthStatus;
    metrics: {
      engagementScore: number;
      turnoverRate: number;
      absenteeismRate: number;
      pdisCompletedPct: number;
      evaluationsOnTimePct: number;
    };
  };
  total: number;
}

export interface Feedback360Summary {
  leaderId: number;
  totalResponses: number;
  avgScore: number;
  byCompetency: Array<{
    competency: Competency;
    avgScore: number;
    count: number;
    insight: string | null;
  }>;
  qualitative: (string | null)[];
}

export interface LeadershipScore {
  userId: number;
  score: number;
  classification: string;
  calculatedAt: string;
}

export interface MyProgramEnrollment {
  id: number;
  progress: number;
  status: string;
  program?: { name?: string; level?: ProgramLevel };
}

export interface OneOnOne {
  id: number;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  agenda: string | null;
  meetingUrl: string | null;
  subordinate: { id: number; fullName: string; avatarUrl: string | null };
}

export interface KudosItem {
  id: number;
  message: string;
  badge: string | null;
  createdAt: string;
  sender: { id: number; fullName: string; avatarUrl: string | null };
  receiver: { id: number; fullName: string; avatarUrl: string | null };
}

export interface MyDashboardData {
  score: LeadershipScore | null;
  programs?: MyProgramEnrollment[];
  upcoming1on1s?: OneOnOne[];
  recentKudos?: KudosItem[];
}

export interface RankingEntry {
  userId: number;
  score: number;
  classification: string;
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
}

export type View =
  'my-dashboard' | 'team' | 'programs' | 'feedback360' | 'ranking' | 'kudos';

// ─── Workspace de gestão do programa (Task 7) ────────────────────────────────

export type ReadinessLevel = 'READY_NOW' | 'READY_SOON' | 'NEEDS_DEVELOPMENT';

export interface EligibilityFactor {
  criterion: string;
  source: string;
  weight: number;
  normalizedValue: number;
  weightedContribution: number;
  missing: boolean;
  note?: string;
}

export interface CandidateRow {
  id: number;
  userId: number;
  status: string;
  eligibilityScore: number | null;
  eligibilityComputedAt: string | null;
  eligibilityBreakdown: EligibilityFactor[];
  eligibilityMissingData: string[];
  user: { id: number; fullName: string; email: string };
}

export interface ProgramConfigRow {
  id: number;
  seq?: number;
}

export interface LeadershipProgramDetail extends LeadershipProgram {
  code: string;
  objective: string | null;
  type: string | null;
  corporateLevel: string | null;
  startDate: string | null;
  endDate: string | null;
  workloadHours: number | null;
  totalSessions: number | null;
  modality: string | null;
  capacity: number | null;
  minParticipants: number | null;
  minAttendanceRate: number | null;
  minFinalScore: number | null;
  requireFinalProject: boolean;
  completionCriteria: string | null;
  certificationEnabled: boolean;
  certificateTitle: string | null;
  participants: ParticipantSummary[];
  objectives: Array<ProgramConfigRow & { title: string; type: string; indicator: string | null }>;
  targeting: Array<ProgramConfigRow & { scope: string; description: string | null }>;
  selectionCriteria: Array<
    ProgramConfigRow & {
      name: string;
      source: string;
      weight: number;
      active: boolean;
      competency: { id: number; name: string } | null;
    }
  >;
  competencies: Array<
    ProgramConfigRow & {
      competencyId: number;
      targetLevel: number;
      competency: { id: number; name: string };
    }
  >;
  contents: Array<
    ProgramConfigRow & {
      contentType: string;
      title: string | null;
      course: { id: number; title: string } | null;
      learningPath: { id: number; title: string } | null;
    }
  >;
  methodologies: Array<ProgramConfigRow & { type: string; weight: number | null }>;
  advisors: Array<{
    id: number;
    userId: number;
    role: string;
    focusArea: string | null;
    user: { id: number; fullName: string; email: string };
  }>;
  projects: LeadershipProjectItem[];
  costs: Array<{
    id: number;
    category: string;
    plannedAmount: number | null;
    actualAmount: number | null;
    currency: string;
  }>;
}

export interface ParticipantSummary {
  id: number;
  userId: number;
  status: string;
  progress: number;
  readinessLevel: ReadinessLevel | null;
  finalScore: number | null;
  attendanceRate: number | null;
  baselineScore: number | null;
  mentorId: number | null;
  coachId: number | null;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    position?: { name: string } | null;
  };
}

export interface AssessmentItem {
  id: number;
  stage: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  readinessLevel: ReadinessLevel | null;
  feedback: string | null;
  assessedAt: string | null;
}

export interface ParticipantDetail extends ParticipantSummary {
  baselineNotes: string | null;
  mentoringId: number | null;
  mentor: { id: number; fullName: string } | null;
  coach: { id: number; fullName: string } | null;
  plan: {
    id: number;
    developmentPlanId: number | null;
    title: string | null;
    developmentPlan: { id: number; name: string; status: string } | null;
    actions: Array<{ id: number; title: string; type: string; status: string; seq: number }>;
  } | null;
  assessments: AssessmentItem[];
}

export interface LeadershipProjectItem {
  id: number;
  participantId: number | null;
  title: string;
  status: string;
  kpiName: string | null;
  kpiTarget: string | null;
  kpiResult: string | null;
  score: number | null;
  outcome: string | null;
}

export interface ProgramOutcomes {
  programId: number;
  participants: {
    total: number;
    byStatus: Record<string, number>;
    completionRate: number | null;
    dropoutRate: number | null;
  };
  attendance: { averageRate: number | null };
  score: { averageFinalScore: number | null };
  competencyEvolution: {
    initialAvg: number | null;
    finalAvg: number | null;
    delta: number | null;
  };
  projects: { total: number; completed: number; averageScore: number | null };
  readiness: { byLevel: Record<string, number>; readyNow: number };
  succession: { linked: number };
  cost: {
    currency: string;
    totalPlanned: number;
    totalActual: number;
    byCategory?: Record<string, { planned: number; actual: number }>;
  };
  certificates: { issued: number };
  satisfaction: null;
  promotions: null;
  mobility: null;
  roi: null;
}

/** Estado acumulado do assistente de criação/configuração (Task 7). */
export interface WizardForm {
  // Passo 1 — informação
  code: string;
  name: string;
  level: ProgramLevel | '';
  type: string;
  corporateLevel: string;
  description: string;
  objective: string;
  mandatory: boolean;
  // Planeamento
  startDate: string;
  endDate: string;
  durationWeeks: string;
  workloadHours: string;
  totalSessions: string;
  modality: string;
  capacity: string;
  minParticipants: string;
  // Conclusão / certificação
  minAttendanceRate: string;
  minFinalScore: string;
  requireFinalProject: boolean;
  completionCriteria: string;
  certificationEnabled: boolean;
  certificateTitle: string;
  // Configuração (listas)
  objectives: Array<{ title: string; indicator: string }>;
  targeting: Array<{ scope: string; description: string }>;
  selectionCriteria: Array<{ name: string; source: string; weight: string }>;
  competencies: Array<{ competencyId: string; targetLevel: string; weight: string }>;
  contents: Array<{ contentType: string; refId: string; title: string }>;
  methodologies: Array<{ type: string; weight: string }>;
  advisors: Array<{ userId: string; role: string; focusArea: string }>;
}
