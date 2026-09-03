// components/learning-paths/MyPathsView.tsx
// Separador "As minhas trilhas" — matrículas filtráveis por estado.
// Dados próprios + apresentação. Extraído de
// app/(platform)/learning-paths/page.tsx. Migrado para a fundação de
// design: filtro de estado passa a grupo de Button ghost/primary (mesmo
// padrão do toggle NAV do container), skeleton local (atoms.tsx) passa
// a Skeleton da fundação, estado vazio a EmptyState, cartão de trilha a
// Card.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LP_TYPE_MAP } from './constants';
import { isOverdue } from './utils';
import type { MyLPEnrollment } from './types';

const FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'NOT_STARTED', label: 'Não iniciadas' },
  { value: 'IN_PROGRESS', label: 'Em progresso' },
  { value: 'COMPLETED', label: 'Concluídas' },
];

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

  if (isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            intent={filter === f.value ? 'primary' : 'ghost'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sem trilhas encontradas"
          description="Ajusta o filtro ou explora o catálogo para começar uma trilha."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <Card
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(e.learningPathId)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  onSelect(e.learningPathId);
                }
              }}
              className="flex cursor-pointer items-center gap-4 p-4 transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <div className="relative flex h-12 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-control bg-gradient-to-br from-primary to-primary-active">
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
              <div className="min-w-0 flex-1">
                <div className="mb-1 font-body text-sm font-medium text-ink">
                  {e.learningPath?.title}
                </div>
                <div className="flex items-center gap-3 font-body text-xs text-ink-faint">
                  {e.learningPath?.pathType && (
                    <StatusBadge
                      value={e.learningPath.pathType}
                      map={LP_TYPE_MAP}
                    />
                  )}
                  <span>📚 {e.learningPath?._count?.courses ?? 0} cursos</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div
                  className={`font-body text-sm font-medium ${
                    e.status === 'COMPLETED'
                      ? 'text-success'
                      : e.status === 'IN_PROGRESS'
                        ? 'text-info'
                        : 'text-ink-faint'
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
                    className={`font-body text-xs ${isOverdue(e.deadline) ? 'text-danger' : 'text-ink-faint'}`}
                  >
                    {isOverdue(e.deadline)
                      ? 'Prazo expirado'
                      : `Prazo: ${fmtDate(e.deadline)}`}
                  </div>
                )}
                {e.mandatory && (
                  <div className="font-body text-xs font-medium text-danger">
                    Obrigatório
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
