// components/payroll/RunDetailView.tsx
// Detalhe de um PayrollRun: cabeçalho + totais + barra de acções + timeline
// + ExceptionsPanel + RunPayslipsTable. A barra de acções replica
// EXACTAMENTE assertTransition/assertRunEditable do backend
// (payroll-workflow.service.ts) — nunca oferece uma acção que devolveria
// 409/403. reject/cancel usam um painel inline com motivo obrigatório
// (padrão de components/onboarding/PlanDetailModal.tsx); as restantes
// transições passam por useConfirm() antes de disparar (publish/cancel são
// irreversíveis).
'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDateTime as fmtDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { RunPayslipsTable } from './RunPayslipsTable';
import { ExceptionsPanel } from './ExceptionsPanel';
import { RUN_STATUS_MAP, type PayrollRunDetail } from './types';

export interface RunDetailViewProps {
  runId: number;
  onBack: () => void;
}

type Panel = { kind: 'none' } | { kind: 'reject' } | { kind: 'cancel' };

const TIMELINE_LABEL: Record<string, string> = {
  created: 'Criado',
  processed: 'Processado',
  submitted: 'Submetido',
  approved: 'Aprovado',
  published: 'Publicado',
};

const TOTALS: Array<[string, (r: PayrollRunDetail) => string]> = [
  ['Colaboradores', (r) => (r.employeeCount ?? '—').toString()],
  ['Bruto', (r) => fmtKz(r.totalGross)],
  ['Líquido', (r) => fmtKz(r.totalNet)],
  ['Descontos', (r) => fmtKz(r.totalDeductions)],
  ['Custo empregador', (r) => fmtKz(r.totalEmployerCost)],
];

