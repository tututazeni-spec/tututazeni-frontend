// components/documents/types.ts
// Tipos do domínio de repositório de documentos. Extraído de
// app/(platform)/documents/page.tsx.

// Espelha o enum DocCategoryType em prisma/schema.prisma — mantido em
// paridade com o backend (estava incompleto: faltavam POLITICA/MANUAL/
// PROCEDIMENTO/FORMULARIO/CONTRATO/REGULAMENTO/COMUNICADO/OUTRO desde antes
// desta extensão docs/biblioteca.md, que acrescenta as categorias de
// "Documentos Corporativos" que ainda faltavam: CIRCULAR/ORDEM_SERVICO/
// LEGISLACAO/INSTRUCAO_TRABALHO/MODELO/CODIGO/DIRETIVA).
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
  | 'POLITICA'
  | 'MANUAL'
  | 'PROCEDIMENTO'
  | 'FORMULARIO'
  | 'CONTRATO'
  | 'REGULAMENTO'
  | 'COMUNICADO'
  | 'CIRCULAR'
  | 'ORDEM_SERVICO'
  | 'LEGISLACAO'
  | 'INSTRUCAO_TRABALHO'
  | 'MODELO'
  | 'CODIGO'
  | 'DIRETIVA'
  | 'OTHER'
  | 'OUTRO';

// Categorias que o docs/biblioteca.md trata como "Documentos Corporativos"
// (normas, políticas, circulares, leis, ordens de serviço, procedimentos,
// formulários) — usadas para o filtro rápido do separador dedicado.
export const CORPORATE_DOC_CATEGORIES: DocCategory[] = [
  'POLITICA',
  'REGULAMENTO',
  'CIRCULAR',
  'ORDEM_SERVICO',
  'LEGISLACAO',
  'INSTRUCAO_TRABALHO',
  'PROCEDIMENTO',
  'MANUAL',
  'FORMULARIO',
  'MODELO',
  'CODIGO',
  'DIRETIVA',
  'COMUNICADO',
];

export type DocSensitivity =
  'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'SECRET';

// ACTIVE == "Publicado" (docs/biblioteca.md) — reaproveitado tal e qual do
// enum já existente para não duplicar o estado "em vigor" com um valor novo.
export type DocStatus =
  | 'DRAFT'
  | 'EM_REVISAO'
  | 'PENDENTE_APROVACAO'
  | 'APROVADO'
  | 'ACTIVE'
  | 'SUSPENSO'
  | 'EXPIRED'
  | 'SUBSTITUIDO'
  | 'ARCHIVED'
  | 'DELETED';

export interface DocPerson {
  id: number;
  fullName: string;
}

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
  // Backend (document-repository.service.ts findAll/findOne) selecciona
  // sempre `fullName`, nunca `name` — corrigido aqui porque antes desta
  // extensão mostrava sempre "—" em Criado por/Proprietário (o tipo dizia
  // `name`, o backend nunca enviou esse campo).
  createdBy?: DocPerson;
  owner?: DocPerson;
  _count?: { versions: number; downloads: number };

  // ─── docs/biblioteca.md — "Documentos Corporativos" ────────────────────
  documentCode?: string;
  documentNumber?: string;
  elaboratedBy?: DocPerson;
  approver?: DocPerson;
  approvedAt?: string;
  effectiveAt?: string;
  reviewAt?: string;
  reviewPeriodicityMonths?: number;
  supersedes?: { id: number; title: string; documentCode?: string };
  relatedDocument?: { id: number; title: string; documentCode?: string };
  targetAudience: string[];
  requiresReadConfirmation: boolean;
  requiresAcknowledgement: boolean;
  readDeadlineDays?: number;
  versions?: DocVersionRow[];
}

export interface DocVersionRow {
  id: number;
  versionNumber: number;
  fileUrl: string;
  fileName?: string;
  changeDescription: string;
  createdAt: string;
  uploadedById: number;
}

export interface PendingRead {
  id: number;
  title: string;
  category: DocCategory;
  version: string;
  effectiveAt?: string;
  readDeadlineDays?: number;
  deadline?: string | null;
  overdue: boolean;
}

export interface ReadStatus {
  totalRequired: number;
  confirmedCount: number;
  percentage: number;
  pendingUsers: { id: number; fullName: string; email: string }[];
}

export interface ComplianceOverviewRow {
  id: number;
  title: string;
  category: DocCategory;
  totalRequired: number;
  confirmedCount: number;
  percentage: number;
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
  status?: DocStatus | '';
  requiresReadConfirmation?: boolean;
}

export type ViewMode = 'grid' | 'list';
