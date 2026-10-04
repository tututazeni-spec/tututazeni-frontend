// components/audit/ChangesView.tsx
// Aba 04 «Alterações de Dados» (docs/modulo_audit.md §7). Reconstrói as
// alterações campo a campo a partir do AuditLog (valor anterior → posterior).
// Valores pessoais/salariais/bancários vêm ocultados do backend para quem não
// é ADMIN; segredos (palavras-passe, tokens) nunca chegam aqui.

'use client';

import { Fragment, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, FilePenLine, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { BarChart } from '@/components/ui/charts/BarChart';
import { STATUS_CFG, actionLabel, entityLabel } from './constants';
import { EventDetailModal } from './EventDetailModal';
import { fmtTs } from './utils';
import type {
  AuditFilterOptions,
  ChangesSummary,
  DataChange,
  Paginated,
} from './types';

const PERIODS = [7, 30, 90];

const show = (v: unknown): string => {
  if (v === null || v === undefined) return '—';
  return typeof v === 'string' ? v : JSON.stringify(v);
};

function FieldTable({ change }: { change: DataChange }) {
  if (change.fields.length === 0) {
    return (
      <p className="font-body text-xs text-ink-faint">
        Sem comparação campo a campo disponível para este evento.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-control border border-border">
      <div className="grid grid-cols-[180px_1fr_1fr] bg-surface-sunken px-3 py-1.5 font-body text-xs font-semibold text-ink-muted">
        <span>Campo</span>
        <span>Valor anterior</span>
        <span>Valor posterior</span>
      </div>
      {change.fields.map((f) => (
        <div
          key={f.field}
          className="grid grid-cols-[180px_1fr_1fr] gap-2 border-t border-border px-3 py-1.5 font-data text-xs"
        >
          <span className="break-words font-semibold text-ink">{f.field}</span>
          <span className="break-words bg-danger-subtle px-1.5 text-danger-ink">
            {show(f.from)}
          </span>
          <span className="break-words bg-success-subtle px-1.5 text-success-ink">
            {show(f.to)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChangesView() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    entity: '',
    action: '',
    search: '',
    field: '',
    from: '',
    to: '',
  });
  const set = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const { data: summary } = useApiQuery<ChangesSummary>(
    queryKeys.audit.changesSummary(days),
    '/audit/changes/summary',
    { params: { days }, staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: options } = useApiQuery<AuditFilterOptions>(
    queryKeys.audit.filterOptions(),
    '/audit/filter-options',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const params = {
    ...filters,
    from: filters.from
      ? new Date(`${filters.from}T00:00:00`).toISOString()
      : '',
    to: filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : '',
  };
  const { data, isLoading } = useApiQuery<Paginated<DataChange>>(
    queryKeys.audit.changes({ ...params, page }),
    '/audit/changes',
    {
      params: { ...params, page, limit: 20 },
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const entityItems = [
    { value: 'ALL', label: 'Todas as entidades' },
    ...(options?.entities ?? []).map((e) => ({
      value: e,
      label: entityLabel(e),
    })),
  ];
  const actionItems = [
    { value: 'ALL', label: 'Todas as acções' },
    ...(options?.actions ?? []).map((a) => ({
      value: a,
      label: actionLabel(a),
    })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {PERIODS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              days === d
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {!summary ? (
        <Skeleton rows={3} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <KpiCard
              icon={FilePenLine}
              label="Alterações registadas"
              value={summary.totals.changes}
              sub={`Últimos ${summary.periodDays} dias`}
            />
            <KpiCard
              icon={Users}
              label="Autores distintos"
              value={summary.totals.authors}
            />
            <KpiCard
              icon={FilePenLine}
              label="Operações falhadas / negadas"
              value={summary.totals.failed}
              intent={summary.totals.failed > 0 ? 'warning' : 'primary'}
            />
          </div>
          {summary.byEntity.length > 0 && (
            <Card>
              <CardBody>
                <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Entidades mais alteradas
                </div>
                <BarChart
                  categories={summary.byEntity.map((e) =>
                    entityLabel(e.entity),
                  )}
                  series={[
                    {
                      label: 'Alterações',
                      values: summary.byEntity.map((e) => e.count),
                    },
                  ]}
                  height={200}
                />
              </CardBody>
            </Card>
          )}
        </>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            items={entityItems}
            value={filters.entity || 'ALL'}
            onValueChange={(v) => set({ entity: v === 'ALL' ? '' : v })}
            className="w-52"
          />
          <Select
            items={actionItems}
            value={filters.action || 'ALL'}
            onValueChange={(v) => set({ action: v === 'ALL' ? '' : v })}
            className="w-48"
          />
          <Input
            type="text"
            placeholder="Autor (nome, e-mail ou ID)"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-56"
          />
          <Input
            type="text"
            placeholder="Campo alterado"
            value={filters.field}
            onChange={(e) => set({ field: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
            className="w-40"
          />
          <span className="ml-auto font-body text-xs text-ink-faint">
            {data?.total ?? 0} alterações
          </span>
        </div>

        {isLoading || !data ? (
          <Skeleton rows={8} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    '',
                    'Data e hora',
                    'Entidade',
                    'Acção',
                    'Autor',
                    'Origem',
                    'Campos',
                    'Resultado',
                  ].map((h, i) => (
                    <TableHeaderCell key={`${h}${i}`}>{h}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((c) => {
                  const isOpen = expanded === c.id;
                  return (
                    <Fragment key={c.id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : c.id)}
                        className="cursor-pointer border-b border-border hover:bg-surface-sunken"
                      >
                        <td className="w-6 px-3 py-2.5 text-ink-faint">
                          {isOpen ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
                          {fmtTs(c.timestamp)}
                        </td>
                        <td className="px-3 py-2.5 font-body text-xs text-ink">
                          <div className="font-medium">
                            {entityLabel(c.entity)}
                          </div>
                          <div className="text-ink-faint">
                            {c.entityName ??
                              (c.entityId != null ? `#${c.entityId}` : '—')}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-body text-xs font-medium text-ink">
                          {actionLabel(c.action)}
                        </td>
                        <td className="px-3 py-2.5 font-body text-xs text-ink">
                          {c.user?.fullName ?? (
                            <span className="italic text-ink-faint">
                              Sistema
                            </span>
                          )}
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2.5 font-body text-xs text-ink-faint">
                          {c.origin ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                          {c.fields.length}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge value={c.status} map={STATUS_CFG} />
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-border bg-surface-sunken/40">
                          <td colSpan={8} className="space-y-3 px-4 py-3">
                            <FieldTable change={c} />
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-body text-xs text-ink-muted">
                              <span>
                                Justificação:{' '}
                                <span className="text-ink">
                                  {c.reason ?? '—'}
                                </span>
                              </span>
                              <span>
                                Aprovação associada:{' '}
                                <span className="text-ink">
                                  {c.approvalRef ?? '—'}
                                </span>
                              </span>
                              <button
                                onClick={() => setOpenId(c.id)}
                                className="ml-auto font-medium text-primary hover:underline"
                              >
                                Ver detalhes do evento {c.code}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {data.data.length === 0 && (
                  <TableRow>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                    >
                      Sem alterações de dados para os filtros seleccionados
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <EventDetailModal
        eventId={openId}
        onClose={() => setOpenId(null)}
        onOpenEvent={setOpenId}
      />
    </div>
  );
}
