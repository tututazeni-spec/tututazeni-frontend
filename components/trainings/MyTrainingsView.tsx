// components/trainings/MyTrainingsView.tsx
// Separador "Os meus treinamentos" — inscrições filtráveis por
// estado. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PARTICIPANT_CFG } from './constants';
import { TrainingCard } from './TrainingCard';
import type { MyTrainingEntry, ParticipantStatus } from './types';

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

      <div className="grid grid-cols-3 gap-4">
        {filtered.map((entry) => {
          const training = entry.session?.training;
          if (!training) return null;
          return (
            <TrainingCard
              key={entry.id}
              training={training}
              onClick={() => onSelect(training.id)}
              mine={{
                badge: (
                  <StatusBadge value={entry.status} map={PARTICIPANT_CFG} />
                ),
                sessionDate: entry.session?.sessionDate ?? null,
                finalScore: entry.finalScore,
              }}
            />
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3">
            <EmptyState
              title="Sem treinamentos neste estado"
              description="Não há inscrições que correspondam ao filtro seleccionado."
            />
          </div>
        )}
      </div>
    </div>
  );
}
