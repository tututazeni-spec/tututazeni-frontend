// components/events/CatalogView.tsx
// Separador "Catálogo" — filtro por tipo/modalidade de eventos
// futuros. Dados próprios + apresentação. Extraído de
// app/(platform)/events/page.tsx. Migrado para a fundação de design:
// filtro de tipo passa a Select da fundação, filtro de modalidade a
// grupo de Button ghost/primary (mesmo padrão do toggle NAV do
// container), Skeleton local (atoms.tsx) a Skeleton da fundação,
// estado vazio a EmptyState.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { CalendarX } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { MODALITY_CFG, TYPE_CFG } from './constants';
import { EventCard } from './EventCard';
import type { Event } from './types';

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(TYPE_CFG).map(([k, v]) => ({
    value: k,
    label: `${v.icon} ${v.label}`,
  })),
];

export function CatalogView({ onSelect }: CatalogViewProps) {
  const [typeFilter, setTypeFilter] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');

  const params = {
    upcoming: 'true',
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(modalityFilter ? { modalidade: modalityFilter } : {}),
  };
  const { data, isLoading: loading } = useApiQuery<{
    data: Event[];
    total: number;
  }>(queryKeys.events.catalog(params), '/events', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Select
          items={TYPE_ITEMS}
          value={typeFilter || 'ALL'}
          onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}
        />
        <div className="flex gap-1">
          {Object.entries(MODALITY_CFG).map(([k, v]) => (
            <Button
              key={k}
              size="sm"
              intent={modalityFilter === k ? 'primary' : 'ghost'}
              onClick={() => setModalityFilter(modalityFilter === k ? '' : k)}
            >
              {v.icon} {v.label}
            </Button>
          ))}
        </div>
        <span className="ml-auto self-center font-body text-xs text-ink-faint">
          {data?.total ?? 0} eventos
        </span>
      </div>

      {loading ? (
        <Skeleton
          rows={4}
          wrapperClassName="grid grid-cols-2 gap-4"
          itemClassName="skeleton-shimmer h-48 rounded-card"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(data?.data ?? []).map((e) => (
            <EventCard key={e.id} event={e} onSelect={() => onSelect(e.id)} />
          ))}
          {(data?.data ?? []).length === 0 && (
            <div className="col-span-2">
              <EmptyState
                icon={CalendarX}
                title="Sem eventos encontrados"
                description="Ajusta os filtros ou volta mais tarde."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
