// components/processes/LibraryView.tsx
// Separador "Biblioteca" — lista paginada/filtrável de processos. Dados
// próprios (useApiQuery) + apresentação, mesmo padrão auto-contido usado em
// components/payslips/page.tsx (ListView). Extraído de
// app/(platform)/processes/page.tsx.

'use client';

import { useState } from 'react';
import { FileStack } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PROCESS_STATUS_MAP, RISK_LEVEL_MAP } from './constants';
import { Skeleton } from './Skeleton';
import type { PaginatedProcesses } from './types';

export interface LibraryViewProps {
  onSelect: (id: number) => void;
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'IN_REVIEW', label: 'Em revisão' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

const RISK_ITEMS = [
  { value: 'ALL', label: 'Todos os riscos' },
  { value: 'LOW', label: 'Baixo' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'HIGH', label: 'Alto' },
  { value: 'CRITICAL', label: 'Crítico' },
];

export function LibraryView({ onSelect }: LibraryViewProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const params = {
    page,
    limit: 15,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(risk ? { riskLevel: risk } : {}),
  };
  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery<PaginatedProcesses>(
    queryKeys.processes.library(params),
    '/processes',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código, tag…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[160px] flex-1"
        />
        <Select
          items={STATUS_ITEMS}
          value={status || 'ALL'}
          onValueChange={(v) => {
            setStatus(v === 'ALL' ? '' : v);
            setPage(1);
          }}
          className="w-44"
        />
        <Select
          items={RISK_ITEMS}
          value={risk || 'ALL'}
          onValueChange={(v) => {
            setRisk(v === 'ALL' ? '' : v);
            setPage(1);
          }}
          className="w-40"
        />
        <span className="font-body text-sm text-ink-faint">
          {data?.total ?? 0} processos
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="grid grid-cols-[2fr_100px_120px_90px_100px_90px] gap-3 border-b border-border bg-[#0F1F3D]/60 px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-white pointer-events-none select-none">
          <div>Processo</div>
          <div>Versão</div>
          <div>Departamento</div>
          <div>Risco</div>
          <div>Estado</div>
          <div>Instâncias</div>
        </div>

        {loading && (
          <div className="p-4">
            <Skeleton />
          </div>
        )}
        {error && (
          <div className="px-4 py-8 text-center font-body text-sm text-danger">
            {error.message}
          </div>
        )}

        {!loading && data?.data.length === 0 && (
          <EmptyState
            title="Sem processos"
            description="Nenhum processo encontrado com estes filtros."
          />
        )}

        {!loading &&
          data?.data.map((p) => (
            <div
              key={p.id}
              className="relative grid cursor-pointer grid-cols-[2fr_100px_120px_90px_100px_90px] items-center gap-3 border-b border-white/10 bg-[#0F1F3D] py-3 pl-5 pr-4 last:border-0"
              onClick={() => onSelect(p.id)}
            >
              <span
                className={`absolute inset-y-2 left-2 w-1 rounded-full ${p.status === 'ACTIVE' ? 'bg-success' : 'bg-ink-faint'}`}
              />
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                  <FileStack size={16} strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-body text-sm font-semibold text-white">
                      {p.title}
                    </span>
                    {p.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-control bg-white/15 px-1.5 py-0.5 font-body text-xs text-white"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-white">
                    {p.code}
                  </div>
                </div>
              </div>
              <div className="font-mono text-xs text-white">
                v{p.version}
              </div>
              <div className="font-body text-xs text-white">
                {p.department?.name ?? '—'}
              </div>
              <div>
                <StatusBadge value={p.riskLevel} map={RISK_LEVEL_MAP} />
              </div>
              <div>
                <StatusBadge
                  value={p.status}
                  map={PROCESS_STATUS_MAP}
                  variant="dot"
                />
              </div>
              <div className="font-body text-sm text-white">
                {p._count.instances}
              </div>
            </div>
          ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-body text-xs text-ink-faint">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
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
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
