// components/events/constants.ts
// Mapas de tipo/modalidade/estado do evento, navegação e títulos do
// módulo. Extraído de app/(platform)/events/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  EventModalidade,
  EventStatus,
  EventType,
  ParticipantStatus,
  View,
} from './types';

export const TYPE_CFG: Record<
  EventType,
  { icon: string; label: string; cls: string }
> = {
  TRAINING: {
    icon: '📚',
    label: 'Treinamento',
    cls: 'bg-blue-50 text-blue-700',
  },
  WORKSHOP: { icon: '🛠', label: 'Workshop', cls: 'bg-amber-50 text-amber-700' },
  WEBINAR: {
    icon: '💻',
    label: 'Webinar',
    cls: 'bg-purple-50 text-purple-700',
  },
  LIVE_CLASS: {
    icon: '🎓',
    label: 'Aula ao vivo',
    cls: 'bg-emerald-50 text-emerald-700',
  },
  HACKATHON: { icon: '⚡', label: 'Hackathon', cls: 'bg-red-50 text-red-700' },
  MENTORING: { icon: '👥', label: 'Mentoria', cls: 'bg-pink-50 text-pink-700' },
  CORPORATE: {
    icon: '🏢',
    label: 'Corporativo',
    cls: 'bg-gray-100 text-gray-600',
  },
  ONBOARDING: {
    icon: '🚀',
    label: 'Onboarding',
    cls: 'bg-teal-50 text-teal-700',
  },
  NETWORKING: {
    icon: '🤝',
    label: 'Networking',
    cls: 'bg-indigo-50 text-indigo-700',
  },
  EXTERNAL: {
    icon: '🌐',
    label: 'Evento externo',
    cls: 'bg-orange-50 text-orange-700',
  },
  TALK: { icon: '🎤', label: 'Talk', cls: 'bg-violet-50 text-violet-700' },
};

export const MODALITY_CFG: Record<
  EventModalidade,
  { icon: string; label: string }
> = {
  ONLINE: { icon: '💻', label: 'Online' },
  PRESENCIAL: { icon: '🏢', label: 'Presencial' },
  HYBRID: { icon: '🔀', label: 'Híbrido' },
};

export const STATUS_CFG: StatusBadgeMap<EventStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-blue-50 text-blue-700' },
  LIVE: { label: 'Ao vivo 🔴', cls: 'bg-red-50 text-red-700' },
  ENDED: { label: 'Encerrado', cls: 'bg-gray-100 text-gray-400' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-red-50 text-red-500' },
};

export const PARTICIPANT_STATUS: StatusBadgeMap<ParticipantStatus> = {
  PENDING: { label: 'Pendente', cls: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Confirmado ✓', cls: 'bg-emerald-50 text-emerald-700' },
  WAITLIST: { label: 'Lista de espera', cls: 'bg-blue-50 text-blue-700' },
  PRESENT: { label: 'Presente ✅', cls: 'bg-emerald-50 text-emerald-700' },
  ABSENT: { label: 'Ausente', cls: 'bg-red-50 text-red-600' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-400' },
  NO_SHOW: { label: 'Não apareceu', cls: 'bg-red-100 text-red-700' },
};

export const NAV = [
  { id: 'catalog', label: '📅 Catálogo' },
  { id: 'my-events', label: '🎫 Os meus eventos' },
  { id: 'organizer', label: '📊 Organizador' },
] as const;

export const TITLES: Record<View, string> = {
  catalog: 'Eventos Corporativos',
  'my-events': 'Os meus Eventos',
  detail: 'Detalhe do Evento',
  organizer: 'Dashboard Organizador',
  create: 'Criar Evento',
};
