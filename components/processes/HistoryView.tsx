// components/processes/HistoryView.tsx
// Aba «Histórico e Auditoria» (docs/Modulo_Processes.md §13): linha temporal
// cronológica e filtrável, detalhe de cada evento, tentativas de integração e
// automação, e exportação mediante autorização (com justificação registada).
// Só leitura: não existe — nem deve existir — acção para apagar o histórico.

'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Download, ScrollText } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { API_URL } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { useToast } from '@/providers/ToastProvider';
import { AuditEventPanel } from './AuditEventPanel';
import { ATTEMPT_STATUS_MAP, AUDIT_RESULT_MAP, AUDIT_SOURCE_MAP } from './audit-utils';
import { ReasonDialog } from './ReasonDialog';
import { Skeleton } from './Skeleton';
import type {
  AuditFilterOptions,
  PaginatedAuditAttempts,
  PaginatedAuditEvents,
} from './types';

export interface HistoryViewProps {
  canExport: boolean;
  onOpenInstance: (instanceId: number) => void;
}

const ALL = 'ALL';
type Mode = 'timeline' | 'attempts';

interface Filters {
  search: string;
  userId: string;
  action: string;
  source: string;
  result: string;
  from: string;
  to: string;
}
const EMPTY: Filters = { search: '', userId: ALL, action: ALL, source: ALL, result: ALL, from: '', to: '' };

const toParams = (f: Filters): Record<string, string> => {
  const p: Record<string, string> = {};
  if (f.search.trim()) p.search = f.search.trim();
  if (f.from) p.from = f.from;
  if (f.to) p.to = f.to;
  (['userId', 'action', 'source', 'result'] as const).forEach((k) => {
    if (f[k] !== ALL) p[k] = f[k];
  });
  return p;
};

