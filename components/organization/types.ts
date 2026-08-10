// components/organization/types.ts
// Tipos do domínio de estrutura organizacional: departamentos,
// cargos, organograma, movimentações e headcount. Extraído de
// app/(platform)/organization/page.tsx.

export type DeptStatus = 'ACTIVE' | 'INACTIVE';
export type PosLevel =
  | 'INTERN'
  | 'JUNIOR'
  | 'MID'
  | 'SENIOR'
  | 'LEAD'
  | 'MANAGER'
  | 'DIRECTOR'
  | 'EXECUTIVE';
export type ChangeType =
  | 'PROMOTION'
  | 'TRANSFER'
  | 'RESTRUCTURE'
  | 'HIRE'
  | 'TERMINATION'
  | 'MANAGER_CHANGE';

export interface OrgStats {
  units: number;
  departments: number;
  positions: number;
  headcount: { total: number; occupied: number; planned: number; open: number };
  kpis: {
    spanOfControl: number;
    managerCount: number;
    maxHierarchyDepth: number;
  };
  topDepartments: Array<{
    id: number;
    name: string;
    color: string | null;
    _count: { users: number };
  }>;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: DeptStatus;
  color: string | null;
  annualBudget: number | null;
  costCenter: string | null;
  head: { id: number; fullName: string; avatarUrl: string | null } | null;
  parent: { id: number; name: string } | null;
  unit: { id: number; name: string } | null;
  _count: { users: number; children: number };
}

export interface Position {
  id: number;
  name: string;
  code: string | null;
  level: PosLevel;
  headcountOccupied: number;
  headcountOpen: number;
  headcountPlanned: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

export interface OrgNode {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  managerId: number | null;
  position: { id: number; name: string; level: string } | null;
  department: { id: number; name: string; color: string | null } | null;
  _count: { subordinates: number };
  children: OrgNode[];
}

export interface OrgChange {
  id: number;
  changeType: ChangeType;
  effectiveDate: string;
  reason: string | null;
  user: { id: number; fullName: string; avatarUrl: string | null };
  fromDepartment: { name: string } | null;
  toDepartment: { name: string } | null;
  fromPosition: { name: string } | null;
  toPosition: { name: string } | null;
}

export interface HeadcountRow {
  id: number;
  name: string;
  code: string;
  color: string | null;
  occupied: number;
  planned: number;
  open: number;
  occupancyPct: number | null;
}

export interface DepartmentDetail extends Department {
  users?: Array<{
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position?: { name: string } | null;
  }>;
}

export type View =
  'dashboard' | 'chart' | 'departments' | 'positions' | 'timeline';
