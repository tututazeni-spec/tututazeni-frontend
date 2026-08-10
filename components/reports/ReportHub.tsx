// components/reports/ReportHub.tsx
// Vista inicial "Report Hub": grelha de templates pesquisável e
// filtrável por categoria. Extraído de
// app/(platform)/reports/page.tsx.

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { CAT_CONFIG } from './constants';
import { TemplateCard } from './TemplateCard';
import type { Template } from './types';

interface ReportHubProps {
  onRun: (t: Template) => void;
}

export function ReportHub({ onRun }: ReportHubProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: templates = [], isLoading: loading } = useApiQuery<Template[]>(
    queryKeys.reports.templates(),
    '/reports/templates',
    { staleTime: STALE_TIME.STATIC },
  );

  const filtered = templates.filter(
    (t) =>
      (!category || t.category === category) &&
      (!search || t.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Search + filter */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar templates..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(CAT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 self-center">
          {filtered.length} templates
        </span>
      </div>

      {loading ? (
        <Skeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <TemplateCard key={t.id} tpl={t} onRun={onRun} />
          ))}
        </div>
      )}
    </div>
  );
}
