// components/courses/MyEnrollmentsView.tsx
// Vista "Os meus cursos": lista de matrículas filtrável por estado.
// Extraído de app/(platform)/courses/page.tsx. Migrado para a fundação
// de design: chips de filtro passam a Button ghost/primary (mesmo
// padrão de components/enrollments/MyEnrollmentsView.tsx), cartões de
// matrícula passam a Card, badge "Obrigatório" a Badge, estado vazio a
// EmptyState.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GraduationCap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { EnrollBadge, Skeleton, fmtDuration, isOverdue } from './shared';
import type { MyEnrollment } from './types';

const FILTERS = [
  { id: '', label: 'Todos' },
  { id: 'NOT_STARTED', label: 'Não iniciados' },
  { id: 'IN_PROGRESS', label: 'Em progresso' },
  { id: 'COMPLETED', label: 'Concluídos' },
];

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
  if (error) return <div className="text-sm text-danger">{error.message}</div>;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {FILTERS.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            intent={filter === id ? 'primary' : 'ghost'}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Sem matrículas encontradas"
          description="Inscreve-te num curso do catálogo para começares a aprender."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
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
              className="flex items-center gap-4 p-4 cursor-pointer transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <div className="w-16 h-16 bg-surface-sunken rounded-control overflow-hidden flex-shrink-0 relative">
                {e.course.thumbnailUrl ? (
                  <Image
                    src={e.course.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-ink-faint">
                    📚
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink mb-1">
                  {e.course.title}
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-faint mb-2">
                  {e.course.category && <span>{e.course.category}</span>}
                  {e.course.workloadHours && (
                    <span>⏱ {fmtDuration(e.course.workloadHours)}</span>
                  )}
                </div>
                <EnrollBadge status={e.status} deadline={e.deadline} />
              </div>
              {e.mandatory && (
                <Badge intent="danger" className="flex-shrink-0">
                  Obrigatório
                </Badge>
              )}
              {e.deadline && (
                <div
                  className={`text-xs flex-shrink-0 ${isOverdue(e.deadline) ? 'text-danger' : 'text-ink-faint'}`}
                >
                  {isOverdue(e.deadline)
                    ? '⚠ Atrasado'
                    : `Prazo: ${fmtDate(e.deadline)}`}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
