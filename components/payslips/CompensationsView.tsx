// components/payslips/CompensationsView.tsx
// Aba "Compensações" (ADMIN/RH): tabela global de colaboradores com uma
// compensação activa (GET /payroll/compensation/all, paginado). Clique numa
// linha → detalhe por colaborador. "+ Nova compensação" abre o form em modo
// criar sem userId (único caminho para um colaborador ainda sem registos, que
// não aparece nesta lista).
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { CompensationFormModal } from './CompensationFormModal';
import type { CompensationListRow, Paginated } from './types';

export interface CompensationsViewProps {
  onOpenDetail: (userId: number) => void;
}

const COLS =
  'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_112px_104px_104px_84px_92px] gap-2';

export function CompensationsView({ onOpenDetail }: CompensationsViewProps) {
  const [rawSearch, setRawSearch] = useState('');
  const [page, setPage] = useState(1);
  // Só o cabeçalho até o utilizador mexer num filtro.
  const [filtered, setFiltered] = useState(false);
  const [creating, setCreating] = useState(false);
  const search = useDebounce(rawSearch);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (search.trim()) params.search = search.trim();

  const { data, isLoading, error } = useApiQuery<
    Paginated<CompensationListRow>
  >(queryKeys.payslips.compensationList(params), '/payroll/compensation/all', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });

  const rows = filtered ? (data?.data ?? []) : [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={rawSearch}
          onChange={(e) => {
            setRawSearch(e.target.value);
            setFiltered(true);
            setPage(1);
          }}
          placeholder="Pesquisar por nome ou nº de colaborador…"
          className="w-72"
        />
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          + Nova compensação
        </Button>
      </div>

      {filtered && isLoading && <Skeleton rows={8} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {filtered && !isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Nenhum colaborador com compensação registada"
          description="Os registos criam-se a partir do detalhe de um colaborador ou com “+ Nova compensação”."
        />
      )}

      {!error && (
        <div className="overflow-hidden rounded-[14px] border border-[#1E3A66] bg-[#071D3B] shadow-[0_4px_16px_rgba(7,29,59,0.35)]">
          <div>
            <div
              className={`${COLS} bg-[#0B2D5B] px-4 py-3 font-body text-xs font-bold uppercase leading-tight tracking-wide text-white`}
            >
              <div>Colaborador</div>
              <div>Departamento</div>
              <div>Salário base</div>
              <div>Subs. alim.</div>
              <div>Subs. transp.</div>
              <div>Desde</div>
              <div>Componentes</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className={`${COLS} cursor-pointer items-center border-b border-[#6F8FB8]/20 px-4 py-3.5 text-white transition-colors duration-150 last:border-0 hover:bg-white/5`}
                onClick={() => onOpenDetail(r.userId)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={r.user.fullName}
                    url={r.user.avatarUrl ?? undefined}
                    size="lg"
                    className="shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-body text-sm font-semibold text-white">
                      {r.user.fullName}
                    </div>
                    <div className="truncate font-mono text-xs text-[#9DB4D3]">
                      {r.user.employeeNumber ?? '—'}
                    </div>
                  </div>
                </div>
                <div className="truncate font-body text-sm text-[#CFE3FF]">
                  {r.user.department?.name ?? '—'}
                </div>
                <div className="font-mono text-sm font-semibold text-white">
                  {fmtKz(r.baseSalary)}
                </div>
                <div className="font-mono text-sm text-[#CFE3FF]">
                  {fmtKz(r.foodAllowance)}
                </div>
                <div className="font-mono text-sm text-[#CFE3FF]">
                  {fmtKz(r.transportAllowance)}
                </div>
                <div className="font-body text-sm text-[#CFE3FF]">
                  {fmtDate(r.effectiveFrom)}
                </div>
                <div className="font-body text-sm text-[#CFE3FF]">
                  {r._count.components}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {creating && (
        <CompensationFormModal
          mode="create"
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
