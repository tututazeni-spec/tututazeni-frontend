// components/documents/constants.ts
// Mapas de categoria/sensibilidade/mime-type + filtros iniciais.
// Extraído de app/(platform)/documents/page.tsx.

import {
  CheckCircle2,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Lock,
  Shield,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DocCategory, DocFilters, DocSensitivity } from './types';

export const CATEGORY_CONFIG: Record<
  DocCategory,
  { label: string; color: string }
> = {
  PERSONAL: { label: 'Pessoal', color: 'bg-blue-100 text-blue-700' },
  LABOUR: { label: 'Trabalhista', color: 'bg-amber-100 text-amber-700' },
  LEARNING: { label: 'Aprendizagem', color: 'bg-purple-100 text-purple-700' },
  CORPORATE: { label: 'Corporativo', color: 'bg-gray-100 text-gray-700' },
  RECRUITMENT: { label: 'Recrutamento', color: 'bg-cyan-100 text-cyan-700' },
  COMPLIANCE: { label: 'Compliance', color: 'bg-red-100 text-red-700' },
  HEALTH: { label: 'Saúde', color: 'bg-green-100 text-green-700' },
  PAYROLL: { label: 'Payroll', color: 'bg-emerald-100 text-emerald-700' },
  LEAVE: { label: 'Licença', color: 'bg-orange-100 text-orange-700' },
  OTHER: { label: 'Outro', color: 'bg-gray-100 text-gray-500' },
};

export const SENSITIVITY_CONFIG: Record<
  DocSensitivity,
  { label: string; icon: LucideIcon; color: string }
> = {
  PUBLIC: { label: 'Público', icon: CheckCircle2, color: 'text-emerald-600' },
  INTERNAL: { label: 'Interno', icon: FileText, color: 'text-blue-600' },
  CONFIDENTIAL: { label: 'Confidencial', icon: Lock, color: 'text-amber-600' },
  RESTRICTED: { label: 'Restrito', icon: Shield, color: 'text-orange-600' },
  SECRET: { label: 'Secreto', icon: Shield, color: 'text-red-600' },
};

export const MIME_ICONS: Record<string, LucideIcon> = {
  'application/pdf': FileText,
  'image/': Image,
  'video/': Video,
  'application/vnd': FileSpreadsheet,
};

export function getFileIcon(mimeType: string) {
  for (const [key, Icon] of Object.entries(MIME_ICONS)) {
    if (mimeType.startsWith(key)) return Icon;
  }
  return File;
}

export const INITIAL_DOC_FILTERS: DocFilters = {
  search: '',
  category: '',
  sensitivity: '',
  tag: '',
  expiringSoon: false,
};
