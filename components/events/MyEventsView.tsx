// components/events/MyEventsView.tsx
// Separador "Os meus eventos" — próximos/passados. Dados próprios +
// apresentação. Extraído de app/(platform)/events/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { EventCard } from './EventCard';
import type { MyEvents } from './types';

interface MyEventsViewProps {
  onSelect: (id: number) => void;
}

export function MyEventsView({ onSelect }: MyEventsViewProps) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data, isLoading } = useApiQuery<MyEvents>(
    queryKeys.events.my(),
    '/events/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton />;

  const items =
    tab === 'upcoming' ? (data?.upcoming ?? []) : (data?.past ?? []);

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {
              {
                upcoming: `📅 Próximos (${data?.upcoming.length ?? 0})`,
                past: `🕐 Passados (${data?.past.length ?? 0})`,
              }[t]
            }
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          {tab === 'upcoming'
            ? 'Sem eventos futuros. Inscreve-te no catálogo!'
            : 'Sem eventos passados'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((p) => (
            <EventCard
              key={p.id}
              event={p.event}
              myStatus={p.status}
              onSelect={() => onSelect(p.event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
