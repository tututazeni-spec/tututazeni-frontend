// components/processes/InstancesView.tsx
// Aba «Todos os Processos» (docs/Modulo_Processes.md §4): lista central das
// instâncias de processo com todos os campos do §4, filtros completos,
// acções por registo (ver, editar, reatribuir, prioridade, suspender/retomar,
// cancelar com justificação, duplicar, histórico, arquivar) e exportação.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Download, MoreHorizontal } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient, API_URL } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import {
  DEADLINE_MAP,
  INSTANCE_STATUS_MAP,
  PRIORITY_MAP,
  fmtElapsed,
} from './constants';
import {
  AssignInstanceModal,
  EditInstanceModal,
  InstanceHistoryModal,
} from './InstanceDialogs';
import { ReasonDialog } from './ReasonDialog';
import { Skeleton } from './Skeleton';
import { UserPicker } from './UserPicker';
import type {
  InstanceFilterOptions,
  InstanceRow,
  PaginatedInstances,
  ProcessPriority,
} from './types';

export interface InstancesViewProps {
  /** ADMIN/RH/GESTOR: vê tudo e pode gerir. Os restantes só vêem os seus. */
  canManage: boolean;
  onOpenInstance: (instanceId: number) => void;
}

const ALL = 'ALL';
const opt = (label: string, items: Array<{ value: string; label: string }>) => [
  { value: ALL, label },
  ...items,
];

const STATUS_ITEMS = opt('Todos os estados', [
  { value: 'IN_PROGRESS', label: 'Em execução' },
  { value: 'ON_HOLD', label: 'Suspenso' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
]);
const PRIORITY_ITEMS = opt(
  'Todas as prioridades',
  (Object.keys(PRIORITY_MAP) as ProcessPriority[]).map((p) => ({
    value: p,
    label: PRIORITY_MAP[p].label,
  })),
);
const DEADLINE_ITEMS = opt('Qualquer prazo', [
  { value: 'overdue', label: 'Atrasados' },
  { value: 'due_soon', label: 'Vencem em 48h' },
]);

interface Filters {
  search: string;
  status: string;
  priority: string;
  sourceModule: string;
  departmentId: string;
  unitId: string;
  templateId: string;
  category: string;
  requesterId: string;
  responsibleId: string;
  deadline: string;
  createdFrom: string;
  createdTo: string;
  dueFrom: string;
  dueTo: string;
  archived: boolean;
}

const EMPTY: Filters = {
  search: '',
  status: '',
  priority: '',
  sourceModule: '',
  departmentId: '',
  unitId: '',
  templateId: '',
  category: '',
  requesterId: '',
  responsibleId: '',
  deadline: '',
  createdFrom: '',
  createdTo: '',
  dueFrom: '',
  dueTo: '',
  archived: false,
};

function buildParams(f: Filters, page?: number, limit?: number) {
  const p: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v === '' || v === false) continue;
    p[k] = v as string | boolean;
  }
  if (page) p.page = page;
  if (limit) p.limit = limit;
  return p;
}

type Dialog =
  | { kind: 'edit' | 'assign' | 'history'; row: InstanceRow }
  | { kind: 'cancel' | 'suspend' | 'resume'; row: InstanceRow }
  | null;

function remaining(row: InstanceRow): string {
  if (row.remainingHours === null) return '';
  return row.remainingHours < 0
    ? `${fmtElapsed(Math.abs(row.remainingHours))} em atraso`
    : `faltam ${fmtElapsed(row.remainingHours)}`;
}

