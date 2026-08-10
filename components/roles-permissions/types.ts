// components/roles-permissions/types.ts
// Tipos do domínio de RBAC: roles, matriz de permissões, simulação
// e governança. Extraído de app/(platform)/roles-permissions/page.tsx.

export type Tab = 'roles' | 'matrix' | 'simulator' | 'governance';

export interface RolePermission {
  name: string;
}
export interface RoleUser {
  fullName: string;
}

export interface Role {
  id: number;
  name: string;
  code?: string | null;
  isSystem?: boolean;
  _count?: { users: number };
  effectivePermissions?: number;
  permissions?: RolePermission[];
  users?: RoleUser[];
}

export interface MatrixPermission {
  name: string;
  subject: string;
  action: string;
}
export interface MatrixRole {
  id: number;
  name: string;
}

export interface MatrixData {
  grouped?: Array<{ subject: string }>;
  permissions?: MatrixPermission[];
  roles?: MatrixRole[];
  matrix?: Array<Record<string, boolean>>;
}

export interface SimulationStep {
  step: string;
  check: string;
  detail: string;
  result: boolean;
}

export interface SimulationResult {
  allowed: boolean;
  reason: string;
  user?: { fullName: string };
  role?: { name: string } | null;
  resource: string;
  action: string;
  chain?: SimulationStep[];
}

export interface GovernanceAlert {
  type: string;
  message: string;
}
export interface RoleUserCount {
  role?: { name: string } | null;
  count: number;
}
export interface UnusedRole {
  name: string;
}

export interface GovernanceData {
  totalRoles?: number;
  totalPermissions?: number;
  usersWithoutRole?: number;
  deniedAccesses?: number;
  alerts?: GovernanceAlert[];
  usersPerRole?: RoleUserCount[];
  unusedRoles?: UnusedRole[];
}
