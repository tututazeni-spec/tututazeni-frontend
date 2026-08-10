// components/history/TimelineTab.tsx
// Tab "Timeline": eventos agrupados por mês, filtráveis por
// categoria e pesquisa, com marcos em destaque. Extraído de
// app/(platform)/history/page.tsx.

'use client';

import { useState } from 'react';
import { Clock, Search } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { CATEGORY_COLOR } from './constants';
import { EventCard } from './EventCard';
import { monthLabel } from './utils';
import type { GroupedEvents, Milestone } from './types';

export function TimelineTab() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const params = { page, limit: 20, category };

  const { data, isLoading: loading } = useApiQuery<{
    grouped: GroupedEvents[];
    milestones: Milestone[];
    meta: { totalPages: number };
  }>(queryKeys.history.timeline(params), '/history/timeline/me', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  const CATS = [
    'LEARNING',
    'PERFORMANCE',
    'CAREER',
    'ENGAGEMENT',
    'SYSTEM',
    'COMPLIANCE',
    'ATTENDANCE',
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar eventos..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => {
              setCategory('');
              setPage(1);
            }}
            className={`text-xs px-2.5 py-1.5 rounded-lg ${!category ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Todos
          </button>
          {CATS.map((c) => {
            const conf = CATEGORY_COLOR[c] ?? CATEGORY_COLOR.SYSTEM;
            return (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setPage(1);
                }}
                className={`text-xs px-2.5 py-1.5 rounded-lg ${category === c ? 'bg-indigo-600 text-white' : `${conf.bg} ${conf.color}`}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Milestones strip */}
      {(data?.milestones.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">
            ⭐ Marcos Recentes
          </p>
          <div className="flex flex-wrap gap-2">
            {data!.milestones.slice(0, 5).map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-amber-100"
              >
                <span className="text-sm">{m.icon}</span>
                <p className="text-xs font-medium text-slate-700">{m.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped timeline */}
      {loading ? (
        <Skeleton />
      ) : (
        <div className="space-y-6">
          {(data?.grouped ?? []).map((group) => (
            <div key={group.month}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <h3 className="text-sm font-semibold text-slate-600">
                  {monthLabel(group.month)}
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">
                  {group.items.length} eventos
                </span>
              </div>
              <div className="space-y-2 pl-5">
                {group.items
                  .filter(
                    (e) =>
                      !search ||
                      e.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
              </div>
            </div>
          ))}

          {(data?.grouped ?? []).length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Clock size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum evento encontrado</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-sm text-slate-500">
                {page} / {data.meta.totalPages}
              </span>
              <button
                disabled={page === data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
