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
        className="mb-4 flex items-center gap-1 font-body text-sm text-ink-muted"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Voltar
      </button>

      <div className="rounded-[14px] border border-brand-edge bg-brand-deep shadow-[0_4px_16px_rgba(7,29,59,0.35)] mb-6 overflow-hidden">
        <div className="flex items-center gap-3 bg-brand-dark px-4 py-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              {run.period}
              {run.payGroup ? ` · ${run.payGroup}` : ''}
            </h2>
            <p className="font-body text-sm text-on-brand">{run.countryCode}</p>
          </div>
          <StatusBadge
            value={run.status}
            map={RUN_STATUS_MAP}
            variant="dot"
            className="ml-auto"
          />
        </div>

        <dl className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
          {TOTALS.map(([label, getValue]) => (
            <div
              key={label}
              className="rounded-[10px] border border-[#6F8FB8]/20 bg-white/5 p-3"
            >
              <dt className="font-body text-xs text-white">{label}</dt>
              <dd className="font-body text-sm font-semibold text-white">
                {getValue(run)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
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

      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-label">
        Cronologia
      </h3>
      <ol className="mb-8 grid gap-5 rounded-[14px] border border-brand-edge bg-brand-deep px-5 py-4 shadow-[0_4px_16px_rgba(7,29,59,0.35)] sm:grid-flow-col sm:auto-cols-fr sm:gap-0">
        {run.timeline.map((t, i) => {
          const last = i === run.timeline.length - 1;
          const next = run.timeline[i + 1];
          return (
            <li key={t.step} className="flex gap-3 sm:flex-col sm:gap-3">
              <div className="flex items-center sm:w-full">
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${
                    t.at ? 'bg-[#4ADE80]' : 'bg-[#6F8FB8]/40'
                  }`}
                />
                {!last && (
                  <span
                    className={`ml-2 hidden h-0.5 flex-1 rounded-full sm:block ${
                      next?.at ? 'bg-[#4ADE80]' : 'bg-[#6F8FB8]/30'
                    }`}
                  />
                )}
              </div>
              <div className="min-w-0 pr-3">
                <p className="font-body text-sm font-semibold text-white">
                  {TIMELINE_LABEL[t.step] ?? t.step}
                </p>
                <p className="font-body text-sm text-white">
                  {t.at ? fmtDateTime(t.at) : '—'}
                </p>
                {t.by && (
                  <p className="break-words font-body text-xs text-on-brand">
                    {t.by.fullName}
                  </p>
                )}
              </div>
            </li>
          );
        })}
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