export function HistoryView({ canExport, onOpenInstance }: HistoryViewProps) {
  const notify = useToast();
  const [mode, setMode] = useState<Mode>('timeline');
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [askExport, setAskExport] = useState(false);
  const [attemptKind, setAttemptKind] = useState('ALL');
  const [attemptStatus, setAttemptStatus] = useState(ALL);
  const [attemptPage, setAttemptPage] = useState(1);

  const baseParams = useMemo(() => toParams(filters), [filters]);
  const params = useMemo(() => ({ ...baseParams, page: String(page), limit: '25' }), [baseParams, page]);

  const { data, isLoading, error } = useApiQuery<PaginatedAuditEvents>(
    queryKeys.processes.auditEvents(params),
    '/processes/audit/events',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData, enabled: mode === 'timeline' },
  );
  const { data: options } = useApiQuery<AuditFilterOptions>(
    queryKeys.processes.auditOptions(),
    '/processes/audit/filter-options',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const attemptParams = {
    kind: attemptKind,
    ...(attemptStatus !== ALL ? { status: attemptStatus } : {}),
    page: String(attemptPage),
    limit: '20',
  };
  const attempts = useApiQuery<PaginatedAuditAttempts>(
    queryKeys.processes.auditAttempts(attemptParams),
    '/processes/audit/attempts',
    { params: attemptParams, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData, enabled: mode === 'attempts' },
  );

  const set = (patch: Partial<Filters>) => {
    setFilters((p) => ({ ...p, ...patch }));
    setPage(1);
  };
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  const doExport = async (reason: string) => {
    setExporting(true);
    try {
      const qs = new URLSearchParams({ ...baseParams, reason }).toString();
      const res = await fetch(`${API_URL}/processes/audit/export?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao exportar a auditoria');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'auditoria-processos.csv';
      a.click();
      URL.revokeObjectURL(url);
      setAskExport(false);
    } catch (e) {
      notify({ title: e instanceof Error ? e.message : 'Falha ao exportar', intent: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {([
          ['timeline', 'Linha temporal'],
          ['attempts', 'Integrações e automações'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
        {mode === 'timeline' && canExport && (
          <Button intent="secondary" size="sm" className="ml-auto" onClick={() => setAskExport(true)}>
            <Download size={14} strokeWidth={1.75} />
            Exportar CSV
          </Button>
        )}
      </div>

      {mode === 'timeline' && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              placeholder="Procurar processo, justificação ou erro…"
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
              className="w-72"
            />
            <Select
              items={[{ value: ALL, label: 'Todos os utilizadores' }, ...(options?.users ?? []).map((u) => ({ value: String(u.id), label: u.fullName }))]}
              value={filters.userId}
              onValueChange={(v) => set({ userId: v })}
              className="w-52"
            />
            <Select
              items={[{ value: ALL, label: 'Todos os eventos' }, ...(options?.actions ?? [])]}
              value={filters.action}
              onValueChange={(v) => set({ action: v })}
              className="w-60"
            />
            <Select
              items={[
                { value: ALL, label: 'Todas as origens' },
                { value: 'INTERFACE', label: 'Interface' },
                { value: 'API', label: 'API / integração' },
                { value: 'AUTOMATION', label: 'Automação' },
                { value: 'SYSTEM', label: 'Sistema' },
              ]}
              value={filters.source}
              onValueChange={(v) => set({ source: v })}
              className="w-48"
            />
            <Select
              items={[
                { value: ALL, label: 'Qualquer resultado' },
                { value: 'SUCCESS', label: 'Sucesso' },
                { value: 'FAILED', label: 'Falhou' },
              ]}
              value={filters.result}
              onValueChange={(v) => set({ result: v })}
              className="w-44"
            />
            <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
              De
              <Input type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
              Até
              <Input type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
            </label>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY);
                  setPage(1);
                }}
                className="pb-2 font-body text-xs text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {isLoading && <Skeleton rows={6} />}
          {error && <div className="font-body text-sm text-danger">{error.message}</div>}
          {data && data.data.length === 0 && (
            <EmptyState
              icon={ScrollText}
              title="Sem eventos"
              description={hasFilters ? 'Nenhum evento corresponde aos filtros.' : 'Ainda não há actividade registada.'}
              className="mx-auto max-w-xl"
            />
          )}
          {data && data.data.length > 0 && (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Data e hora</TableHeaderCell>
                    <TableHeaderCell>Evento</TableHeaderCell>
                    <TableHeaderCell>Utilizador</TableHeaderCell>
                    <TableHeaderCell>Processo</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Origem</TableHeaderCell>
                    <TableHeaderCell>Resultado</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((e) => (
                    <TableRow key={e.id} className="cursor-pointer hover:bg-surface-sunken" onClick={() => setOpenId(e.id)}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(e.createdAt)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{e.label}</div>
                        {e.reason && <div className="max-w-xs truncate text-xs text-ink-muted">{e.reason}</div>}
                      </TableCell>
                      <TableCell>
                        {e.actor.fullName}
                        {e.actor.role && <div className="text-xs text-ink-faint">{e.actor.role}</div>}
                      </TableCell>
                      <TableCell>{e.instance?.code ?? e.template?.code ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {e.previousStatus || e.newStatus ? `${e.previousStatus ?? '—'} → ${e.newStatus ?? '—'}` : '—'}
                      </TableCell>
                      <TableCell>{e.source && <StatusBadge value={e.source} map={AUDIT_SOURCE_MAP} />}</TableCell>
                      <TableCell>
                        <StatusBadge value={e.result} map={AUDIT_RESULT_MAP} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between font-body text-xs text-ink-faint">
                <span>{data.total} evento(s)</span>
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {mode === 'attempts' && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <Select
              items={[
                { value: 'ALL', label: 'Integrações e automações' },
                { value: 'INTEGRATION', label: 'Só integrações' },
                { value: 'AUTOMATION', label: 'Só automações' },
              ]}
              value={attemptKind}
              onValueChange={(v) => {
                setAttemptKind(v);
                setAttemptPage(1);
              }}
              className="w-60"
            />
            <Select
              items={[
                { value: ALL, label: 'Qualquer resultado' },
                { value: 'SUCCESS', label: 'Sucesso' },
                { value: 'FAILED', label: 'Falhas' },
              ]}
              value={attemptStatus}
              onValueChange={(v) => {
                setAttemptStatus(v);
                setAttemptPage(1);
              }}
              className="w-48"
            />
          </div>
          {attempts.isLoading && <Skeleton rows={4} />}
          {attempts.error && <div className="font-body text-sm text-danger">{attempts.error.message}</div>}
          {attempts.data && attempts.data.data.length === 0 && (
            <EmptyState
              icon={ScrollText}
              title="Sem tentativas registadas"
              description="Não há eventos de integração nem execuções de automações com estes filtros."
              className="mx-auto max-w-xl"
            />
          )}
          {attempts.data && attempts.data.data.length > 0 && (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Data e hora</TableHeaderCell>
                    <TableHeaderCell>Tipo</TableHeaderCell>
                    <TableHeaderCell>Origem / regra</TableHeaderCell>
                    <TableHeaderCell>Resultado</TableHeaderCell>
                    <TableHeaderCell>Tentativas</TableHeaderCell>
                    <TableHeaderCell>Erro</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attempts.data.data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(a.at)}</TableCell>
                      <TableCell>{a.kind === 'INTEGRATION' ? 'Integração' : 'Automação'}</TableCell>
                      <TableCell>
                        {a.instanceId ? (
                          <button type="button" onClick={() => onOpenInstance(a.instanceId!)} className="text-primary hover:underline">
                            {a.name}
                          </button>
                        ) : (
                          a.name
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={a.status} map={ATTEMPT_STATUS_MAP} fallback={{ label: a.status, cls: 'bg-surface-sunken text-ink-muted' }} />
                      </TableCell>
                      <TableCell>{a.attempts}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-danger-ink">{a.error ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={attempts.data.page}
                totalPages={Math.max(1, Math.ceil(attempts.data.total / attempts.data.limit))}
                onPageChange={setAttemptPage}
              />
            </>
          )}
        </>
      )}

      {openId !== null && (
        <AuditEventPanel
          eventId={openId}
          onClose={() => setOpenId(null)}
          onOpenEvent={setOpenId}
          onOpenInstance={(id) => {
            setOpenId(null);
            onOpenInstance(id);
          }}
        />
      )}
      {askExport && (
        <ReasonDialog
          title="Exportar auditoria"
          description="A exportação respeita os filtros actuais e fica registada na auditoria."
          label="Motivo da exportação"
          confirmLabel="Exportar"
          loading={exporting}
          onConfirm={doExport}
          onClose={() => setAskExport(false)}
        />
      )}
    </div>
  );
}
