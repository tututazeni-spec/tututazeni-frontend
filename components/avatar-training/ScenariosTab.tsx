// components/avatar-training/ScenariosTab.tsx
// Separador "Cenários" — catálogo pesquisável/filtrável. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/avatar-training/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Bot } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CONFIG } from './constants';
import { ScenarioCard } from './ScenarioCard';
import type { Scenario } from './types';

export interface ScenariosTabProps {
  onStart: (s: Scenario) => void;
}

const DIFFS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

export function ScenariosTab({ onStart }: ScenariosTabProps) {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const params = {
    limit: 30,
    ...(category ? { category } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const { data, isLoading } = useApiQuery<{
    data: Scenario[];
    meta: { total: number };
  }>(queryKeys.avatarTraining.scenarios(params), '/avatar-training/scenarios', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });
  const loading = isLoading;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar cenários..."
          className="flex-1 min-w-[180px] text-sm"
        />

        <Select
          items={[
            { value: 'ALL', label: 'Todas as categorias' },
            ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({
              value: k,
              label: v.label,
            })),
          ]}
          value={category || 'ALL'}
          onValueChange={(v) => setCategory(v === 'ALL' ? '' : v)}
          className="text-xs"
        />

        <div className="flex gap-1">
          {['', ...DIFFS].map((d) => (
            <Button
              key={d}
              size="sm"
              intent={difficulty === d ? 'primary' : 'ghost'}
              onClick={() => setDifficulty(d)}
            >
              {d || 'Todos'}
            </Button>
          ))}
        </div>

        <span className="text-xs text-ink-faint self-center ml-auto">
          {data?.meta.total ?? 0} cenários
        </span>
      </Card>

      {loading ? (
        <Skeleton
          rows={6}
          wrapperClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse"
          itemClassName="bg-surface-sunken rounded-card h-52"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onStart={onStart} />
          ))}
          {(data?.data.length ?? 0) === 0 && (
            <div className="col-span-4">
              <EmptyState
                icon={Bot}
                title="Nenhum cenário encontrado"
                description="Ajusta a pesquisa ou os filtros para veres mais cenários."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
