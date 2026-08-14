// components/documents/constants.ts
// Mapas de categoria/sensibilidade/mime-type + filtros iniciais.
// Extraído de app/(platform)/documents/page.tsx. Migrado para a fundação de
// design: CATEGORY_CONFIG passa de `{ label, color }` (classes Tailwind
// cruas) para `{ label, intent, dot }` — `intent` é consumido directamente
// pelo Badge da fundação (components/ui/Badge), `dot` é um swatch sólido de
// token para o indicador de cor da Sidebar. SENSITIVITY_CONFIG mantém a
// forma `{ label, icon, color }` (não é renderizado como Badge, é
// ícone+texto inline) mas `color` passa a classe de texto de token.

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
import type { BadgeProps } from '@/components/ui/Badge';
import type { DocCategory, DocFilters, DocSensitivity } from './types';

export const CATEGORY_CONFIG: Record<
  DocCategory,
  { label: string; intent: NonNullable<BadgeProps['intent']>; dot: string }
> = {
  PERSONAL: { label: 'Pessoal', intent: 'info', dot: 'bg-info' },
  LABOUR: { label: 'Trabalhista', intent: 'warning', dot: 'bg-warning' },
  LEARNING: { label: 'Aprendizagem', intent: 'info', dot: 'bg-info' },
  CORPORATE: { label: 'Corporativo', intent: 'neutral', dot: 'bg-ink-faint' },
  RECRUITMENT: { label: 'Recrutamento', intent: 'info', dot: 'bg-info' },
  COMPLIANCE: { label: 'Compliance', intent: 'danger', dot: 'bg-danger' },
  HEALTH: { label: 'Saúde', intent: 'success', dot: 'bg-success' },
  PAYROLL: { label: 'Payroll', intent: 'success', dot: 'bg-success' },
  LEAVE: { label: 'Licença', intent: 'warning', dot: 'bg-warning' },
  OTHER: { label: 'Outro', intent: 'neutral', dot: 'bg-ink-faint' },
};

export const SENSITIVITY_CONFIG: Record<
  DocSensitivity,
  { label: string; icon: LucideIcon; color: string }
> = {
  PUBLIC: { label: 'Público', icon: CheckCircle2, color: 'text-success-ink' },
  INTERNAL: { label: 'Interno', icon: FileText, color: 'text-info-ink' },
  CONFIDENTIAL: {
    label: 'Confidencial',
    icon: Lock,
    color: 'text-warning-ink',
  },
  RESTRICTED: { label: 'Restrito', icon: Shield, color: 'text-danger-ink' },
  SECRET: { label: 'Secreto', icon: Shield, color: 'text-danger' },
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
