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
import type { DocCategory, DocFilters, DocSensitivity, DocStatus } from './types';

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
  POLITICA: { label: 'Política', intent: 'neutral', dot: 'bg-ink-faint' },
  MANUAL: { label: 'Manual', intent: 'info', dot: 'bg-info' },
  PROCEDIMENTO: { label: 'Procedimento', intent: 'info', dot: 'bg-info' },
  FORMULARIO: { label: 'Formulário', intent: 'neutral', dot: 'bg-ink-faint' },
  CONTRATO: { label: 'Contrato', intent: 'warning', dot: 'bg-warning' },
  REGULAMENTO: { label: 'Regulamento', intent: 'neutral', dot: 'bg-ink-faint' },
  COMUNICADO: { label: 'Comunicado', intent: 'info', dot: 'bg-info' },
  CIRCULAR: { label: 'Circular', intent: 'info', dot: 'bg-info' },
  ORDEM_SERVICO: { label: 'Ordem de Serviço', intent: 'warning', dot: 'bg-warning' },
  LEGISLACAO: { label: 'Lei / Regulamento', intent: 'danger', dot: 'bg-danger' },
  INSTRUCAO_TRABALHO: { label: 'Instrução de Trabalho', intent: 'info', dot: 'bg-info' },
  MODELO: { label: 'Modelo', intent: 'neutral', dot: 'bg-ink-faint' },
  CODIGO: { label: 'Código', intent: 'neutral', dot: 'bg-ink-faint' },
  DIRETIVA: { label: 'Diretiva', intent: 'warning', dot: 'bg-warning' },
  OTHER: { label: 'Outro', intent: 'neutral', dot: 'bg-ink-faint' },
  OUTRO: { label: 'Outro', intent: 'neutral', dot: 'bg-ink-faint' },
};

// Estados do documento (docs/biblioteca.md) — ACTIVE é rotulado "Publicado"
// (é o mesmo valor de sempre, só o rótulo muda consoante o contexto).
export const STATUS_CONFIG: Record<
  DocStatus,
  { label: string; intent: NonNullable<BadgeProps['intent']> }
> = {
  DRAFT: { label: 'Rascunho', intent: 'neutral' },
  EM_REVISAO: { label: 'Em revisão', intent: 'info' },
  PENDENTE_APROVACAO: { label: 'Pendente de aprovação', intent: 'warning' },
  APROVADO: { label: 'Aprovado', intent: 'info' },
  ACTIVE: { label: 'Publicado', intent: 'success' },
  SUSPENSO: { label: 'Suspenso', intent: 'warning' },
  EXPIRED: { label: 'Expirado', intent: 'danger' },
  SUBSTITUIDO: { label: 'Substituído', intent: 'neutral' },
  ARCHIVED: { label: 'Arquivado', intent: 'neutral' },
  DELETED: { label: 'Eliminado', intent: 'danger' },
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
