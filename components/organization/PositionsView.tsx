// components/organization/PositionsView.tsx
// Vista "Cargos": tabela de posições filtrável por nível. Extraído
// de app/(platform)/organization/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from './atoms';
import { LEVEL_CFG } from './constants';
import type { Position, PosLevel } from './types';

export function PositionsView() {
  const [filter, setFilter] = useState('');

  const params = { limit: 50, ...(filter ? { level: filter } : {}) };
  const { data, isLoading } = useApiQuery<{ data: Position[]; total: number }>(
    queryKeys.organization.positions(filter),
    '/organization/positions',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  const levels: PosLevel[] = [
    'INTERN',
    'JUNIOR',
    'MID',
    'SENIOR',
    'LEAD',
    'MANAGER',
    'DIRECTOR',
    'EXECUTIVE',
  ];

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${!filter ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Todos
        </button>
        {levels.map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === l ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {LEVEL_CFG[l].label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_100px_150px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Cargo</div>
          <div>Nível</div>
          <div>Activos</div>
          <div>Vagas</div>
          <div>Salário</div>
        </div>
        {data?.data.map((pos) => (
          <div
            key={pos.id}
            className="grid grid-cols-[1fr_100px_100px_100px_150px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50"
          >
            <div>
              <div className="text-sm font-medium text-gray-900">
                {pos.name}
              </div>
              {pos.code && (
                <div className="text-xs text-gray-400">{pos.code}</div>
              )}
            </div>
            <div>
              <StatusBadge value={pos.level} map={LEVEL_CFG} />
            </div>
            <div className="text-sm font-mono text-gray-900">
              {pos.headcountOccupied}
            </div>
            <div>
              {pos.headcountOpen > 0 ? (
                <span className="text-xs text-amber-600 font-medium">
                  {pos.headcountOpen} abertas
                </span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {pos.salaryMin && pos.salaryMax
                ? `${fmtKz(pos.salaryMin)} – ${fmtKz(pos.salaryMax)}`
                : '—'}
            </div>
          </div>
        ))}
        {data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Sem cargos
          </div>
        )}
      </div>
    </div>
  );
}