export function InstancesView({ canManage, onOpenInstance }: InstancesViewProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 300);
  const params = buildParams({ ...filters, search: debouncedSearch }, page, 15);

  const { data, isLoading, error } = useApiQuery<PaginatedInstances>(
    queryKeys.processes.instances(params),
    '/processes/instances/list',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const { data: options } = useApiQuery<InstanceFilterOptions>(
    queryKeys.processes.instanceFilters(),
    '/processes/instances/filter-options',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const setSelect = (key: keyof Filters) => (v: string) =>
    set(key, (v === ALL ? '' : v) as never);
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  const act = useApiMutation(
    (v: { path: string; method?: 'patch' | 'post'; body?: Record<string, unknown>; ok: string }) =>
      apiClient[v.method ?? 'patch'](`/processes/instances/${v.path}`, v.body ?? {}),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: (_d, v) => {
        notify({ title: v.ok, intent: 'success' });
        setDialog(null);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const cancel = useApiMutation(
    (v: { id: number; reason: string }) =>
      apiClient.patch(`/processes/instances/${v.id}/cancel`, { reason: v.reason }),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Processo cancelado', intent: 'success' });
        setDialog(null);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const duplicate = async (row: InstanceRow) => {
    if (
      !(await confirm({
        title: 'Duplicar processo?',
        message: `Inicia uma nova instância do modelo ${row.template.code} com os mesmos dados de abertura.`,
        confirmLabel: 'Duplicar',
      }))
    )
      return;
    act.mutate({ path: `${row.id}/duplicate`, method: 'post', ok: 'Processo duplicado' });
  };

  const archive = async (row: InstanceRow) => {
    if (
      !(await confirm({
        title: 'Arquivar processo?',
        message: 'O processo sai da lista activa; o histórico mantém-se.',
        confirmLabel: 'Arquivar',
      }))
    )
      return;
    act.mutate({ path: `${row.id}/archive`, ok: 'Processo arquivado' });
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams(
        Object.entries(buildParams({ ...filters, search: debouncedSearch })).map(
          ([k, v]) => [k, String(v)],
        ),
      );
      const res = await fetch(`${API_URL}/processes/instances/export?${qs}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Falha ao exportar os processos');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'processos.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notify({ title: e instanceof Error ? e.message : 'Falha ao exportar', intent: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const idItems = (label: string, rows: Array<{ id: number; name?: string; title?: string; code?: string }> = []) =>
    opt(label, rows.map((r) => ({ value: String(r.id), label: r.name ?? `${r.title} (${r.code})` })));

  const moduleItems = opt(
    'Todos os módulos',
    (options?.sourceModules ?? []).map((m) => ({ value: m, label: m })),
  );
  const categoryItems = opt(
    'Todos os tipos',
    (options?.categories ?? []).map((c) => ({ value: c, label: c })),
  );

  return (
    <div>
      {/* Filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="text"
            placeholder="Pesquisar por código, nome ou entidade…"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="min-w-[160px] flex-1"
          />
          <Select items={STATUS_ITEMS} value={filters.status || ALL} onValueChange={setSelect('status')} className="w-44" />
          <Select items={PRIORITY_ITEMS} value={filters.priority || ALL} onValueChange={setSelect('priority')} className="w-44" />
          <Select items={DEADLINE_ITEMS} value={filters.deadline || ALL} onValueChange={setSelect('deadline')} className="w-44" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select items={moduleItems} value={filters.sourceModule || ALL} onValueChange={setSelect('sourceModule')} className="w-44" />
          <Select items={categoryItems} value={filters.category || ALL} onValueChange={setSelect('category')} className="w-44" />
          <Select items={idItems('Todos os modelos', options?.templates)} value={filters.templateId || ALL} onValueChange={setSelect('templateId')} className="w-52" />
          <Select items={idItems('Todos os departamentos', options?.departments)} value={filters.departmentId || ALL} onValueChange={setSelect('departmentId')} className="w-52" />
          <Select items={idItems('Todas as unidades', options?.units)} value={filters.unitId || ALL} onValueChange={setSelect('unitId')} className="w-48" />
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-52">
              <UserPicker value={filters.requesterId} onChange={(v) => set('requesterId', v)} placeholder="Solicitante" />
            </div>
            <div className="w-52">
              <UserPicker value={filters.responsibleId} onChange={(v) => set('responsibleId', v)} placeholder="Responsável actual" />
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 font-body text-xs text-ink-muted">
          <label className="flex items-center gap-2">
            Criado de
            <Input type="date" value={filters.createdFrom} onChange={(e) => set('createdFrom', e.target.value)} className="w-40" />
          </label>
          <label className="flex items-center gap-2">
            até
            <Input type="date" value={filters.createdTo} onChange={(e) => set('createdTo', e.target.value)} className="w-40" />
          </label>
          <label className="flex items-center gap-2">
            Prazo de
            <Input type="date" value={filters.dueFrom} onChange={(e) => set('dueFrom', e.target.value)} className="w-40" />
          </label>
          <label className="flex items-center gap-2">
            até
            <Input type="date" value={filters.dueTo} onChange={(e) => set('dueTo', e.target.value)} className="w-40" />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.archived}
              onChange={(e) => set('archived', e.target.checked)}
            />
            Só arquivados
          </label>
          {filtersActive && (
            <Button intent="ghost" size="sm" onClick={() => { setFilters(EMPTY); setPage(1); }}>
              Limpar filtros
            </Button>
          )}
          <span className="ml-auto text-ink-faint">{data?.total ?? 0} processos</span>
          {canManage && (
            <Button intent="secondary" size="sm" onClick={exportCsv} loading={exporting}>
              <Download size={14} strokeWidth={1.75} />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[1180px]">
          <div className="grid grid-cols-[1.8fr_1.1fr_1.3fr_1.1fr_90px_110px_130px_1.1fr_40px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Processo</div>
            <div>Tipo / Origem</div>
            <div>Solicitante → Responsável</div>
            <div>Unidade / Departamento</div>
            <div>Prioridade</div>
            <div>Estado</div>
            <div>Progresso</div>
            <div>Prazo</div>
            <div />
          </div>

          {isLoading && (
            <div className="p-4">
              <Skeleton />
            </div>
          )}
          {error && (
            <div className="px-4 py-8 text-center font-body text-sm text-danger">
              {error.message}
            </div>
          )}
          {!isLoading && data?.data.length === 0 && (
            <EmptyState
              title="Sem processos"
              description={
                filtersActive
                  ? 'Nenhum processo corresponde aos filtros.'
                  : 'Ainda não há processos iniciados.'
              }
            />
          )}

          {data?.data.map((r) => (
            <div
              key={r.id}
              className="grid cursor-pointer grid-cols-[1.8fr_1.1fr_1.3fr_1.1fr_90px_110px_130px_1.1fr_40px] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken"
              onClick={() => onOpenInstance(r.id)}
            >
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-medium text-ink">{r.name}</div>
                <div className="font-mono text-xs text-ink-faint">{r.code}</div>
                <div className="truncate font-body text-xs text-ink-muted">
                  {r.entity.type && r.entity.id
                    ? `${r.entity.type} ${r.entity.id}`
                    : r.entity.target.fullName}
                  {r.currentStep ? ` · ${r.currentStep.title}` : ''}
                </div>
              </div>
              <div className="font-body text-xs text-ink-muted">
                <div>{r.type ?? '—'}</div>
                <div className="text-ink-faint">{r.sourceModule ?? '—'}</div>
              </div>
              <div className="font-body text-xs text-ink-muted">
                <div>{r.requester.fullName}</div>
                <div className="text-ink-faint">→ {r.currentResponsible?.fullName ?? 'por atribuir'}</div>
              </div>
              <div className="font-body text-xs text-ink-muted">
                <div>{r.unit?.name ?? '—'}</div>
                <div className="text-ink-faint">{r.department?.name ?? '—'}</div>
              </div>
              <div><StatusBadge value={r.priority} map={PRIORITY_MAP} /></div>
              <div><StatusBadge value={r.status} map={INSTANCE_STATUS_MAP} variant="dot" /></div>
              <div>
                <ProgressBar
                  value={r.progress}
                  intent={r.status === 'COMPLETED' ? 'success' : 'accent'}
                />
                <div className="mt-1 font-body text-xs text-ink-faint">
                  {r.progress}% · {fmtElapsed(r.elapsedHours)}
                </div>
              </div>
              <div className="font-body text-xs">
                <div className="text-ink-muted">{formatDate(r.dueAt)}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  <StatusBadge value={r.deadlineSituation} map={DEADLINE_MAP} />
                  <span className="text-ink-faint">{remaining(r)}</span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-control p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                      aria-label={`Acções de ${r.code}`}
                    >
                      <MoreHorizontal size={16} strokeWidth={1.75} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onOpenInstance(r.id)}>Ver detalhes</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDialog({ kind: 'history', row: r })}>Consultar histórico</DropdownMenuItem>
                    {canManage && (
                      <>
                        <DropdownMenuSeparator />
                        {['IN_PROGRESS', 'ON_HOLD'].includes(r.status) && (
                          <>
                            <DropdownMenuItem onSelect={() => setDialog({ kind: 'edit', row: r })}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDialog({ kind: 'assign', row: r })}>Atribuir / reatribuir</DropdownMenuItem>
                            {(Object.keys(PRIORITY_MAP) as ProcessPriority[])
                              .filter((p) => p !== r.priority)
                              .map((p) => (
                                <DropdownMenuItem
                                  key={p}
                                  onSelect={() =>
                                    act.mutate({
                                      path: `${r.id}/priority`,
                                      body: { priority: p },
                                      ok: `Prioridade: ${PRIORITY_MAP[p].label}`,
                                    })
                                  }
                                >
                                  Prioridade → {PRIORITY_MAP[p].label}
                                </DropdownMenuItem>
                              ))}
                          </>
                        )}
                        {r.status === 'IN_PROGRESS' && (
                          <DropdownMenuItem onSelect={() => setDialog({ kind: 'suspend', row: r })}>Suspender</DropdownMenuItem>
                        )}
                        {r.status === 'ON_HOLD' && (
                          <DropdownMenuItem onSelect={() => setDialog({ kind: 'resume', row: r })}>Retomar</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => duplicate(r)}>Duplicar a partir do modelo</DropdownMenuItem>
                        {['COMPLETED', 'CANCELLED'].includes(r.status) && !r.archived && (
                          <DropdownMenuItem onSelect={() => archive(r)}>Arquivar</DropdownMenuItem>
                        )}
                        {['IN_PROGRESS', 'ON_HOLD'].includes(r.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-danger" onSelect={() => setDialog({ kind: 'cancel', row: r })}>
                              Cancelar…
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      {dialog?.kind === 'edit' && <EditInstanceModal row={dialog.row} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'assign' && <AssignInstanceModal row={dialog.row} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'history' && <InstanceHistoryModal row={dialog.row} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'cancel' && (
        <ReasonDialog
          title={`Cancelar ${dialog.row.code}?`}
          description="O cancelamento exige justificação e não pode ser desfeito."
          confirmLabel="Cancelar processo"
          destructive
          loading={cancel.isPending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => cancel.mutate({ id: dialog.row.id, reason })}
        />
      )}
      {dialog?.kind === 'suspend' && (
        <ReasonDialog
          title={`Suspender ${dialog.row.code}?`}
          description="O tempo em suspensão não conta para o prazo."
          label="Motivo"
          required={false}
          confirmLabel="Suspender"
          loading={act.isPending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) =>
            act.mutate({
              path: `${dialog.row.id}/suspend`,
              body: reason ? { reason } : {},
              ok: 'Processo suspenso',
            })
          }
        />
      )}
      {dialog?.kind === 'resume' && (
        <ReasonDialog
          title={`Retomar ${dialog.row.code}?`}
          description="As etapas rejeitadas voltam a ficar pendentes e o prazo é deslocado pelo tempo suspenso."
          label="Nota"
          required={false}
          confirmLabel="Retomar"
          loading={act.isPending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) =>
            act.mutate({
              path: `${dialog.row.id}/resume`,
              body: reason ? { reason } : {},
              ok: 'Processo retomado',
            })
          }
        />
      )}
    </div>
  );
}
