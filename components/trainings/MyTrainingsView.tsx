// components/trainings/MyTrainingsView.tsx
// Separador "Os meus treinamentos" — inscrições filtráveis por
// estado. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CalendarClock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PARTICIPANT_CFG, TYPE_CFG } from './constants';
import { fmtDate, fmtHours } from './utils';
import type { MyTrainingEntry, ParticipantStatus, TrainingType } from './types';

interface MyTrainingsViewProps {
  onSelect: (id: number) => void;
}

export function MyTrainingsView({ onSelect }: MyTrainingsViewProps) {
  const [filter, setFilter] = useState<ParticipantStatus | ''>('');

  const { data = [], isLoading: loading } = useApiQuery<MyTrainingEntry[]>(
    queryKeys.trainings.my(),
    '/trainings/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const filtered = filter ? data.filter((d) => d.status === filter) : data;

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {(['', 'REGISTERED', 'ATTENDED', 'COMPLETED', 'WAITLIST'] as const).map(
          (s) => (
            <Button
              key={s}
              size="sm"
              intent={filter === s ? 'primary' : 'secondary'}
              onClick={() => setFilter(s)}
            >
              {s === '' ? 'Todos' : PARTICIPANT_CFG[s].label}
            </Button>
          ),
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((entry) => {
          const training = entry.session?.training;
          if (!training) return null;
          return (
            <Card
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(training.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(training.id);
                }
              }}
              className="flex cursor-pointer items-center gap-4 p-4 transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-control bg-gradient-to-br from-primary to-primary-active">
                {training.thumbnailUrl ? (
                  <Image
                    src={training.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover opacity-80"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    {TYPE_CFG[training.type as TrainingType]?.icon ?? '📚'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {training.title}
                </div>
                <div className="mt-0.5 flex items-center gap-2 font-body text-xs text-ink-faint">
                  <span>{TYPE_CFG[training.type as TrainingType]?.label}</span>
                  <span> {fmtHours(training.workloadHours)}</span>
                  <span> {fmtDate(entry.session?.sessionDate ?? null)}</span>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                {entry.finalScore !== null && (
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-primary">
                      {entry.finalScore}%
                    </div>
                    <div className="font-body text-xs text-ink-faint">nota</div>
                  </div>
                )}
                <StatusBadge value={entry.status} map={PARTICIPANT_CFG} />
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <EmptyState
            title="Sem treinamentos neste estado"
            description="Não há inscrições que correspondam ao filtro seleccionado."
          />
        )}
      </div>
    </div>
  );
}
