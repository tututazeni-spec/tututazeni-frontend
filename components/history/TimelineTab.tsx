// components/history/TimelineTab.tsx
// Tab "Timeline": eventos agrupados por mês, filtráveis por
// categoria e pesquisa, com marcos em destaque. Extraído de
// app/(platform)/history/page.tsx.

'use client';

import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_LABEL } from './constants';
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
      <div className="bg-surface rounded-card border border-border p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar eventos..."
            className="w-full pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => {
              setCategory('');
              setPage(1);
            }}
            className={`text-xs px-2.5 py-1.5 rounded-control font-medium transition-colors ${!category ? 'bg-primary text-canvas' : 'bg-surface-sunken text-ink-muted'}`}
          >
            Todos
          </button>
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-control font-medium transition-colors ${category === c ? 'bg-primary text-canvas' : 'bg-surface text-ink border border-border'}`}
            >
              {CATEGORY_LABEL[c] ?? c}
            </button>
          ))}
        </div>
      </div>

      {/* Milestones strip */}
      {(data?.milestones.length ?? 0) > 0 && (
        <div className="bg-warning-subtle border border-warning rounded-card p-4">
          <p className="text-xs font-semibold text-warning-ink mb-2">
            <Star
              size={16}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            Marcos Recentes
          </p>
          <div className="flex flex-wrap gap-2">
            {data!.milestones.slice(0, 5).map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-surface rounded-control px-3 py-1.5 border border-border"
              >
                <span className="text-sm">{m.icon}</span>
                <p className="text-xs font-medium text-ink">{m.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped timeline */}
      {loading ? (
        <Skeleton
          rows={4}
          wrapperClassName="space-y-4"
          itemClassName="skeleton-shimmer h-16 rounded-card"
        />
      ) : (
        <div className="space-y-6">
          {(data?.grouped ?? []).map((group) => (
            <div key={group.month}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <h3 className="text-sm font-semibold text-ink-muted">
                  {monthLabel(group.month)}
                </h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-ink-faint">
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
            <EmptyState
              title="Nenhum evento encontrado"
              description="Ajusta os filtros ou volta mais tarde"
            />
          )}

          {/* Pagination */}
          {data && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
