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
import { Skeleton } from './atoms';
import { CATEGORY_CONFIG } from './constants';
import { ScenarioCard } from './ScenarioCard';
import type { Scenario } from './types';

export interface ScenariosTabProps {
  onStart: (s: Scenario) => void;
}

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

  const DIFFS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar cenários..."
          className="flex-1 min-w-[180px] text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {['', ...DIFFS].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                difficulty === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {d || 'Todos'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 self-center ml-auto">
          {data?.meta.total ?? 0} cenários
        </span>
      </div>

      {loading ? (
        <Skeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onStart={onStart} />
          ))}
          {(data?.data.length ?? 0) === 0 && (
            <div className="col-span-4 py-16 text-center text-slate-400">
              <Bot size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum cenário encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
