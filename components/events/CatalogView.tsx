// components/events/CatalogView.tsx
// Separador "Catálogo" — filtro por tipo/modalidade de eventos
// futuros. Dados próprios + apresentação. Extraído de
// app/(platform)/events/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { MODALITY_CFG, TYPE_CFG } from './constants';
import { EventCard } from './EventCard';
import type { Event } from './types';

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

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
      <div className="flex gap-2 mb-5 flex-wrap">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {Object.entries(MODALITY_CFG).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setModalityFilter(modalityFilter === k ? '' : k)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${modalityFilter === k ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
        <span className="ml-auto self-center text-xs text-gray-400">
          {data?.total ?? 0} eventos
        </span>
      </div>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(data?.data ?? []).map((e) => (
            <EventCard key={e.id} event={e} onSelect={() => onSelect(e.id)} />
          ))}
          {(data?.data ?? []).length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <div className="text-4xl mb-3">📅</div>
              Sem eventos encontrados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
