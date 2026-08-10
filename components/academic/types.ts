// components/academic/types.ts

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

export const LEVEL_COLORS: Record<string, string> = {
  BASIC: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-purple-100 text-purple-800',
  EXPERT: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-700',
  DROPPED: 'bg-gray-100 text-gray-500',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
};
