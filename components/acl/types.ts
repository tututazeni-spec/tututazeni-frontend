// components/acl/types.ts

export type Tab = 'overview' | 'roles' | 'matrix' | 'policies' | 'audit';

export interface AclPermission {
  id?: string;
  name: string;
  subject: string;
  action: string;
}

export interface AclRoleSummary {
  role?: { name?: string };
  count: number;
}

export interface AclDeniedLogEntry {
  user?: { fullName?: string };
  userId: string;
  changes?: string;
  entity?: string;
  timestamp: string;
}

export interface AclStats {
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
  deniedCount: number;
  roleBreakdown: AclRoleSummary[];
  recentDenied: AclDeniedLogEntry[];
}

export interface MyPermissions {
  roleCode: string;
  permissions: string[];
}

export interface AclRole {
  id: string;
  code?: string;
  name: string;
  _count?: { users?: number };
  permissions?: AclPermission[];
}

export interface AclMatrixData {
  permissions: AclPermission[];
  roles: { id: string; name: string }[];
  matrix: Record<string, boolean>[];
}

export interface AclAuditLogEntry {
  user?: { fullName?: string };
  userId: string;
  action: string;
  changes?: string;
  timestamp: string;
}

export interface AclAuditResponse {
  data: AclAuditLogEntry[];
  meta?: { total: number; totalPages: number };
}

export interface AclPolicy {
  id?: string;
  name: string;
  effect: 'ALLOW' | 'DENY';
  description?: string;
  subject?: string;
  action?: string;
  requiresJustification?: boolean;
  priority: number;
  condition?: string;
}
