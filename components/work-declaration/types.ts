// components/work-declaration/types.ts
// Tipos do domínio de declarações de trabalho. Extraído de
// app/(platform)/work-declaration/page.tsx.

export type DeclarationStatus =
  'draft' | 'issued' | 'signed' | 'expired' | 'revoked';
export type DeclarationType =
  'employment' | 'training' | 'attendance' | 'performance' | 'custom';

export interface Declaration {
  id: string;
  code: string;
  title: string;
  type: DeclarationType;
  status: DeclarationStatus;
  employeeName: string;
  employeeRole: string;
  department: string;
  createdAt: string;
  issuedAt?: string;
  expiresAt?: string;
  createdBy: string;
}

export interface Stats {
  total: number;
  draft: number;
  issued: number;
  signed: number;
  expiredOrRevoked: number;
}
