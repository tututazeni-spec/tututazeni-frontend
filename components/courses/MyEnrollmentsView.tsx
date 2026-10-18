// components/courses/MyEnrollmentsView.tsx
// Vista "Meus cursos": grelha de CourseListCard (mesmo desenho do cartão de
// evento publicado) com estado, prazo e barra de progresso da inscrição.
// Filtros em "pílula" (segmented control).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { PeriodPills } from '@/components/ui/Pills';
import { CourseListCard } from './CourseListCard';
import { Skeleton, isOverdue } from './shared';
import type { MyEnrollment } from './types';

type FilterId = 'ALL' | 'MANDATORY' | 'IN_PROGRESS' | 'COMPLETED';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'MANDATORY', label: 'Obrigatórios' },
  { id: 'IN_PROGRESS', label: 'Em progresso' },
  { id: 'COMPLETED', label: 'Concluídos' },
];

function matchesFilter(e: MyEnrollment, filter: FilterId) {
  if (filter === 'ALL') return true;
  if (filter === 'MANDATORY') return Boolean(e.mandatory);
  return e.status === filter;
}

function getProgress(e: MyEnrollment) {
  // Usa o progresso da API se existir; caso contrário, deduz pelo estado.
  const raw = e.progress;
  if (typeof raw === 'number') return Math.min(100, Math.max(0, Math.round(raw)));
  return e.status === 'COMPLETED' ? 100 : 0;
}

interface MyEnrollmentsViewProps {
  onSelect: (id: number) => void;
}

export function MyEnrollmentsView({ onSelect }: MyEnrollmentsViewProps) {
  const [filter, setFilter] = useState<FilterId>('ALL');

  const {
    data = [],
    isLoading: loading,
    error,
  } = useApiQuery<MyEnrollment[]>(
    queryKeys.courses.myEnrollments(),
    '/courses/my/enrollments',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const filtered = data.filter((e) => matchesFilter(e, filter));

  if (loading) return <Skeleton />;
  if (error) return <div className="text-sm text-black">{error.message}</div>;

  return (
    <div>
      {/* Cabeçalho: título + filtros em pílula */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-medium text-ink">Meus cursos</h2>

        <PeriodPills
          label="Filtrar cursos"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map(({ id, label }) => ({ value: id, label }))}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sem cursos encontrados"
          description="Inscreve-te num curso do catálogo para começares a aprender."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <CourseListCard
              key={e.id}
              courseId={e.courseId}
              course={e.course}
              mandatory={e.mandatory}
              myStatus={e.status}
              progress={getProgress(e)}
              deadlineLabel={
                e.deadline
                  ? isOverdue(e.deadline)
                    ? 'Atrasado'
                    : `Prazo: ${fmtDate(e.deadline)}`
                  : undefined
              }
              overdue={e.deadline ? isOverdue(e.deadline) : false}
              onSelect={() => onSelect(e.courseId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}