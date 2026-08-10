// components/learning-paths/MyPathsView.tsx
// Separador "As minhas trilhas" — matrículas filtráveis por estado.
// Dados próprios + apresentação. Extraído de
// app/(platform)/learning-paths/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Skeleton, TypeBadge } from './atoms';
import { isOverdue } from './utils';
import type { MyLPEnrollment } from './types';

interface MyPathsViewProps {
  onSelect: (id: number) => void;
}

export function MyPathsView({ onSelect }: MyPathsViewProps) {
  const [filter, setFilter] = useState('');

  const { data = [], isLoading } = useApiQuery<MyLPEnrollment[]>(
    queryKeys.learningPaths.myEnrollments(),
    '/learning-paths/my/enrollments',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const filtered = filter ? data.filter((e) => e.status === filter) : data;

  if (isLoading) return <Skeleton />;

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
                '': 'Todas',
                NOT_STARTED: 'Não iniciadas',
                IN_PROGRESS: 'Em progresso',
                COMPLETED: 'Concluídas',
              }[s]
            }
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem trilhas encontradas
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(e.learningPathId)}
            >
              <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center relative">
                {e.learningPath?.thumbnailUrl ? (
                  <Image
                    src={e.learningPath.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover opacity-80"
                  />
                ) : (
                  <span className="text-2xl">🗺️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {e.learningPath?.title}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {e.learningPath?.pathType && (
                    <TypeBadge type={e.learningPath.pathType} />
                  )}
                  <span>📚 {e.learningPath?._count?.courses ?? 0} cursos</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div
                  className={`text-sm font-medium ${
                    e.status === 'COMPLETED'
                      ? 'text-emerald-600'
                      : e.status === 'IN_PROGRESS'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                  }`}
                >
                  {e.status === 'COMPLETED'
                    ? '✓ Concluído'
                    : e.status === 'IN_PROGRESS'
                      ? 'Em progresso'
                      : 'Não iniciado'}
                </div>
                {e.deadline && (
                  <div
                    className={`text-xs ${isOverdue(e.deadline) ? 'text-red-600' : 'text-gray-400'}`}
                  >
                    {isOverdue(e.deadline)
                      ? '⚠ Prazo expirado'
                      : `Prazo: ${fmtDate(e.deadline)}`}
                  </div>
                )}
                {e.mandatory && (
                  <div className="text-xs text-red-600 font-medium">
                    Obrigatório
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