export function RunDetailView({ runId, onBack }: RunDetailViewProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [panel, setPanel] = useState<Panel>({ kind: 'none' });
  const [reason, setReason] = useState('');
  const [highlightPayslipId, setHighlightPayslipId] = useState<number | null>(
    null,
  );

  const {
    data: run,
    isLoading,
    error,
  } = useApiQuery<PayrollRunDetail>(
    queryKeys.payroll.runDetail(runId),
    `/payroll/runs/${runId}`,
    {
      staleTime: STALE_TIME.DYNAMIC,
      // Enquanto o run está PROCESSING (passo síncrono no backend), sonda a
      // cada 3s até transitar para SIMULATED — evita exigir refresh manual.
      refetchInterval: (query) =>
        (query.state.data as PayrollRunDetail | undefined)?.status ===
        'PROCESSING'
          ? 3000
          : false,
    },
  );

  const transition = useApiMutation(
    (action: 'process' | 'submit' | 'approve' | 'publish') =>
      apiClient.post(`/payroll/runs/${runId}/${action}`, {}),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () =>
        notify({ title: 'Estado do run actualizado', intent: 'success' }),
    },
  );

  const rejectMut = useApiMutation(
    (body: { reason: string }) =>
      apiClient.post(`/payroll/runs/${runId}/reject`, body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        notify({ title: 'Run rejeitado', intent: 'success' });
        setPanel({ kind: 'none' });
        setReason('');
      },
    },
  );

  const cancelMut = useApiMutation(
    (body: { reason: string }) =>
      apiClient.post(`/payroll/runs/${runId}/cancel`, body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        notify({ title: 'Run cancelado', intent: 'success' });
        setPanel({ kind: 'none' });
        setReason('');
      },
    },
  );

  const runSimpleAction = async (
    action: 'process' | 'submit' | 'approve' | 'publish',
    title: string,
    message: string,
  ) => {
    const ok = await confirm({ title, message, confirmLabel: 'Confirmar' });
    if (!ok) return;
    transition.mutate(action);
  };

  if (isLoading) return <Skeleton rows={6} />;
  if (error)
    return <div className="font-body text-sm text-danger">{error.message}</div>;
  if (!run) return null;

  const busy =
    transition.isPending || rejectMut.isPending || cancelMut.isPending;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 font-body text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Voltar
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {run.period}
            {run.payGroup ? ` · ${run.payGroup}` : ''}
          </h2>
          <p className="font-body text-sm text-ink-faint">{run.countryCode}</p>
        </div>
        <StatusBadge value={run.status} map={RUN_STATUS_MAP} variant="dot" />
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {TOTALS.map(([label, getValue]) => (
          <div
            key={label}
            className="rounded-card border border-border bg-surface p-3"
          >
            <dt className="font-body text-xs text-ink-faint">{label}</dt>
            <dd className="font-mono text-sm font-semibold text-ink">
              {getValue(run)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        {run.status === 'DRAFT' && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              runSimpleAction(
                'process',
                'Processar run?',
                'Calcula os recibos de todos os colaboradores do âmbito.',
              )
            }
          >
            Processar
          </Button>
        )}
        {run.status === 'SIMULATED' && (
          <>
            <Button
              size="sm"
              intent="secondary"
              disabled={busy}
              onClick={() =>
                runSimpleAction(
                  'process',
                  'Reprocessar run?',
                  'Recria todos os recibos do âmbito — exclusões manuais são repostas.',
                )
              }
            >
              Reprocessar
            </Button>
            <Button
              size="sm"
              disabled={busy || (run.errorCount ?? 0) > 0}
              onClick={() =>
                runSimpleAction(
                  'submit',
                  'Submeter para aprovação?',
                  'O run fica pendente de aprovação.',
                )
              }
            >
              Submeter
            </Button>
            <Button
              size="sm"
              intent="danger"
              disabled={busy}
              onClick={() => {
                setPanel({ kind: 'cancel' });
                setReason('');
              }}
            >
              Cancelar
            </Button>
          </>
        )}
        {run.status === 'PENDING_APPROVAL' && (
          <>
            <Button
              size="sm"
              intent="success"
              disabled={busy}
              onClick={() =>
                runSimpleAction(
                  'approve',
                  'Aprovar run?',
                  'O run avança para publicação.',
                )
              }
            >
              Aprovar
            </Button>
            <Button
              size="sm"
              intent="danger"
              disabled={busy}
              onClick={() => {
                setPanel({ kind: 'reject' });
                setReason('');
              }}
            >
              Rejeitar
            </Button>
            <Button
              size="sm"
              intent="ghost"
              disabled={busy}
              onClick={() => {
                setPanel({ kind: 'cancel' });
                setReason('');
              }}
            >
              Cancelar
            </Button>
          </>
        )}
        {run.status === 'APPROVED' && (
          <>
            <Button
              size="sm"
              intent="success"
              disabled={busy}
              onClick={() =>
                runSimpleAction(
                  'publish',
                  'Publicar run?',
                  'Os recibos ficam visíveis aos colaboradores. Esta acção é irreversível.',
                )
              }
            >
              Publicar
            </Button>
            <Button
              size="sm"
              intent="ghost"
              disabled={busy}
              onClick={() => {
                setPanel({ kind: 'cancel' });
                setReason('');
              }}
            >
              Cancelar
            </Button>
          </>
        )}
      </div>

      {run.status === 'SIMULATED' && (run.errorCount ?? 0) > 0 && (
        <p className="mb-4 font-body text-sm text-danger">
          {`Run tem ${run.errorCount} exceção(ões) de erro — resolver antes de submeter.`}
        </p>
      )}

      {(panel.kind === 'reject' || panel.kind === 'cancel') && (
        <div className="mb-6 rounded-card border border-border bg-surface-sunken p-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full"
            placeholder="Motivo (obrigatório)…"
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              size="sm"
              intent="ghost"
              onClick={() => {
                setPanel({ kind: 'none' });
                setReason('');
              }}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              intent="danger"
              disabled={!reason.trim()}
              loading={
                panel.kind === 'reject'
                  ? rejectMut.isPending
                  : cancelMut.isPending
              }
              onClick={() =>
                panel.kind === 'reject'
                  ? rejectMut.mutate({ reason })
                  : cancelMut.mutate({ reason })
              }
            >
              {panel.kind === 'reject'
                ? 'Confirmar rejeição'
                : 'Confirmar cancelamento'}
            </Button>
          </div>
        </div>
      )}

      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Timeline
      </h3>
      <ol className="mb-8 space-y-2">
        {run.timeline.map((t) => (
          <li
            key={t.step}
            className="flex items-center gap-3 font-body text-sm"
          >
            <span className={t.at ? 'text-success' : 'text-ink-faint'}>●</span>
            <span className="w-24 text-ink-muted">
              {TIMELINE_LABEL[t.step] ?? t.step}
            </span>
            <span className="text-ink">{t.at ? fmtDateTime(t.at) : '—'}</span>
            {t.by && (
              <span className="text-ink-faint">
                · <span>{t.by.fullName}</span>
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className="mb-8">
        <ExceptionsPanel
          runId={runId}
          onSelectException={setHighlightPayslipId}
        />
      </div>
      <RunPayslipsTable
        runId={runId}
        runStatus={run.status}
        highlightPayslipId={highlightPayslipId}
      />
    </div>
  );
}
