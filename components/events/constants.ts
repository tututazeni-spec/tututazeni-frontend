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
  EventModalidade,
  EventStatus,
  EventType,
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
};

export const NAV = [
  { id: 'catalog', label: ' Catálogo' },
  { id: 'my-events', label: ' Os meus eventos' },
  { id: 'organizer', label: ' Organizador' },
] as const;

export const TITLES: Record<View, string> = {
  catalog: 'Eventos Corporativos',
  'my-events': 'Os meus Eventos',
  detail: 'Detalhe do Evento',
  organizer: 'Dashboard Organizador',
  create: 'Criar Evento',
};

/** Tom do indicador de ocupação (dot + texto) — 3 níveis, mesmos limiares
 * usados antes na cor da barra de ocupação do EventCard. */
export function occupancyDotCls(rate: number | null): string {
  if (rate === null) return 'bg-ink-faint';
  if (rate >= 90) return 'bg-danger';
  if (rate >= 70) return 'bg-warning';
  return 'bg-success';
}
