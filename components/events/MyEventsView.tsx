// components/events/MyEventsView.tsx
// Separador "Os meus eventos" — próximos/passados. Dados próprios +
// apresentação. Extraído de app/(platform)/events/page.tsx. Migrado
// para a fundação de design: toggle de separador passa a grupo de
// Button, Skeleton/EmptyState locais passam à fundação.

'use client';

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
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

  if (isLoading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-2 gap-4"
        itemClassName="skeleton-shimmer h-48 rounded-card"
      />
    );

  const items =
    tab === 'upcoming' ? (data?.upcoming ?? []) : (data?.past ?? []);

  return (
    <div>
      <div className="mb-5 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
        {(['upcoming', 'past'] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            intent={tab === t ? 'primary' : 'ghost'}
            onClick={() => setTab(t)}
          >
            {
              {
                upcoming: `Próximos (${data?.upcoming.length ?? 0})`,
                past: `Passados (${data?.past.length ?? 0})`,
              }[t]
            }
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={
            tab === 'upcoming' ? 'Sem eventos futuros' : 'Sem eventos passados'
          }
          description={
            tab === 'upcoming'
              ? 'Inscreve-te no catálogo para veres os teus próximos eventos aqui.'
              : 'Os eventos que já terminaram aparecem aqui.'
          }
        />
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
