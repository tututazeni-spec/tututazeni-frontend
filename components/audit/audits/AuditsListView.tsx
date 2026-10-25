// components/audit/audits/AuditsListView.tsx
// Lista de auditorias: KPIs, filtros e tabela (apresentação). Dados e filtros
// vêm de hooks/useInternalAuditsList.ts.

import {
  CheckCircle2,
  ClipboardCheck,
  Hourglass,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { InternalAuditListController } from '@/hooks/useInternalAuditsList';
import { STATUS, TYPES, typeLabel } from './constants';
import { fmtDay } from './logic';
import { StatusPill } from './shared';
import type { InternalAuditStatus } from '../types';

interface AuditsListViewProps {
  list: InternalAuditListController;
  onOpen: (id: number) => void;
  onCreate: () => void;
}

export function AuditsListView({
  list,
  onOpen,
  onCreate,
}: AuditsListViewProps) {
  const {
    filters,
    setFilter,
    page,
    setPage: onPageChange,
    data,
    isLoading,
    countsByStatus: by,
  } = list;

  const statusItems = [
    { value: 'ALL', label: 'Todos os estados' },
    ...(Object.keys(STATUS) as InternalAuditStatus[]).map((s) => ({
      value: s,
      label: STATUS[s].label,
    })),
  ];
  const typeItems = [{ value: 'ALL', label: 'Todos os tipos' }, ...TYPES];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardCheck}
          label="Em execução"
          value={by.IN_PROGRESS ?? 0}
        />
        <KpiCard
          icon={Search}
          label="Em revisão"
          value={by.IN_REVIEW ?? 0}
          intent="warning"
        />
        <KpiCard
          icon={Hourglass}
          label="A aguardar ações corretivas"
          value={by.AWAITING_CORRECTIVE_ACTIONS ?? 0}
          intent="warning"
          iconIntent="caution"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Concluídas"
          value={by.COMPLETED ?? 0}
          intent="success"
        />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            items={statusItems}
            value={filters.status || 'ALL'}
            onValueChange={(v) => setFilter({ status: v === 'ALL' ? '' : v })}
            className="w-56"
          />
          <Select
            items={typeItems}
            value={filters.type || 'ALL'}
            onValueChange={(v) => setFilter({ type: v === 'ALL' ? '' : v })}
            className="w-44"
          />
          <Input
            type="text"
            placeholder="Código ou título"
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            className="w-48"
          />
          <Button className="ml-auto" size="sm" onClick={onCreate}>
            <Plus size={14} /> Nova auditoria
          </Button>
        </div>

        {isLoading || !data ? (
          <Skeleton rows={6} />
        ) : (
          <>
            <Table>
              <TableHead className="bg-brand/60">
                <TableRow className="hover:bg-transparent">
                  {[
                    'Código',
                    'Título',
                    'Tipo',
                    'Auditor',
                    'Prazo',
                    'Verif.',
                    'Constat.',
                    'Ações',
                    'Estado',
                  ].map((h) => (
                    <TableHeaderCell key={h} className="text-white">
                      {h}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => onOpen(a.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-sunken"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-data text-xs text-ink">
                      {a.code}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2.5 font-body text-xs font-medium text-ink">
                      {a.title}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {typeLabel(a.type)}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink">
                      {a.leadAuditor?.fullName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
                      {fmtDay(a.dueDate)}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {a.counts.checks}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {a.counts.findings}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {a.counts.actions}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                ))}
                {data.data.length === 0 && (
                  <TableRow>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                    >
                      Sem auditorias registadas
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
