// components/processes/ApprovalsView.tsx
// Aba «Aprovações» (docs/Modulo_Processes.md §7): pedidos de aprovação dos
// processos — as minhas decisões pendentes, os pedidos que submeti e (para a
// gestão) todos. Indicadores, filtros e abertura do painel de decisão.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { CheckCircle2, Clock, Hourglass, Percent, TimerReset } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ApprovalPanel } from './ApprovalPanel';
import { APPROVAL_STATUS_MAP, PRIORITY_MAP, fmtHours } from './constants';
import { Skeleton } from './Skeleton';
import { SOURCE_MODULES } from './StartProcessModal';
import type { PaginatedApprovals } from './approval-types';

export interface ApprovalsViewProps {
  canManage: boolean;
}

type Scope = 'mine' | 'requested' | 'all';

const ALL = 'ALL';
const STATE_ITEMS = [
  { value: 'open', label: 'Em aberto' },
  { value: 'decided', label: 'Decididas' },
  { value: ALL, label: 'Todas' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'INFO_REQUESTED', label: 'Informação pedida' },
  { value: 'ESCALATED', label: 'Escaladas' },
  { value: 'APPROVED', label: 'Aprovadas' },
  { value: 'REJECTED', label: 'Rejeitadas' },
  { value: 'RETURNED', label: 'Devolvidas' },
];

export function ApprovalsView({ canManage }: ApprovalsViewProps) {
  const [scope, setScope] = useState<Scope>('mine');
  const [state, setState] = useState('open');
  const [sourceModule, setSourceModule] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const debounced = useDebounce(search, 300);
  const params = {
    scope,
    page,
    limit: 15,
    ...(state !== ALL ? { status: state } : {}),
    ...(sourceModule ? { sourceModule } : {}),
    ...(overdue ? { overdue: true } : {}),
    ...(debounced ? { search: debounced } : {}),
  };
  const { data, isLoading, error } = useApiQuery<PaginatedApprovals>(
    queryKeys.processes.approvals(params),
    '/processes/approvals',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const reset = () => setPage(1);
  const kpis = data?.kpis;

  const scopeItems = [
    { value: 'mine', label: 'Aguardam a minha decisão' },
    { value: 'requested', label: 'Pedidos submetidos por mim' },
    ...(canManage ? [{ value: 'all', label: 'Todas as aprovações' }] : []),
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <KpiCard icon={Hourglass} label="Pendentes" value={kpis?.pending ?? '—'} intent="info" />
        <KpiCard
          icon={Clock}
          label="Em atraso"
          value={kpis?.overdue ?? '—'}
          intent={kpis && kpis.overdue > 0 ? 'danger' : 'success'}
        />
        <KpiCard icon={CheckCircle2} label="Decididas hoje" value={kpis?.decidedToday ?? '—'} intent="success" />
        <KpiCard
          icon={TimerReset}
          label="Tempo médio de decisão"
          value={kpis ? fmtHours(kpis.avgDecisionHours) : '—'}
          sub="últimos 30 dias"
          intent="accent"
        />
        <KpiCard
          icon={Percent}
          label="Taxa de aprovação"
          value={kpis?.approvalRate != null ? `${kpis.approvalRate}%` : '—'}
          sub="últimos 30 dias"
          intent="primary"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por código, processo ou etapa…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
          className="min-w-[220px] flex-1"
        />
        <Select
          items={scopeItems}
          value={scope}
          onValueChange={(v) => {
            setScope(v as Scope);
            reset();
          }}
          className="w-60"
        />
        <Select
          items={STATE_ITEMS}
          value={state}
          onValueChange={(v) => {
            setState(v);
            reset();
          }}
          className="w-44"
        />
        <Select
          items={[
            { value: ALL, label: 'Todos os módulos' },
            ...SOURCE_MODULES.map((m) => ({ value: m, label: m })),
          ]}
          value={sourceModule || ALL}
          onValueChange={(v) => {
            setSourceModule(v === ALL ? '' : v);
            reset();
          }}
          className="w-48"
        />
        <label className="flex items-center gap-2 font-body text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => {
              setOverdue(e.target.checked);
              reset();
            }}
          />
          Em atraso
        </label>
        <span className="font-body text-sm text-ink-faint">{data?.total ?? 0} pedidos</span>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[1.9fr_1.5fr_1.3fr_110px_110px_130px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Pedido</div>
            <div>Processo / etapa</div>
            <div>Solicitante / aprovador</div>
            <div>Submetido</div>
            <div>Prazo</div>
            <div>Estado</div>
          </div>

          {isLoading && (
            <div className="p-4">
              <Skeleton rows={4} />
            </div>
          )}
          {error && (
            <div className="px-4 py-8 text-center font-body text-sm text-danger">
              {error.message}
            </div>
          )}
          {!isLoading && data?.data.length === 0 && (
            <EmptyState
              title="Sem aprovações"
              description={
                scope === 'mine'
                  ? 'Não há pedidos à espera da sua decisão com estes filtros.'
                  : 'Nenhum pedido corresponde aos filtros.'
              }
            />
          )}

          {data?.data.map((a) => (
            <div
              key={a.id}
              className="grid cursor-pointer grid-cols-[1.9fr_1.5fr_1.3fr_110px_110px_130px] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken"
              onClick={() => setOpenId(a.id)}
            >
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {a.instance.title}
                </div>
                <div className="font-mono text-xs text-ink-faint">{a.code}</div>
                <div className="font-body text-xs text-ink-faint">
                  {a.entity.target.fullName}
                  {a.sourceModule ? ` · ${a.sourceModule}` : ''}
                </div>
              </div>
              <div className="min-w-0 font-body text-xs text-ink-muted">
                <div className="truncate">{a.process.title}</div>
                <div className="flex items-center gap-1.5 text-ink-faint">
                  {a.step.title}
                  <StatusBadge value={a.instance.priority} map={PRIORITY_MAP} />
                </div>
              </div>
              <div className="font-body text-xs text-ink-muted">
                <div>{a.requester.fullName}</div>
                <div className="text-ink-faint">
                  {a.approver?.fullName ?? (a.approverRole ? `Função ${a.approverRole}` : 'Por atribuir')}
                  {a.escalationLevel > 0 ? ' · escalada' : ''}
                  {a.mode !== 'SEQUENTIAL' || a.sequence > 1 ? ` · ${a.sequence}º aprovador` : ''}
                </div>
              </div>
              <div className="font-body text-xs text-ink-muted">{formatDate(a.submittedAt)}</div>
              <div className={`font-body text-xs ${a.isOverdue ? 'font-medium text-danger' : 'text-ink-muted'}`}>
                {formatDate(a.dueAt)}
                {a.isOverdue && <div>Em atraso</div>}
              </div>
              <div>
                <StatusBadge value={a.status} map={APPROVAL_STATUS_MAP} variant="dot" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      {openId !== null && <ApprovalPanel id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
