// components/enrollments/EnrollmentCard.tsx
// Cartão de matrícula na vista do learner. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import Image from 'next/image';
import { DeadlinePill, ProgressBar, StatusBadge } from './atoms';
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

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-all ${
        isOverdue
          ? 'border-red-200'
          : status === 'COMPLETED'
            ? 'border-emerald-200'
            : status === 'IN_PROGRESS'
              ? 'border-blue-200'
              : 'border-gray-200'
      }`}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
              📚
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {mandatory && (
                  <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0 rounded font-medium">
                    Obrigatório
                  </span>
                )}
                {course.category && (
                  <span className="text-xs text-gray-400">
                    {course.category}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-900 line-clamp-1">
                {course.title}
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Progress */}
          {status !== 'NOT_STARTED' &&
            status !== 'CANCELLED' &&
            totalLessons > 0 && (
              <div className="mb-2">
                <ProgressBar pct={progressPercent} overdue={isOverdue} />
                <div className="text-xs text-gray-400 mt-0.5">
                  {completedLessons}/{totalLessons} aulas
                </div>
              </div>
            )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DeadlinePill deadline={deadline} isOverdue={isOverdue} />
              {enrollment.certificate && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                  🏆 Certificado
                </span>
              )}
            </div>

            {/* CTA button */}
            <div>
              {status === 'NOT_STARTED' && (
                <a
                  href={`/courses/${enrollment.courseId}`}
                  className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800"
                >
                  Iniciar →
                </a>
              )}
              {status === 'IN_PROGRESS' && (
                <a
                  href={`/courses/${enrollment.courseId}`}
                  className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800"
                >
                  Continuar →
                </a>
              )}
              {status === 'OVERDUE' && (
                <a
                  href={`/courses/${enrollment.courseId}`}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                >
                  ⚠ Iniciar agora →
                </a>
              )}
              {status === 'COMPLETED' && (
                <span className="text-xs text-emerald-600 font-medium">
                  ✓ Concluído
                </span>
              )}
              {!mandatory &&
                status !== 'COMPLETED' &&
                status !== 'CANCELLED' &&
                onCancel && (
                  <button
                    onClick={() => onCancel(enrollment.id)}
                    className="ml-2 text-xs text-gray-400 hover:text-red-500"
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
