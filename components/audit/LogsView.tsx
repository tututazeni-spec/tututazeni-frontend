// components/audit/LogsView.tsx
// Aba 02 «Registos de Auditoria» (docs/modulo_audit.md §4): tabela paginada e
// filtrável. «Módulo» = entidade auditada (AuditLog não tem coluna `module`);
// «Origem» (interface/API/integração) ainda não é gravada, por isso não há
// filtro nem coluna para ela. Sem acções de editar ou eliminar eventos.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { downloadCsv } from '@/components/leave/downloadCsv';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import {
  SEVERITY_CFG,
  STATUS_CFG,
  actionLabel,
  entityLabel,
} from './constants';
import { EventDetailModal } from './EventDetailModal';
import { LogRow } from './LogRow';
import type { AuditFilterOptions, AuditLog, Paginated } from './types';

const EMPTY = {
  search: '',
  entity: '',
  entityId: '',
  action: '',
  severity: '',
  status: '',
  actorType: '',
  departmentId: '',
  from: '',
  to: '',
  criticalOnly: false,
};

const SEVERITY_ITEMS = [
  { value: 'ALL', label: 'Gravidade' },
  ...(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((s) => ({
    value: s,
    label: SEVERITY_CFG[s].label,
  })),
];

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Resultado' },
  ...(['SUCCESS', 'FAILED', 'DENIED'] as const).map((s) => ({
    value: s,
    label: STATUS_CFG[s].label,
  })),
];

const ACTOR_ITEMS = [
  { value: 'ALL', label: 'Utilizadores e sistema' },
  { value: 'USER', label: 'Só utilizadores' },
  { value: 'SYSTEM', label: 'Só processos automáticos' },
];

const HEADERS = [
  '#',
  'Data e hora',
  'Utilizador',
  'Perfil',
  'Módulo',
  'Acção',
  'Registo',
  'Resultado',
  'Gravidade',
  'IP',
  'Acções',
];

export function LogsView() {
  const role = useCurrentRole();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY);
  const [openId, setOpenId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // Datas inclusivas: «até» cobre o dia inteiro.
  const params = {
    search: filters.search,
    entity: filters.entity,
    entityId: filters.entityId,
    action: filters.action,
    severity: filters.severity,
    status: filters.status,
    actorType: filters.actorType,
    departmentId: filters.departmentId,
    from: filters.from
      ? new Date(`${filters.from}T00:00:00`).toISOString()
      : '',
    to: filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : '',
    criticalOnly: filters.criticalOnly ? 'true' : undefined,
  };

  const { data, isLoading: loading } = useApiQuery<Paginated<AuditLog>>(
    queryKeys.audit.list({ ...params, page }),
    '/audit',
    {
      params: { ...params, page, limit: 50 },
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const { data: options } = useApiQuery<AuditFilterOptions>(
    queryKeys.audit.filterOptions(),
    '/audit/filter-options',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const set = (patch: Partial<typeof EMPTY>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const entityItems = [
    { value: 'ALL', label: 'Todos os módulos' },
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
  const departmentItems = [
    { value: 'ALL', label: 'Todos os departamentos' },
    ...(options?.departments ?? []).map((d) => ({
      value: String(d.id),
      label: d.name,
    })),
  ];

  // POST /audit/export é só ADMIN e regista a própria exportação como evento.
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await apiClient.post<{
        exported: number;
        data: Array<Record<string, unknown>>;
      }>('/audit/export', undefined, { params });
      const cols = [
        'id',
        'timestamp',
        'user',
        'action',
        'entity',
        'entityId',
        'severity',
        'status',
        'ip',
        'reason',
      ];
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [
        cols.join(';'),
        ...res.data.map((r) => cols.map((c) => esc(r[c])).join(';')),
      ];
      downloadCsv(
        `auditoria-${new Date().toISOString().slice(0, 10)}.csv`,
        lines.join('\n'),
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Nome, e-mail ou ID do utilizador"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="w-64"
        />
        <Select
          items={entityItems}
          value={filters.entity || 'ALL'}
          onValueChange={(v) => set({ entity: v === 'ALL' ? '' : v })}
          className="w-48"
        />
        <Select
          items={actionItems}
          value={filters.action || 'ALL'}
          onValueChange={(v) => set({ action: v === 'ALL' ? '' : v })}
          className="w-48"
        />
        <Select
          items={STATUS_ITEMS}
          value={filters.status || 'ALL'}
          onValueChange={(v) => set({ status: v === 'ALL' ? '' : v })}
          className="w-36"
        />
        <Select
          items={SEVERITY_ITEMS}
          value={filters.severity || 'ALL'}
          onValueChange={(v) => set({ severity: v === 'ALL' ? '' : v })}
          className="w-40"
        />
        <Select
          items={ACTOR_ITEMS}
          value={filters.actorType || 'ALL'}
          onValueChange={(v) => set({ actorType: v === 'ALL' ? '' : v })}
          className="w-52"
        />
        <Select
          items={departmentItems}
          value={filters.departmentId || 'ALL'}
          onValueChange={(v) => set({ departmentId: v === 'ALL' ? '' : v })}
          className="w-52"
        />
        <label className="flex items-center gap-1 font-body text-xs text-ink-muted">
          De
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
            className="w-40"
          />
        </label>
        <label className="flex items-center gap-1 font-body text-xs text-ink-muted">
          Até
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
            className="w-40"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={filters.criticalOnly}
            onChange={(e) => set({ criticalOnly: e.target.checked })}
            className="rounded accent-primary"
          />
          Só críticos
        </label>
        <Button
          intent="secondary"
          size="sm"
          onClick={() => {
            setFilters(EMPTY);
            setPage(1);
          }}
        >
          Limpar filtros
        </Button>
        {role === 'ADMIN' && (
          <Button
            intent="secondary"
            size="sm"
            disabled={exporting}
            onClick={exportCsv}
          >
            <Download size={14} className="mr-1" />
            {exporting ? 'A exportar…' : 'Exportar CSV'}
          </Button>
        )}
        <span className="ml-auto self-center font-body text-xs text-ink-faint">
          {data?.total ?? 0} registos
        </span>
      </div>

      {loading ? (
        <Skeleton rows={10} />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                {HEADERS.map((h) => (
                  <TableHeaderCell key={h}>{h}</TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.data.map((log) => (
                <LogRow key={log.id} log={log} onOpen={setOpenId} />
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <td
                    colSpan={HEADERS.length}
                    className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                  >
                    Sem registos para os filtros seleccionados
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <EventDetailModal
        eventId={openId}
        onClose={() => setOpenId(null)}
        onOpenEvent={setOpenId}
        onFilterRecord={(entity, entityId) => {
          setFilters({ ...EMPTY, entity, entityId: String(entityId) });
          setPage(1);
          setOpenId(null);
        }}
      />
    </div>
  );
}
