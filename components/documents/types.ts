// components/documents/types.ts
// Tipos do domínio de repositório de documentos. Extraído de
// app/(platform)/documents/page.tsx.

export type DocCategory =
  | 'PERSONAL'
  | 'LABOUR'
  | 'LEARNING'
  | 'CORPORATE'
  | 'RECRUITMENT'
  | 'COMPLIANCE'
  | 'HEALTH'
  | 'PAYROLL'
  | 'LEAVE'
  | 'OTHER';
export type DocSensitivity =
  'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'SECRET';
export type DocStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED' | 'DELETED';

export interface Document {
  id: number;
  title: string;
  description?: string;
  category: DocCategory;
  sensitivity: DocSensitivity;
  status: DocStatus;
  mimeType: string;
  fileUrl: string;
  version: string;
  fileSize?: number;
  tags: string[];
  downloadCount: number;
  expiresAt?: string;
  retentionUntil?: string;
  createdAt: string;
  department?: string;
  createdBy?: { id: number; name: string };
  owner?: { id: number; name: string };
  _count?: { versions: number; downloads: number };
}

export interface DashboardData {
  kpis: {
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
    archived: number;
    newThisMonth: number;
    recentDownloads: number;
    totalSizeGB: number;
  };
  byCategory: Array<{ category: string; _count: number }>;
}

export interface DocFilters {
  search: string;
  category: string;
  sensitivity: string;
  tag: string;
  expiringSoon: boolean;
}

export type ViewMode = 'grid' | 'list';
