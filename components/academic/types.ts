// components/academic/types.ts

import type { BadgeProps } from '@/components/ui/Badge';

export interface Program {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: string;
  durationHours: number;
  _count?: { enrollments: number; classes: number };
}

export interface AcademicClass {
  id: string;
  name: string;
  modality: string;
  status: string;
  startDate: string;
  endDate: string;
  instructor?: { fullName: string } | null;
  _count?: { enrollments: number };
}

export interface ProgramDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  level: string;
  durationHours: number;
  passingScore: number;
  maxStudents: number | null;
  isMandatory: boolean;
  prerequisites: string[];
  createdBy?: { fullName: string } | null;
  classes: AcademicClass[];
  _count: { enrollments: number };
}

export interface Grade {
  id: string;
  courseName: string | null;
  score: number;
  maxScore: number;
}

export interface Enrollment {
  id: string;
  code: string;
  status: string;
  finalScore: number | null;
  progress: number;
  program: {
    name: string;
    code: string;
    durationHours: number;
    level: string;
  };
  grades: Grade[];
}

export interface Transcript {
  gpa: number;
  totalHours: number;
  completedPrograms: number;
  inProgressPrograms: number;
}

export const LEVEL_INTENT: Record<string, BadgeProps['intent']> = {
  BASIC: 'success',
  INTERMEDIATE: 'info',
  ADVANCED: 'warning',
  EXPERT: 'danger',
};

export const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  PENDING: 'neutral',
  APPROVED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
  DROPPED: 'neutral',
  REJECTED: 'danger',
  SUSPENDED: 'warning',
};
