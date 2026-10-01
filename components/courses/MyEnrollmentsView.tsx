// components/courses/MyEnrollmentsView.tsx
// Vista "Meus cursos": grelha de cartões com imagem, prazo sobreposto,
// barra de progresso, título e descrição. Filtros em "pílula" (segmented control).

'use client';

import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CourseThumbnail } from './CourseThumbnail';
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
  const raw = (e as { progress?: number }).progress;
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
  if (error) return <div className="text-sm text-danger">{error.message}</div>;

  return (
    <div>
      {/* Cabeçalho: título + filtros em pílula */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-medium text-ink">Meus cursos</h2>

        <div
          role="tablist"
          aria-label="Filtrar cursos"
          className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-zinc-900 p-1"
        >
          {FILTERS.map(({ id, label }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? 'bg-amber-200 font-medium text-zinc-900'
                    : 'text-white hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sem cursos encontrados"
          description="Inscreve-te num curso do catálogo para começares a aprender."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const progress = getProgress(e);
            const overdue = e.deadline ? isOverdue(e.deadline) : false;
            const description = (e.course as { description?: string }).description;

            return (
              <Card
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(e.courseId)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    onSelect(e.courseId);
                  }
                }}
                className="flex cursor-pointer flex-col overflow-hidden border-0 bg-zinc-800 p-0 text-white transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                {/* Imagem + prazo sobreposto */}
                <div className="relative aspect-video w-full overflow-hidden bg-surface-sunken">
                  <CourseThumbnail
                    src={e.course.thumbnailUrl}
                    alt={e.course.title}
                    fallbackClassName="text-5xl"
                  />

                  {e.deadline && (
                    <div
                      className={`absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs backdrop-blur-sm ${
                        overdue ? 'bg-red-600/80 text-white' : 'bg-zinc-700/80 text-white'
                      }`}
                    >
                      <CalendarDays size={14} strokeWidth={1.75} />
                      {overdue ? 'Atrasado' : `Prazo: ${fmtDate(e.deadline)}`}
                    </div>
                  )}

                  {e.mandatory && (
                    <Badge intent="danger" className="absolute right-3 top-3">
                      Obrigatório
                    </Badge>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex flex-1 flex-col gap-2.5 p-3">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-600"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progresso em ${e.course.title}`}
                    >
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm tabular-nums">{progress}%</span>
                  </div>

                  <h3 className="text-base font-medium leading-snug">
                    {e.course.title}
                  </h3>

                  {description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-zinc-300">
                      {description}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}