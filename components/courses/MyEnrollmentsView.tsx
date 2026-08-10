// components/courses/MyEnrollmentsView.tsx
// Vista "Os meus cursos": lista de matrículas filtrável por estado.
// Extraído de app/(platform)/courses/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { EnrollBadge, Skeleton, fmtDuration, isOverdue } from './shared';
import type { MyEnrollment } from './types';

interface MyEnrollmentsViewProps {
  onSelect: (id: number) => void;
}

export function MyEnrollmentsView({ onSelect }: MyEnrollmentsViewProps) {
  const [filter, setFilter] = useState('');

  const {
    data = [],
    isLoading: loading,
    error,
  } = useApiQuery<MyEnrollment[]>(
    queryKeys.courses.myEnrollments(),
    '/courses/my/enrollments',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const filtered = filter ? data.filter((e) => e.status === filter) : data;

  if (loading) return <Skeleton />;
  if (error) return <div className="text-sm text-red-500">{error.message}</div>;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {['', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === s
                ? 'bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {
              {
                '': 'Todos',
                NOT_STARTED: 'Não iniciados',
                IN_PROGRESS: 'Em progresso',
                COMPLETED: 'Concluídos',
              }[s]
            }
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem matrículas encontradas
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(e.courseId)}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                {e.course.thumbnailUrl ? (
                  <Image
                    src={e.course.thumbnailUrl}
                    alt=""
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
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {e.course.title}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                  {e.course.category && <span>{e.course.category}</span>}
                  {e.course.workloadHours && (
                    <span>⏱ {fmtDuration(e.course.workloadHours)}</span>
                  )}
                </div>
                <EnrollBadge status={e.status} deadline={e.deadline} />
              </div>
              {e.mandatory && (
                <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded flex-shrink-0">
                  Obrigatório
                </span>
              )}
              {e.deadline && (
                <div
                  className={`text-xs flex-shrink-0 ${isOverdue(e.deadline) ? 'text-red-600' : 'text-gray-400'}`}
                >
                  {isOverdue(e.deadline)
                    ? '⚠ Atrasado'
                    : `Prazo: ${fmtDate(e.deadline)}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
