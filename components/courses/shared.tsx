// components/courses/shared.tsx
// Helpers e componentes de apresentação partilhados entre CourseCard,
// CatalogView, CourseDetail(View), MyEnrollmentsView e AdminDashboardView —
// todos em app/(platform)/courses/page.tsx, excepto CourseDetailView que
// vive em components/courses/CourseDetailView.tsx.
// Ver memory project_innova_component_separation_audit, item 3.6.
//
// Migrado para a fundação de design: mapas de badge passam a tokens
// semânticos (ver components/enrollments/constants.ts para o mesmo
// padrão), EnrollBadge passa a compor StatusBadge da fundação, skeleton
// local passa a usar as classes de token do Skeleton partilhado.

import {
  AlertTriangle,
  Play,
  FileText,
  PenLine,
  Music,
  BarChart3,
  Link2,
  Package,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type {
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
  LessonType,
} from './types';

export function fmtDuration(h: number | null, minutes?: number | null): string {
  if (minutes)
    return minutes < 60
      ? `${minutes}min`
      : `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  if (!h) return '—';
  return `${h}h`;
}

export function isOverdue(deadline: string | null): boolean {
  return !!deadline && new Date() > new Date(deadline);
}

export const COURSE_LEVEL_MAP: StatusBadgeMap<CourseLevel> = {
  BEGINNER: { label: 'Iniciante', cls: 'bg-success-subtle text-success-ink' },
  INTERMEDIATE: {
    label: 'Intermédio',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  ADVANCED: { label: 'Avançado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const COURSE_STATUS_MAP: StatusBadgeMap<CourseStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-success-subtle text-success-ink' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-surface-sunken text-ink-faint' },
};

const ENROLLMENT_STATUS_MAP: StatusBadgeMap<EnrollmentStatus> = {
  NOT_STARTED: {
    label: 'Não iniciado',
    cls: 'bg-surface-sunken text-ink-muted',
  },
  IN_PROGRESS: { label: 'Em progresso', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success-subtle text-success-ink' },
  EXPIRED: { label: 'Expirado', cls: 'bg-danger-subtle text-danger-ink' },
};

export interface EnrollBadgeProps {
  status: EnrollmentStatus;
  deadline: string | null;
}

export function EnrollBadge({ status, deadline }: EnrollBadgeProps) {
  const overdue = isOverdue(deadline);
  return (
    <div className="flex items-center gap-1.5">
      <StatusBadge value={status} map={ENROLLMENT_STATUS_MAP} variant="dot" />
      {overdue && status !== 'COMPLETED' && (
        <span className="flex items-center gap-1 text-xs font-medium text-danger">
          <AlertTriangle size={12} strokeWidth={1.75} />
          Prazo expirado
        </span>
      )}
    </div>
  );
}

export interface LessonIconProps {
  type: LessonType;
}

export function LessonIcon({ type }: LessonIconProps) {
  const icons: Record<LessonType, LucideIcon> = {
    VIDEO: Play,
    PDF: FileText,
    TEXT: PenLine,
    AUDIO: Music,
    SLIDE: BarChart3,
    LINK: Link2,
    SCORM: Package,
    QUIZ: HelpCircle,
  };
  const Icon = icons[type] ?? FileText;
  return <Icon size={14} strokeWidth={1.75} className="inline" />;
}

export interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="h-28 bg-surface-sunken rounded-card"
    />
  );
}
