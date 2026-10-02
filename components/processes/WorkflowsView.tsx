// components/processes/WorkflowsView.tsx
// Aba «Fluxos de Trabalho» (docs/Modulo_Processes.md §8): escolhe o modelo e
// abre o construtor visual do seu fluxo.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PROCESS_STATUS_MAP } from './constants';
import { Skeleton } from './Skeleton';
import { WorkflowBuilder } from './WorkflowBuilder';
import type { PaginatedProcesses } from './types';

export interface WorkflowsViewProps {
  canEdit: boolean;
}

export function WorkflowsView({ canEdit }: WorkflowsViewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const params = { page: 1, limit: 30, ...(debounced ? { search: debounced } : {}) };
  const { data, isLoading, error } = useApiQuery<PaginatedProcesses>(
    queryKeys.processes.library(params),
    '/processes',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  if (selected !== null) {
    return (
      <WorkflowBuilder processId={selected} canEdit={canEdit} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar modelo para abrir o fluxo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md flex-1"
        />
        <span className="font-body text-sm text-ink-faint">
          Só os rascunhos são editáveis; os restantes abrem para consulta e teste.
        </span>
      </div>
      {isLoading && <Skeleton rows={4} />}
      {error && <p className="font-body text-sm text-danger">{error.message}</p>}
      {!isLoading && data?.data.length === 0 && (
        <EmptyState title="Sem modelos" description="Crie um modelo em Modelos de Processos." />
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className="rounded-card border border-border bg-surface p-4 text-left shadow-resting transition-shadow hover:shadow-hover"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-medium text-ink">{p.title}</div>
                <div className="font-mono text-xs text-ink-faint">
                  {p.code} · v{p.version}
                </div>
              </div>
              <StatusBadge value={p.status} map={PROCESS_STATUS_MAP} variant="dot" />
            </div>
            <div className="mt-3 font-body text-xs text-ink-muted">
              {p.steps?.length ?? 0} etapas · {p._count?.instances ?? 0} processos
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
