// components/courses/shared.tsx
// Helpers e componentes de apresentação partilhados entre CourseCard,
// CatalogView, CourseDetail(View), MyEnrollmentsView e AdminDashboardView —
// todos em app/(platform)/courses/page.tsx, excepto CourseDetailView que
// vive em components/courses/CourseDetailView.tsx.
// Ver memory project_innova_component_separation_audit, item 3.6.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
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
  BEGINNER: { label: 'Iniciante', cls: 'bg-emerald-50 text-emerald-700' },
  INTERMEDIATE: { label: 'Intermédio', cls: 'bg-amber-50 text-amber-700' },
  ADVANCED: { label: 'Avançado', cls: 'bg-red-50 text-red-700' },
};

export const COURSE_STATUS_MAP: StatusBadgeMap<CourseStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-emerald-50 text-emerald-700' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-gray-100 text-gray-400' },
};

export function EnrollBadge({
  status,
  deadline,
}: {
  status: EnrollmentStatus;
  deadline: string | null;
}) {
  const overdue = isOverdue(deadline);
  const cfg: Record<EnrollmentStatus, { label: string; cls: string }> = {
    NOT_STARTED: { label: 'Não iniciado', cls: 'bg-gray-100 text-gray-500' },
    IN_PROGRESS: { label: 'Em progresso', cls: 'bg-blue-50 text-blue-700' },
    COMPLETED: { label: 'Concluído', cls: 'bg-emerald-50 text-emerald-700' },
    EXPIRED: { label: 'Expirado', cls: 'bg-red-50 text-red-600' },
  };
  const { label, cls } = cfg[status];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
        {label}
      </span>
      {overdue && status !== 'COMPLETED' && (
        <span className="text-xs text-red-600 font-medium">
          ⚠ Prazo expirado
        </span>
      )}
    </div>
  );
}

export function LessonIcon({ type }: { type: LessonType }) {
  const icons: Record<LessonType, string> = {
    VIDEO: '▶',
    PDF: '📄',
    TEXT: '📝',
    AUDIO: '🎵',
    SLIDE: '📊',
    LINK: '🔗',
    SCORM: '📦',
    QUIZ: '❓',
  };
  return <span className="text-sm">{icons[type] ?? '📄'}</span>;
}

export function ProgressBar({
  pct,
  size = 'sm',
}: {
  pct: number;
  size?: 'sm' | 'md';
}) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className={`w-full ${h} bg-gray-100 rounded-full overflow-hidden`}>
      <div
        className={`${h} bg-blue-600 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="h-28 bg-gray-100 rounded-xl"
    />
  );
}
