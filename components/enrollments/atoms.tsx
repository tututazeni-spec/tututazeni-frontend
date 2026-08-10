// components/enrollments/atoms.tsx
// Átomos partilhados: skeleton, badges de estado/origem, barra de
// progresso, pílula de deadline e avatar. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import Image from 'next/image';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials } from '@/lib/format';
import { deadlineCountdown } from './utils';
import type { EnrollmentOrigin, EnrollmentStatus } from './types';

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-16 bg-gray-100 rounded-xl"
    />
  );
}

interface StatusBadgeProps {
  status: EnrollmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg: Record<
    EnrollmentStatus,
    { label: string; cls: string; dot: string }
  > = {
    NOT_STARTED: {
      label: 'Não iniciado',
      cls: 'bg-gray-100 text-gray-500',
      dot: 'bg-gray-400',
    },
    IN_PROGRESS: {
      label: 'Em progresso',
      cls: 'bg-blue-50 text-blue-700',
      dot: 'bg-blue-500',
    },
    COMPLETED: {
      label: 'Concluído',
      cls: 'bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
    },
    OVERDUE: {
      label: 'Atrasado',
      cls: 'bg-red-50 text-red-700',
      dot: 'bg-red-500',
    },
    EXPIRED: {
      label: 'Expirado',
      cls: 'bg-orange-50 text-orange-700',
      dot: 'bg-orange-500',
    },
    CANCELLED: {
      label: 'Cancelado',
      cls: 'bg-gray-100 text-gray-400',
      dot: 'bg-gray-300',
    },
  };
  const { label, cls, dot } = cfg[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

interface OriginBadgeProps {
  origin: EnrollmentOrigin;
}

export function OriginBadge({ origin }: OriginBadgeProps) {
  const labels: Record<EnrollmentOrigin, string> = {
    MANUAL: 'Manual',
    SELF_ENROLL: 'Auto-inscrição',
    LEARNING_PATH: 'Trilha',
    ONBOARDING: 'Onboarding',
    RULE_ENGINE: 'Automático',
    CAMPAIGN: 'Campanha',
  };
  return <span className="text-xs text-gray-400">{labels[origin]}</span>;
}

interface ProgressBarProps {
  pct: number;
  overdue: boolean;
}

export function ProgressBar({ pct, overdue }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${overdue ? 'bg-red-400' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

interface DeadlinePillProps {
  deadline: string | null;
  isOverdue: boolean;
}

export function DeadlinePill({ deadline, isOverdue }: DeadlinePillProps) {
  if (!deadline) return null;
  const countdown = deadlineCountdown(deadline);
  const urgent =
    !isOverdue &&
    ['Hoje', 'Amanhã', '2 dias', '3 dias'].some((d) =>
      countdown.includes(d.split(' ')[0]),
    );
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        isOverdue
          ? 'bg-red-50 text-red-700'
          : urgent
            ? 'bg-amber-50 text-amber-700'
            : 'bg-gray-100 text-gray-500'
      }`}
    >
      {isOverdue ? '⚠ ' : '⏳ '}
      {countdown}
    </span>
  );
}

interface AvatarProps {
  user: { fullName: string; avatarUrl: string | null };
}

export function Avatar({ user }: AvatarProps) {
  const initials = getInitials(user.fullName);
  return user.avatarUrl ? (
    <Image
      src={user.avatarUrl}
      alt={user.fullName}
      width={32}
      height={32}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}
