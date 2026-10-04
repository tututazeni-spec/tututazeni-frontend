// components/payroll/ClosureView.tsx
// Fecho Salarial (docs/payroll.md §8): validação RH + financeira,
// checklist e fecho definitivo (GET/POST /payroll/runs/:id/closure/*).
'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import { RunPicker } from './RunPicker';
import { RUN_STATUS_MAP } from './types';
import type { ClosureOverview } from './insightTypes';

function Validation({
  label,
  info,
  onValidate,
  pending,
  disabled,
}: {
  label: string;
  info: { at: string; by: string | null } | null;
  onValidate: () => void;
  pending: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
      <div>
        <div className="font-body text-sm font-medium text-ink">{label}</div>
        <div className="font-body text-xs text-ink-muted">
          {info
            ? `Validado por ${info.by ?? '—'} em ${fmtDate(info.at)}`
            : 'Por validar'}
        </div>
      </div>
      {!info && (
        <Button
          size="sm"
          loading={pending}
          disabled={disabled}
          onClick={onValidate}
        >
          Validar
        </Button>
      )}
    </div>
  );
}

export function ClosureView() {
  const notify = useToast();
  const [runId, setRunId] = useState<number | null>(null);

  const { data, isLoading, error } = useApiQuery<ClosureOverview>(
    queryKeys.payroll.section('closure', runId),
    `/payroll/runs/${runId}/closure`,
    { enabled: runId !== null, staleTime: STALE_TIME.DYNAMIC },
  );

  const act = useApiMutation(
    (action: 'validate-hr' | 'validate-finance' | 'close') =>
      apiClient.post<ClosureOverview>(
        `/payroll/runs/${runId}/closure/${action}`,
      ),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: (res) =>
        notify({
          title: res.closed ? 'Folha fechada' : 'Validação registada',
          intent: 'success',
        }),
    },
  );

  const done = data?.checklist.filter((i) => i.ok).length ?? 0;

  return (
    <div>
      <div className="mb-5">
        <RunPicker value={runId} onChange={setRunId} />
      </div>

      {runId === null && (
        <EmptyState
          title="Escolha um processamento"
          description="O fecho encerra definitivamente a folha depois das validações e do pagamento."
        />
      )}
      {runId !== null && isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 font-body text-sm text-ink-muted">
            Período <span className="font-mono text-ink">{data.period}</span>
            <StatusBadge
              value={data.status as keyof typeof RUN_STATUS_MAP}
              map={RUN_STATUS_MAP}
              variant="dot"
            />
            {data.closed && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-white">
                Fechada em {data.closedAt ? fmtDate(data.closedAt) : '—'} por{' '}
                {data.closedBy ?? '—'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <KpiCard label="Colaboradores" value={data.totals.employees} />
            <KpiCard
              label="Total bruto"
              value={fmtKz(data.totals.totalGross)}
            />
            <KpiCard
              label="Total líquido"
              value={fmtKz(data.totals.totalNet)}
              intent="success"
            />
            <KpiCard
              label="Impostos (INSS + IRT)"
              value={fmtKz(data.totals.totalTaxes)}
            />
            <KpiCard
              label="Encargos patronais"
              value={fmtKz(data.totals.totalEmployerCharges)}
            />
            <KpiCard
              label="Recibos emitidos"
              value={data.totals.receiptsIssued}
            />
            <KpiCard
              label="Pagamentos processados"
              value={data.totals.paymentsProcessed}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-card border border-border bg-surface px-4 py-3">
              <div className="font-body text-sm font-medium text-ink">
                Aprovação
              </div>
              <div className="font-body text-xs text-ink-muted">
                {data.approval
                  ? `Aprovado por ${data.approval.by ?? '—'} em ${fmtDate(data.approval.at)}`
                  : 'Por aprovar'}
              </div>
            </div>
            <Validation
              label="Validação RH"
              info={data.hrValidation}
              pending={act.isPending && act.variables === 'validate-hr'}
              disabled={data.closed || act.isPending}
              onValidate={() => act.mutate('validate-hr')}
            />
            <Validation
              label="Validação financeira"
              info={data.financeValidation}
              pending={act.isPending && act.variables === 'validate-finance'}
              disabled={data.closed || act.isPending}
              onValidate={() => act.mutate('validate-finance')}
            />
          </div>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Checklist ({done}/{data.checklist.length})
            </h3>
            <ul className="space-y-1.5 rounded-card border border-border bg-surface p-4 font-body text-sm">
              {data.checklist.map((i) => (
                <li
                  key={i.code}
                  className={i.ok ? 'text-success-ink' : 'text-ink-muted'}
                >
                  {i.ok ? '✓' : '○'} {i.label}
                </li>
              ))}
            </ul>
          </section>

          {!data.closed && (
            <div className="flex items-center gap-3">
              <Button
                intent="danger"
                disabled={!data.canClose}
                loading={act.isPending && act.variables === 'close'}
                onClick={() => act.mutate('close')}
              >
                Fechar folha
              </Button>
              {!data.canClose && (
                <span className="font-body text-xs text-ink-muted">
                  Requer checklist completa e as duas validações.
                </span>
              )}
            </div>
          )}
          {data.closed && (
            <p className="font-body text-xs text-ink-muted">
              A folha está protegida contra alterações normais.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
