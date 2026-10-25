// components/history/OrgChangesTab.tsx
// Aba "Alterações Organizacionais" (docs/history.md §5): histórico da
// estrutura da empresa (departamentos e responsáveis). Só os departamentos
// têm registo de alterações no sistema — unidades não são auditadas.
// Desenho: cartão claro com uma linha por alteração, o mesmo da lista de
// sessões da aba Programação dos eventos.

'use client';

import { queryKeys } from '@/lib/queryKeys';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { PersonCell, fmtDate, useHubList } from './shared';
import type { OrgChange } from './types';

const CARD =
  'overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]';

interface CellProps {
  label: string;
  className: string;
  children: React.ReactNode;
}

function Cell({ label, className, children }: CellProps) {
  return (
    <div className={className}>
      <div className="font-body text-micro text-brand-muted">{label}</div>
      <div className="font-body text-sm font-medium text-brand">{children}</div>
    </div>
  );
}

export function OrgChangesTab() {
  const list = useHubList<OrgChange>(
    queryKeys.history.orgChanges,
    '/history/org-changes',
  );

  if (list.query.isLoading && list.rows.length === 0)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="space-y-2"
        itemClassName="skeleton-shimmer h-12 rounded-card"
      />
    );
  if (list.query.error)
    return (
      <p className="rounded-card border border-danger bg-danger-subtle p-4 text-sm text-danger-ink">
        {list.query.error.message}
      </p>
    );
  if (list.rows.length === 0)
    return (
      <EmptyState
        title="Sem registos"
        description="Não há dados reais para os filtros seleccionados."
      />
    );

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-faint">{list.total} registos</p>
      <div className={CARD}>
        {list.rows.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-brand-line bg-white px-5 py-4 last:border-0"
          >
            <div className="min-w-[200px] flex-1">
              <div className="font-body text-[15px] font-semibold text-brand">
                {o.change}
              </div>
              <div className="font-body text-xs text-brand-muted">
                {[fmtDate(o.timestamp), o.unit, o.department]
                  .filter(Boolean)
                  .join(' · ')}
                {o.field ? ` · ${o.field}` : ''}
              </div>
            </div>
            <Cell label="Valor anterior" className="w-40">
              {o.before ?? '–'}
            </Cell>
            <Cell label="Novo valor" className="w-40">
              {o.after ?? '–'}
            </Cell>
            <div className="w-52">
              <div className="mb-0.5 font-body text-micro text-brand-muted">
                Responsável
              </div>
              <PersonCell person={o.responsible} />
            </div>
            <Cell label="Motivo" className="w-40">
              {o.reason ?? '–'}
            </Cell>
          </div>
        ))}
      </div>
      <Pagination
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
      />
    </div>
  );
}
