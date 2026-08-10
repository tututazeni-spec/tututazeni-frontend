// components/trainings/constants.ts
// Mapas de tipo/nível/participante, navegação e títulos do módulo.
// Extraído de app/(platform)/trainings/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  ParticipantStatus,
  TrainingLevel,
  TrainingType,
  View,
} from './types';

export const TYPE_CFG: Record<
  TrainingType,
  { label: string; icon: string; cls: string }
> = {
  PRESENTIAL: {
    label: 'Presencial',
    icon: '🏫',
    cls: 'bg-blue-50 text-blue-700',
  },
  ONLINE: { label: 'Online', icon: '💻', cls: 'bg-purple-50 text-purple-700' },
  HYBRID: { label: 'Híbrido', icon: '🔀', cls: 'bg-amber-50 text-amber-700' },
};

export const LEVEL_CFG: StatusBadgeMap<TrainingLevel> = {
  BEGINNER: { label: 'Básico', cls: 'bg-emerald-50 text-emerald-700' },
  INTERMEDIATE: { label: 'Intermédio', cls: 'bg-amber-50 text-amber-700' },
  ADVANCED: { label: 'Avançado', cls: 'bg-red-50 text-red-700' },
};

export const PARTICIPANT_CFG: StatusBadgeMap<ParticipantStatus> = {
  WAITLIST: { label: 'Lista espera', cls: 'bg-gray-100 text-gray-500' },
  REGISTERED: { label: 'Inscrito', cls: 'bg-blue-50 text-blue-700' },
  ATTENDED: { label: 'Presente', cls: 'bg-emerald-50 text-emerald-700' },
  ABSENT: { label: 'Ausente', cls: 'bg-red-50 text-red-700' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-400' },
  COMPLETED: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-800' },
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
