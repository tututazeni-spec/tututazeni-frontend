// components/trainings/MyTrainingsView.tsx
// Separador "Os meus treinamentos" — inscrições filtráveis por
// estado. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from './atoms';
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

  if (loading) return <Skeleton />;

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['', 'REGISTERED', 'ATTENDED', 'COMPLETED', 'WAITLIST'] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === s
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === '' ? 'Todos' : PARTICIPANT_CFG[s].label}
            </button>
          ),
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((entry) => {
          const training = entry.session?.training;
          if (!training) return null;
          return (
            <div
              key={entry.id}
              onClick={() => onSelect(training.id)}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex-shrink-0 relative">
                {training.thumbnailUrl ? (
                  <Image
                    src={training.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {TYPE_CFG[training.type as TrainingType]?.icon ?? '📚'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {training.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{TYPE_CFG[training.type as TrainingType]?.label}</span>
                  <span>⏱ {fmtHours(training.workloadHours)}</span>
                  <span>📅 {fmtDate(entry.session?.sessionDate ?? null)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {entry.finalScore !== null && (
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-blue-700">
                      {entry.finalScore}%
                    </div>
                    <div className="text-xs text-gray-400">nota</div>
                  </div>
                )}
                <StatusBadge value={entry.status} map={PARTICIPANT_CFG} />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem treinamentos neste estado
          </div>
        )}
      </div>
    </div>
  );
}
