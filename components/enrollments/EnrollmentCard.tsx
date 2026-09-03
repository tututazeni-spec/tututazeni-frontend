// components/enrollments/EnrollmentCard.tsx
// Cartão de matrícula na vista do learner. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import Image from 'next/image';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  BookOpen,
  Hourglass,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CARD_BORDER_CFG, STATUS_CFG } from './constants';
import { deadlineCountdown, deadlineIntent } from './utils';
import type { Enrollment } from './types';

interface EnrollmentCardProps {
  enrollment: Enrollment;
  onCancel?: (id: number) => void;
}

export function EnrollmentCard({ enrollment, onCancel }: EnrollmentCardProps) {
  const {
    course,
    status,
    mandatory,
    isOverdue,
    progressPercent,
    completedLessons,
    totalLessons,
    deadline,
  } = enrollment;

  const borderCls = isOverdue
    ? 'border-danger'
    : (CARD_BORDER_CFG[status] ?? 'border-border');

  return (
    <div
      className={`overflow-hidden rounded-card border bg-surface transition-all ${borderCls}`}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-control bg-surface-sunken">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-faint">
              <BookOpen size={22} strokeWidth={1.75} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <div className="mb-0.5 flex items-center gap-2">
                {mandatory && (
                  <Badge intent="danger" className="px-1.5 py-0">
                    Obrigatório
                  </Badge>
                )}
                {course.category && (
                  <span className="text-xs text-ink-faint">
                    {course.category}
                  </span>
                )}
              </div>
              <div className="line-clamp-1 text-sm font-medium text-ink">
                {course.title}
              </div>
            </div>
            <StatusBadge value={status} map={STATUS_CFG} variant="dot" />
          </div>

          {/* Progress */}
          {status !== 'NOT_STARTED' &&
            status !== 'CANCELLED' &&
            totalLessons > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar value={progressPercent} />
                  </div>
                  <span
                    className={`w-8 text-right font-mono text-xs ${isOverdue ? 'text-danger' : 'text-ink-muted'}`}
                  >
                    {progressPercent}%
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-ink-faint">
                  {completedLessons}/{totalLessons} aulas
                </div>
              </div>
            )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {deadline && (
                <Badge intent={deadlineIntent(deadline, isOverdue)}>
                  {isOverdue ? (
                    <AlertTriangle
                      size={12}
                      strokeWidth={1.75}
                      className="inline mr-1"
                    />
                  ) : (
                    <Hourglass
                      size={12}
                      strokeWidth={1.75}
                      className="inline mr-1"
                    />
                  )}
                  {deadlineCountdown(deadline)}
                </Badge>
              )}
              {enrollment.certificate && (
                <span className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-success-subtle text-success-ink">
                  <Award size={14} strokeWidth={1.75} />
                  Certificado
                </span>
              )}
            </div>

            {/* CTA button */}
            <div>
              {status === 'NOT_STARTED' && (
                <a
                  href={`/courses/${enrollment.courseId}/learn`}
                  className={buttonVariants({ intent: 'primary', size: 'sm' })}
                >
                  Iniciar →
                </a>
              )}
              {status === 'IN_PROGRESS' && (
                <a
                  href={`/courses/${enrollment.courseId}/learn`}
                  className={buttonVariants({ intent: 'primary', size: 'sm' })}
                >
                  Continuar →
                </a>
              )}
              {status === 'OVERDUE' && (
                <a
                  href={`/courses/${enrollment.courseId}/learn`}
                  className={buttonVariants({ intent: 'danger', size: 'sm' })}
                >
                  <AlertTriangle size={14} strokeWidth={1.75} />
                  Iniciar agora →
                </a>
              )}
              {status === 'COMPLETED' && (
                <span className="flex items-center gap-1 text-xs font-medium text-success-ink">
                  <CheckCircle2 size={14} strokeWidth={1.75} />
                  Concluído
                </span>
              )}
              {!mandatory &&
                status !== 'COMPLETED' &&
                status !== 'CANCELLED' &&
                onCancel && (
                  <button
                    onClick={() => onCancel(enrollment.id)}
                    className="ml-2 text-xs text-ink-faint hover:text-danger"
                  >
                    Cancelar
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
