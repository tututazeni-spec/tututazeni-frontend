// components/departments/types.ts
// Tipos do domínio de departamentos (lista, organograma, detalhe,
// dashboard comparativo). Extraído de
// app/(platform)/departments/page.tsx.

export interface Department {
  id: number;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  color: string | null;
  icon: string | null;
  costCenter: string | null;
  trainingBudget: number | null;
  expectedEmployees?: number | null;
  maxEmployees?: number | null;
  parentId: number | null;
  headId: number | null;
  createdAt: string;
  updatedAt: string;
  head: { id: number; fullName: string; email: string } | null;
  parent: { id: number; name: string; code: string } | null;
  children: DepartmentNode[];
  _count: { users: number; children: number };
}

export interface DepartmentNode extends Omit<Department, 'children'> {
  children: DepartmentNode[];
  // Enriquecido em GET /departments/tree (docs/modulo_departments.md Ponto 3)
  level: number;
  positionsCount: number;
  location: string | null;
  unit: { id: number; name: string } | null;
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
  expectedEmployees: number | null;
  maxEmployees: number | null;
  transfers: { in: number; out: number };
  breadcrumb: Array<{ id: number; name: string; code: string }>;
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

// GET /departments/heads (docs/modulo_departments.md Ponto 4 — Responsáveis)
export interface HeadRow {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  head: { id: number; fullName: string; email: string } | null;
  position: string | null;
  deputyHead: { id: number; fullName: string } | null;
  startedAt: string | null;
  status: string;
  active: boolean;
  contact: string | null;
  usersUnderResponsibility: number;
  subdepartmentsUnderResponsibility: number;
}

// GET /departments/heads/history
export interface HeadHistoryRow {
  id: number;
  department: { id: number; name: string; code: string };
  previousHead: { id: number; fullName: string } | null;
  newHead: { id: number; fullName: string };
  changedAt: string;
  endedAt: string | null;
  reason: string | null;
  changedBy: { id: number; fullName: string } | null;
}

// GET /departments/employees (docs/modulo_departments.md Ponto 5 — Colaboradores)
export interface EmployeeRow {
  id: number;
  fullName: string;
  employeeNumber: string | null;
  avatarUrl: string | null;
  email: string;
  phone: string | null;
  position: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
  subdepartment: string | null;
  location: string | null;
  manager: { id: number; fullName: string } | null;
  hireDate: string | null;
  active: boolean;
  contractType: string | null;
}

export interface CountBucket {
  label: string;
  count: number;
}

export interface EmployeeIndicators {
  total: number;
  active: number;
  inactive: number;
  byGender: CountBucket[];
  byAgeBracket: CountBucket[];
  byPosition: CountBucket[];
  byLocation: CountBucket[];
  byContractType: CountBucket[];
}

export interface PaginatedEmployees {
  data: EmployeeRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  indicators: EmployeeIndicators;
}

// GET /departments/positions (docs/modulo_departments.md Ponto 6 — Cargos & Funções)
export interface PositionRow {
  id: number;
  name: string;
  code: string | null;
  jobFunction: string | null;
  jobFamily: string | null;
  level: string | null;
  department: { id: number; name: string } | null;
  reportsTo: { id: number; name: string } | null;
  headcountPlanned: number;
  headcountOccupied: number;
  vacancies: number;
  active: boolean;
  createdAt: string;
}

export interface PositionIndicators {
  total: number;
  active: number;
  inactive: number;
  byJobFamily: CountBucket[];
  byLevel: CountBucket[];
}

export interface PaginatedPositions {
  data: PositionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  indicators: PositionIndicators;
}

// GET /positions/:id — detalhe enriquecido (Ponto 6, "Ao abrir um cargo")
export interface PositionDetail {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  jobFunction: string | null;
  jobFamily: string | null;
  level: string | null;
  responsibilities: string | null;
  requirements: string | null;
  requiredTraining: string | null;
  requiredExperience: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  headcountPlanned: number | null;
  headcountOccupied: number;
  vacancies: number;
  active: boolean;
  createdAt: string;
  department: { id: number; name: string } | null;
  reportsTo: { id: number; name: string } | null;
  subordinates: Array<{ id: number; name: string }>;
  users: Array<{ id: number; fullName: string; email: string; active: boolean }>;
  competencies: Array<{ competency: { id: number; name: string } }>;
  internalVacancies: Array<{
    id: number;
    title: string;
    status: string;
    slots: number;
    closingDate: string | null;
  }>;
}

// GET /departments/hierarchy (docs/modulo_departments.md Ponto 7 — Hierarquia)
export interface HierarchyRow {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  active: boolean;
  position: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
  subdepartment: string | null;
  manager: { id: number; fullName: string } | null;
  level: number;
  directReportsCount: number;
  indirectReportsCount: number;
  reportingChain: string[];
}

export interface PaginatedHierarchy {
  data: HierarchyRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /departments/history (docs/modulo_departments.md Ponto 8 — Histórico)
export interface HistoryEntry {
  id: string;
  date: string;
  type: string;
  department: { id: number; name: string; code: string } | null;
  field: string | null;
  before: unknown;
  after: unknown;
  changedBy: { id: number; fullName: string } | null;
  reason: string | null;
}

export interface PaginatedHistory {
  data: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /departments/reports (docs/modulo_departments.md Ponto 9 — Relatórios)
export interface ReportsData {
  period: { from: string; to: string };
  headcountByDepartment: Array<{
    id: number;
    name: string;
    code: string;
    actual: number;
    expected: number | null;
    max: number | null;
  }>;
  headcountByUnit: Array<{ id: number; name: string; actual: number; expected: number; max: number }>;
  headcountByPosition: Array<{
    id: number;
    name: string;
    department: { id: number; name: string } | null;
    planned: number;
    occupied: number;
    vacancies: number;
  }>;
  positionsOccupiedVsVacant: { planned: number; occupied: number; vacancies: number };
  employeeDistribution: {
    total: number;
    active: number;
    inactive: number;
    byLocation: CountBucket[];
    byContractType: CountBucket[];
  };
  admissions: { total: number; byMonth: Array<{ month: string; count: number }> };
  exits: { total: number; byMonth: Array<{ month: string; count: number }> };
  turnoverRate: number;
  seniority: { avgYears: number; buckets: CountBucket[] };
}

export type View =
  | 'list'
  | 'structure'
  | 'heads'
  | 'employees'
  | 'positions'
  | 'hierarquia'
  | 'historico'
  | 'relatorios'
  | 'detail'
  | 'dashboard';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };

export type PosLevel =
  | 'INTERN'
  | 'JUNIOR'
  | 'MID'
  | 'SENIOR'
  | 'LEAD'
  | 'MANAGER'
  | 'DIRECTOR'
  | 'EXECUTIVE';

// Item mínimo devolvido por GET /positions (picker simples usado por vários módulos).
export interface Position {
  id: number;
  name: string;
  code: string | null;
  level: PosLevel;
}
