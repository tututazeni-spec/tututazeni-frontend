// components/trainings/CatalogView.tsx
// Separador "Catálogo" — pesquisa/filtros paginados de treinamentos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { TrainingCard } from './TrainingCard';
import type { Training, TrainingLevel, TrainingType } from './types';

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

export function CatalogView({ onSelect }: CatalogViewProps) {
  const [type, setType] = useState<TrainingType | ''>('');
  const [level, setLevel] = useState<TrainingLevel | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = { page, limit: 12, type, level, search: debouncedSearch };

  const { data, isLoading: loading } = useApiQuery<{
    data: Training[];
    total: number;
  }>(queryKeys.trainings.list(params), '/trainings', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar treinamentos…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as TrainingType | '');
            setPage(1);
          }}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todos os formatos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value as TrainingLevel | '');
            setPage(1);
          }}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todos os níveis</option>
          {Object.entries(LEVEL_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <span className="font-body text-xs text-ink-faint">
          {data?.total ?? 0} treinamentos
        </span>
      </div>

      {loading ? (
        <Skeleton
          rows={4}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-16 rounded-card"
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-4">
            {data?.data.map((t) => (
              <TrainingCard
                key={t.id}
                training={t}
                onClick={() => onSelect(t.id)}
              />
            ))}
            {data?.data.length === 0 && (
              <div className="col-span-3">
                <EmptyState
                  title="Sem treinamentos disponíveis"
                  description="Não há treinamentos que correspondam aos filtros seleccionados."
                />
              </div>
            )}
          </div>
          {(data?.total ?? 0) > 12 && (
            <div className="flex justify-center gap-2">
              <Button
                intent="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <Button
                intent="secondary"
                size="sm"
                disabled={(data?.total ?? 0) <= page * 12}
                onClick={() => setPage((p) => p + 1)}
              >
                Próximos →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
