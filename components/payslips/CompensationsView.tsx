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

const COLS = 'grid grid-cols-[1.4fr_1fr_130px_120px_120px_130px_90px] gap-3';

export function CompensationsView({ onOpenDetail }: CompensationsViewProps) {
  const [rawSearch, setRawSearch] = useState('');
  const [page, setPage] = useState(1);
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

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={rawSearch}
          onChange={(e) => {
            setRawSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Pesquisar por nome ou nº de colaborador…"
          className="w-72"
        />
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          + Nova compensação
        </Button>
      </div>

      {isLoading && <Skeleton rows={8} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Nenhum colaborador com compensação registada"
          description="Os registos criam-se a partir do detalhe de um colaborador ou com “+ Nova compensação”."
        />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[820px] overflow-hidden rounded-card border border-border bg-surface">
            <div
              className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}
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
                className={`${COLS} cursor-pointer items-center border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken`}
                onClick={() => onOpenDetail(r.userId)}
              >
                <div className="min-w-0">
                  <div className="truncate font-body text-sm font-medium text-ink">
                    {r.user.fullName}
                  </div>
                  <div className="truncate font-mono text-xs text-ink-faint">
                    {r.user.employeeNumber ?? '—'}
                  </div>
                </div>
                <div className="truncate font-body text-sm text-ink-muted">
                  {r.user.department?.name ?? '—'}
                </div>
                <div className="font-mono text-sm font-semibold text-ink">
                  {fmtKz(r.baseSalary)}
                </div>
                <div className="font-mono text-sm text-ink-muted">
                  {fmtKz(r.foodAllowance)}
                </div>
                <div className="font-mono text-sm text-ink-muted">
                  {fmtKz(r.transportAllowance)}
                </div>
                <div className="font-body text-sm text-ink-muted">
                  {fmtDate(r.effectiveFrom)}
                </div>
                <div className="font-body text-sm text-ink-muted">
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
