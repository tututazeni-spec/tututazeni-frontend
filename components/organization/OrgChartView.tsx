// components/organization/OrgChartView.tsx
// Vista "Organograma": árvore hierárquica com controlo de
// profundidade e pesquisa. Extraído de
// app/(platform)/organization/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { OrgChartNode } from './OrgChartNode';
import type { OrgNode } from './types';

export function OrgChartView() {
  const [depth, setDepth] = useState(3);
  const [search, setSearch] = useState('');

  const { data = [], isLoading: loading } = useApiQuery<OrgNode[]>(
    queryKeys.organization.chart(depth),
    '/organization/chart',
    {
      params: { depth },
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar colaborador…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Profundidade:</span>
          {[2, 3, 4].map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              className={`w-8 h-8 text-xs font-mono rounded-lg ${depth === d ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton rows={3} />
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-8 p-4 min-w-max">
            {data.map((root) => (
              <OrgChartNode key={root.id} node={root} />
            ))}
            {data.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-12 w-full">
                Sem dados para o organograma
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
