// components/payroll/OverviewView.tsx
// Visão Geral do processamento salarial (docs/payroll.md §1) —
// GET /payroll/overview?period=.
'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RUN_STATUS_MAP } from './types';
import type { PayrollOverview } from './insightTypes';

const thisMonth = () => new Date().toISOString().slice(0, 7);

const ALERT_CLS = {
  info: 'border-info/30 bg-info-subtle text-info-ink',
  warning: 'border-warning/30 bg-warning-subtle text-warning-ink',
  error: 'border-danger/30 bg-danger-subtle text-danger-ink',
} as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">{children}</div>
    </section>
  );
}

export function OverviewView() {
  const [period, setPeriod] = useState(thisMonth());
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
  const { data, isLoading, error } = useApiQuery<PayrollOverview>(
    queryKeys.payroll.section('overview', period),
    '/payroll/overview',
    { params: { period }, enabled: valid, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="Período (AAAA-MM)"
          className="w-44"
        />
        {data?.run && (
          <div className="flex items-center gap-2 font-body text-sm text-ink-muted">
            Estado da folha:
            <StatusBadge
              value={data.run.status as keyof typeof RUN_STATUS_MAP}
              map={RUN_STATUS_MAP}
              variant="dot"
            />
            {data.run.closed && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-white">
                Fechada
              </span>
            )}
          </div>
        )}
      </div>

      {!valid && (
        <div className="font-body text-sm text-danger">
          Período inválido — use AAAA-MM.
        </div>
      )}
      {valid && isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {data && (
        <div className="space-y-8">
          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((a) => (
                <div
                  key={a.code}
                  className={`rounded-card border px-4 py-2.5 font-body text-sm ${ALERT_CLS[a.severity]}`}
                >
                  {a.message}
                </div>
              ))}
            </div>
          )}

          <Section title="Colaboradores">
            <KpiCard label="Total" value={data.employees.total} />
            <KpiCard
              label="Processados"
              value={data.employees.processed}
              intent="success"
            />
            <KpiCard
              label="Pendentes"
              value={data.employees.pending}
              intent={data.employees.pending > 0 ? 'warning' : 'primary'}
            />
          </Section>

          <Section title="Valores">
            <KpiCard
              label="Salário bruto"
              value={fmtKz(data.financials.totalGross)}
            />
            <KpiCard
              label="Salário líquido"
              value={fmtKz(data.financials.totalNet)}
              intent="success"
              trend={data.monthlyVariation?.pct}
              sub={`Anterior (${data.previous.period}): ${fmtKz(data.previous.totalNet)}`}
            />
            <KpiCard
              label="Remunerações"
              value={fmtKz(data.financials.totalEarnings)}
            />
            <KpiCard
              label="Deduções"
              value={fmtKz(data.financials.totalDeductions)}
              intent="warning"
            />
            <KpiCard label="INSS" value={fmtKz(data.financials.totalInss)} />
            <KpiCard label="IRT" value={fmtKz(data.financials.totalIrt)} />
            <KpiCard
              label="Encargos patronais"
              value={fmtKz(data.financials.employerCharges)}
            />
            <KpiCard
              label="Custo total com pessoal"
              value={fmtKz(data.financials.totalPersonnelCost)}
              intent="info"
            />
            <KpiCard
              label="Total a pagar"
              value={fmtKz(data.financials.totalPayable)}
              intent="primary"
            />
          </Section>

          <Section title="Recibos e pagamentos">
            <KpiCard
              label="Recibos emitidos"
              value={data.receipts.issued}
              intent="success"
            />
            <KpiCard
              label="Recibos pendentes"
              value={data.receipts.pending}
              intent={data.receipts.pending > 0 ? 'warning' : 'primary'}
            />
            <KpiCard
              label="Pagamentos pendentes"
              value={data.pendingPayments}
              intent={data.pendingPayments > 0 ? 'warning' : 'primary'}
            />
          </Section>
        </div>
      )}
    </div>
  );
}
