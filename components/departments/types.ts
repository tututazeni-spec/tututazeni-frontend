// components/departments/types.ts
// Tipos do domínio de departamentos (lista, organograma, detalhe,
// dashboard comparativo). Extraído de
// app/(platform)/departments/page.tsx.

export interface Department {
  id: number;
  code: string;
  name: string;
  acronym: string | null;
  description: string | null;
  active: boolean;
  status: string;
  closedAt: string | null;
  closureReason: string | null;
  color: string | null;
  icon: string | null;
  costCenter: string | null;
  trainingBudget: number | null;
  annualBudget: number | null;
  maxEmployees: number | null;
  location: string | null;
  physicalLocation: string | null;
  operationalStartDate: string | null;
  institutionalEmail: string | null;
  phoneExtension: string | null;
  objective: string | null;
  mainResponsibilities: string | null;
  functionalArea: string | null;
  businessArea: string | null;
  isStrategic: boolean;
  notes: string | null;
  expectedEmployees: number | null;
  institutionalContact: string | null;
  dataVisibility: 'PUBLIC' | 'DEPARTMENT_ONLY' | 'RESTRICTED';
  approvalRequired: boolean;
  approverIds: number[];
  processOwnerDepartmentId: number | null;
  parentId: number | null;
  headId: number | null;
  directManagerId: number | null;
  unitId: number | null;
  createdAt: string;
  updatedAt: string;
  head: { id: number; fullName: string; email: string } | null;
  directManager: { id: number; fullName: string; email: string } | null;
  unit: { id: number; name: string; code: string } | null;
  parent: { id: number; name: string; code: string } | null;
  processOwnerDepartment: { id: number; name: string; code: string } | null;
  children: DepartmentNode[];
  _count: { users: number; children: number };
}

export interface DepartmentNode extends Omit<Department, 'children'> {
  children: DepartmentNode[];
  // Só presentes em GET /departments/tree (docs/modulo_departments.md
  // Ponto 3 — "Estrutura Organizacional").
  positionsCount: number;
  level: number;
}

export interface Member {
  id: number;
  fullName: string;
  email: string;
  active: boolean;
  position: { name: string } | null;
}

export interface HeadHistoryEntry {
  id: number;
  head: { fullName: string };
  startedAt: string;
  endedAt?: string | null;
}

export interface Metrics {
  departmentId: number;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  transfers: { in: number; out: number };
  breadcrumb: Array<{ id: number; name: string; code: string }>;
  hierarchyLevel: number;
  activePositions: number;
  subdepartments: number;
  coursesInProgress: number;
  pendingEvaluations: number;
  activeGoals: number;
  avgPerformanceScore: number | null;
  recentActivity: Array<{ date: string; description: string }>;
  alerts: string[];
}

// "Estrutura de um departamento" (docs/modulo_departments.md Ponto 2):
// Departamento → Subdepartamentos → Equipas → Responsável → Colaboradores →
// Cargos → Posições.
export interface StructureTeam {
  manager: { id: number; fullName: string } | null;
  members: Array<{
    id: number;
    fullName: string;
    email: string;
    position: { id: number; name: string } | null;
  }>;
}

export interface StructurePosition {
  id: number;
  name: string;
  code: string | null;
  level: string | null;
  headcountPlanned: number;
  headcountOccupied: number;
}

export interface StructureVacancy {
  id: number;
  title: string;
  status: string;
  slots: number;
  closingDate: string | null;
  createdAt: string;
}

export interface StructureDocument {
  id: number;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface StructureGoal {
  id: number;
  title: string;
  status: string;
  progress: number;
  dueDate: string | null;
  user: { id: number; fullName: string };
}

export interface Structure {
  departmentId: number;
  teams: StructureTeam[];
  positions: StructurePosition[];
  vacancies: StructureVacancy[];
  documents: StructureDocument[];
  goals: StructureGoal[];
}

export interface PaginatedDepts {
  data: Department[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ComparativeRow {
  id: number;
  name: string;
  code: string;
  headName: string;
  totalMembers: number;
  active: boolean;
}

export type View = 'list' | 'structure' | 'detail' | 'dashboard';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };
