// components/events/constants.ts
// Mapas de tipo/modalidade/estado do evento, navegação e títulos do
// módulo. Extraído de app/(platform)/events/page.tsx. Migrado para a
// fundação de design: `cls` passa das classes Tailwind cruas para os
// tokens semânticos (Fase A). TYPE_CFG ganha `barCls` — cor sólida do
// indicador de topo do EventCard, antes inferida de forma frágil (e
// incompleta) a partir de `cls.includes('blue')` etc.; agora é um mapa
// directo e exaustivo por tipo.

import {
  BookOpen,
  Wrench,
  Laptop,
  GraduationCap,
  Zap,
  Users,
  Building2,
  Rocket,
  Handshake,
  Globe,
  Mic,
  type LucideIcon,
} from 'lucide-react';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  EventCommunicationChannel,
  EventCommunicationStatus,
  EventCommunicationType,
  EventEquipmentType,
  EventLogisticsStatus,
  EventModalidade,
  EventSessionStatus,
  EventSpeakerStatus,
  EventSpeakerType,
  EventStatus,
  EventType,
  EventVisibility,
  ParticipantStatus,
  View,
} from './types';

export const TYPE_CFG: Record<
  EventType,
  { icon: LucideIcon; label: string; cls: string; barCls: string }
> = {
  TRAINING: {
    icon: BookOpen,
    label: 'Treinamento',
    cls: 'bg-info-subtle text-info-ink',
    barCls: 'bg-info',
  },
  WORKSHOP: {
    icon: Wrench,
    label: 'Workshop',
    cls: 'bg-warning-subtle text-warning-ink',
    barCls: 'bg-warning',
  },
  WEBINAR: {
    icon: Laptop,
    label: 'Seminário Online',
    cls: 'bg-accent-subtle text-accent',
    barCls: 'bg-accent',
  },
  LIVE_CLASS: {
    icon: GraduationCap,
    label: 'Aula ao vivo',
    cls: 'bg-success-subtle text-success-ink',
    barCls: 'bg-success',
  },
  HACKATHON: {
    icon: Zap,
    label: 'Maratona de Inovação',
    cls: 'bg-danger-subtle text-danger-ink',
    barCls: 'bg-danger',
  },
  MENTORING: {
    icon: Users,
    label: 'Mentoria',
    cls: 'bg-primary-subtle text-primary',
    barCls: 'bg-primary',
  },
  CORPORATE: {
    icon: Building2,
    label: 'Corporativo',
    cls: 'bg-surface-sunken text-ink-muted',
    barCls: 'bg-ink-faint',
  },
  ONBOARDING: {
    icon: Rocket,
    label: 'Integração e Acolhimento',
    cls: 'bg-info-subtle text-info-ink',
    barCls: 'bg-info',
  },
  NETWORKING: {
    icon: Handshake,
    label: 'Networking',
    cls: 'bg-primary-subtle text-primary',
    barCls: 'bg-primary',
  },
  EXTERNAL: {
    icon: Globe,
    label: 'Evento externo',
    cls: 'bg-warning-subtle text-warning-ink',
    barCls: 'bg-warning',
  },
  TALK: {
    icon: Mic,
    label: 'Palestra',
    cls: 'bg-accent-subtle text-accent',
    barCls: 'bg-accent',
  },
};

export const MODALITY_CFG: Record<EventModalidade, { label: string }> = {
  ONLINE: { label: 'Online' },
  PRESENCIAL: { label: 'Presencial' },
  HYBRID: { label: 'Híbrido' },
};

export const VISIBILITY_CFG: Record<EventVisibility, { label: string }> = {
  PUBLIC: { label: 'Público' },
  INTERNAL: { label: 'Interno' },
  RESTRICTED: { label: 'Restrito (departamentos elegíveis)' },
};

export const STATUS_CFG: StatusBadgeMap<EventStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-info-subtle text-info-ink' },
  LIVE: { label: 'Ao vivo', cls: 'bg-danger-subtle text-danger-ink' },
  ENDED: { label: 'Encerrado', cls: 'bg-surface-sunken text-ink-faint' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-danger-subtle text-danger' },
};

export const PARTICIPANT_STATUS: StatusBadgeMap<ParticipantStatus> = {
  PENDING: { label: 'Pendente', cls: 'bg-warning-subtle text-warning-ink' },
  CONFIRMED: {
    label: 'Confirmado ✓',
    cls: 'bg-success-subtle text-success-ink',
  },
  WAITLIST: { label: 'Lista de espera', cls: 'bg-info-subtle text-info-ink' },
  PRESENT: { label: 'Presente', cls: 'bg-success-subtle text-success-ink' },
  ABSENT: { label: 'Ausente', cls: 'bg-danger-subtle text-danger-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-faint' },
  NO_SHOW: { label: 'Não apareceu', cls: 'bg-danger-subtle text-danger-ink' },
  REJECTED: { label: 'Rejeitado', cls: 'bg-danger-subtle text-danger' },
};

export const SESSION_STATUS_CFG: StatusBadgeMap<EventSessionStatus> = {
  SCHEDULED: { label: 'Agendada', cls: 'bg-info-subtle text-info-ink' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-danger-subtle text-danger-ink' },
  COMPLETED: { label: 'Concluída', cls: 'bg-success-subtle text-success-ink' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-surface-sunken text-ink-faint' },
};

export const LOGISTICS_STATUS_CFG: StatusBadgeMap<EventLogisticsStatus> = {
  PLANNED: { label: 'Planeado', cls: 'bg-surface-sunken text-ink-muted' },
  IN_PROGRESS: { label: 'Em preparação', cls: 'bg-warning-subtle text-warning-ink' },
  CONFIRMED: { label: 'Confirmado', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success-subtle text-success-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const EQUIPMENT_CFG: Record<EventEquipmentType, { label: string }> = {
  PROJECTOR: { label: 'Projetor' },
  SCREEN: { label: 'Ecrã' },
  SOUND_SYSTEM: { label: 'Sistema de som' },
  MICROPHONES: { label: 'Microfones' },
  CHAIRS: { label: 'Cadeiras' },
  TABLES: { label: 'Mesas' },
  COMPUTERS: { label: 'Computadores' },
  INTERNET: { label: 'Internet' },
  MATERIALS: { label: 'Materiais' },
  SIGNAGE: { label: 'Sinalização' },
};

export const SPEAKER_TYPE_CFG: Record<EventSpeakerType, { label: string }> = {
  SPEAKER: { label: 'Orador' },
  LECTURER: { label: 'Palestrante' },
  MODERATOR: { label: 'Moderador' },
  GUEST: { label: 'Convidado' },
  PANELIST: { label: 'Painelista' },
  FACILITATOR: { label: 'Facilitador' },
  INSTITUTIONAL_REP: { label: 'Representante institucional' },
};

export const SPEAKER_STATUS_CFG: StatusBadgeMap<EventSpeakerStatus> = {
  INVITED: { label: 'Convidado', cls: 'bg-info-subtle text-info-ink' },
  CONFIRMED: { label: 'Confirmado', cls: 'bg-success-subtle text-success-ink' },
  DECLINED: { label: 'Recusado', cls: 'bg-danger-subtle text-danger-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-faint' },
};

export const COMMUNICATION_TYPE_CFG: Record<EventCommunicationType, { label: string }> = {
  INVITATION: { label: 'Convite' },
  CONFIRMATION: { label: 'Confirmação' },
  REMINDER: { label: 'Lembrete' },
  TIME_CHANGE: { label: 'Alteração de horário' },
  LOCATION_CHANGE: { label: 'Alteração de local' },
  CANCELLATION: { label: 'Cancelamento' },
  INSTRUCTIONS: { label: 'Instruções' },
  THANK_YOU: { label: 'Agradecimento' },
  FOLLOW_UP: { label: 'Follow-up' },
};

export const COMMUNICATION_CHANNEL_CFG: Record<EventCommunicationChannel, { label: string }> = {
  INNOVA_NOTIFICATION: { label: 'Notificação INNOVA' },
  EMAIL: { label: 'E-mail' },
  SMS: { label: 'SMS' },
  WHATSAPP: { label: 'WhatsApp' },
};

export const COMMUNICATION_STATUS_CFG: StatusBadgeMap<EventCommunicationStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  SENT: { label: 'Enviado', cls: 'bg-success-subtle text-success-ink' },
  FAILED: { label: 'Falhou', cls: 'bg-danger-subtle text-danger-ink' },
};

// Abas principais do módulo (docs/events.md) — remodel em curso, uma aba
// de cada vez. CatalogView/MyEventsView/OrganizerView/DetailView (nav
// anterior: catálogo/os meus eventos/organizador) ficam por agora sem
// referência a partir da page; o conteúdo real de cada aba entra quando
// a tarefa correspondente do events.md for trabalhada.
export const NAV = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'events', label: 'Eventos' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'participants', label: 'Participantes' },
  { id: 'schedule', label: 'Programação' },
  { id: 'venues-logistics', label: 'Locais & Logística' },
  { id: 'speakers-guests', label: 'Oradores & Convidados' },
  { id: 'communication', label: 'Comunicação' },
  { id: 'checkin-attendance', label: 'Check-in & Presença' },
  { id: 'evaluation', label: 'Avaliação' },
  { id: 'reports', label: 'Relatórios' },
] as const;

export const TITLES: Record<View, string> = {
  overview: 'Visão Geral',
  events: 'Eventos',
  calendar: 'Calendário',
  participants: 'Participantes',
  schedule: 'Programação',
  'venues-logistics': 'Locais & Logística',
  'speakers-guests': 'Oradores & Convidados',
  communication: 'Comunicação',
  'checkin-attendance': 'Check-in & Presença',
  evaluation: 'Avaliação',
  reports: 'Relatórios',
};

/** Tom do indicador de ocupação (dot + texto) — 3 níveis, mesmos limiares
 * usados antes na cor da barra de ocupação do EventCard. */
export function occupancyDotCls(rate: number | null): string {
  if (rate === null) return 'bg-ink-faint';
  if (rate >= 90) return 'bg-danger';
  if (rate >= 70) return 'bg-warning';
  return 'bg-success';
}
