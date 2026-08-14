// components/organization/OrgChartView.tsx
// Vista "Organograma": árvore hierárquica com controlo de
// profundidade e pesquisa. Extraído de
// app/(platform)/organization/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { GitBranch } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <div className="mb-5 flex items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar colaborador…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm flex-1"
        />
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-ink-faint">
            Profundidade:
          </span>
          {[2, 3, 4].map((d) => (
            <Button
              key={d}
              size="sm"
              intent={depth === d ? 'primary' : 'secondary'}
              className="h-8 w-8 p-0 font-mono"
              onClick={() => setDepth(d)}
            >
              {d}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton rows={3} />
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-8 p-4">
            {data.map((root) => (
              <OrgChartNode key={root.id} node={root} />
            ))}
            {data.length === 0 && (
              <div className="w-full">
                <EmptyState
                  icon={GitBranch}
                  title="Sem dados para o organograma"
                  description="Ainda não há colaboradores estruturados na hierarquia."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
