// components/trainings/constants.ts
// Mapas de tipo/nível/participante, navegação e títulos do módulo.
// Extraído de app/(platform)/trainings/page.tsx.
//
// TYPE_CFG/LEVEL_CFG/PARTICIPANT_CFG usam os tokens semânticos da
// fundação de design (Fase A) — mesmo padrão de TOKEN usado em
// components/reports/constants.ts e components/executive-reports/constants.ts.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  ParticipantStatus,
  TrainingLevel,
  TrainingType,
  View,
} from './types';

const TOKEN = {
  primary: { color: 'text-primary', bg: 'bg-primary-subtle' },
  success: { color: 'text-success-ink', bg: 'bg-success-subtle' },
  warning: { color: 'text-warning-ink', bg: 'bg-warning-subtle' },
  danger: { color: 'text-danger-ink', bg: 'bg-danger-subtle' },
  info: { color: 'text-info-ink', bg: 'bg-info-subtle' },
  neutral: { color: 'text-ink-muted', bg: 'bg-surface-sunken' },
} as const;

const cls = (t: (typeof TOKEN)[keyof typeof TOKEN]) => `${t.bg} ${t.color}`;

export const TYPE_CFG: Record<
  TrainingType,
  { label: string; icon: string; cls: string }
> = {
  PRESENTIAL: { label: 'Presencial', icon: '🏫', cls: cls(TOKEN.info) },
  ONLINE: { label: 'Online', icon: '💻', cls: cls(TOKEN.primary) },
  HYBRID: { label: 'Híbrido', icon: '🔀', cls: cls(TOKEN.warning) },
};

export const LEVEL_CFG: StatusBadgeMap<TrainingLevel> = {
  BEGINNER: { label: 'Básico', cls: cls(TOKEN.success) },
  INTERMEDIATE: { label: 'Intermédio', cls: cls(TOKEN.warning) },
  ADVANCED: { label: 'Avançado', cls: cls(TOKEN.danger) },
};

export const PARTICIPANT_CFG: StatusBadgeMap<ParticipantStatus> = {
  WAITLIST: { label: 'Lista espera', cls: cls(TOKEN.neutral) },
  REGISTERED: { label: 'Inscrito', cls: cls(TOKEN.info) },
  ATTENDED: { label: 'Presente', cls: cls(TOKEN.success) },
  ABSENT: { label: 'Ausente', cls: cls(TOKEN.danger) },
  CANCELLED: {
    label: 'Cancelado',
    cls: 'bg-surface-sunken text-ink-faint',
  },
  COMPLETED: { label: 'Concluído', cls: cls(TOKEN.success) },
};

export const NAV = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'my-trainings', label: 'Os meus treinamentos' },
  { id: 'dashboard', label: 'Dashboard (Admin)' },
] as const;

export type NavId = (typeof NAV)[number]['id'];

export const TITLES: Record<View, string> = {
  catalog: 'Treinamentos',
  detail: 'Detalhe',
  'my-trainings': 'Os meus treinamentos',
  dashboard: 'Dashboard',
};
