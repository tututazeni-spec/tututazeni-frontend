// components/dashboard-institutional/types.ts

export interface Summary {
  people: { total: number; newThisMonth: number };
  learning: {
    courses: number;
    activeEnrollments: number;
    completedThisYear: number;
    completionRate: number;
  };
  crm: {
    beneficiaries: number;
    partners: number;
    funders: number;
    totalFunding: number;
  };
  knowledge: {
    libraryItems: number;
    certificates: number;
    badgesIssued: number;
  };
}

export interface TrendPoint {
  month: string;
  users: number;
  enrollments: number;
  completions: number;
}

export interface Alerts {
  critical: number;
  warnings: number;
  reminders: number;
  details: Record<string, number>;
}
