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

export type View = 'list' | 'tree' | 'detail' | 'dashboard';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };
