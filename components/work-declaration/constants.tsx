// components/work-declaration/constants.tsx
// Mapas de labels/ícones por status e tipo de declaração. Extraído
// de app/(platform)/work-declaration/page.tsx. Ficheiro .tsx porque
// STATUS_META inclui ícones JSX (React.ReactNode), tal como no
// original.

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import type { DeclarationStatus, DeclarationType } from './types';

export const STATUS_META: Record<
  DeclarationStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'Rascunho',
    color: 'text-slate-400',
    bg: 'bg-slate-800/60',
    icon: <Clock size={12} />,
  },
  issued: {
    label: 'Emitida',
    color: 'text-sky-400',
    bg: 'bg-sky-900/40',
    icon: <ArrowUpRight size={12} />,
  },
  signed: {
    label: 'Assinada',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/40',
    icon: <CheckCircle size={12} />,
  },
  expired: {
    label: 'Expirada',
    color: 'text-amber-400',
    bg: 'bg-amber-900/40',
    icon: <AlertTriangle size={12} />,
  },
  revoked: {
    label: 'Revogada',
    color: 'text-red-400',
    bg: 'bg-red-900/40',
    icon: <XCircle size={12} />,
  },
};

export const TYPE_LABELS: Record<DeclarationType, string> = {
  employment: 'Vínculo Empregatício',
  training: 'Formação / Treino',
  attendance: 'Frequência',
  performance: 'Desempenho',
  custom: 'Personalizada',
};
