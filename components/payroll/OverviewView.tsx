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
import { ShareGaugeCard } from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
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
      {/* Cartas largas: um montante de 7+ dígitos em Kz (ex.: 1 234 567 Kz) tem de caber inteiro. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
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
            <ShareGaugeCard
              label="Total"
              value={data.employees.total}
              total={data.employees.total}
            />
            <ShareGaugeCard
              label="Processados"
              value={data.employees.processed}
              total={data.employees.total}
            />
            <ShareGaugeCard
              label="Pendentes"
              value={data.employees.pending}
              total={data.employees.total}
              lowerIsBetter
            />
          </Section>

          <Section title="Valores">
            <ShareGaugeCard
              label="Salário bruto"
              value={data.financials.totalGross}
              total={data.financials.totalGross}
              caption={fmtKz(data.financials.totalGross)}
              showPercent
            />
            <ShareGaugeCard
              label="Salário líquido"
              value={data.financials.totalNet}
              total={data.financials.totalGross}
              caption={fmtKz(data.financials.totalNet)}
              showPercent
            />
            <ShareGaugeCard
              label="Remunerações"
              value={data.financials.totalEarnings}
              total={data.financials.totalGross}
              caption={fmtKz(data.financials.totalEarnings)}
              showPercent
            />
            <ShareGaugeCard
              label="Deduções"
              value={data.financials.totalDeductions}
              total={data.financials.totalGross}
              caption={fmtKz(data.financials.totalDeductions)}
              showPercent
              lowerIsBetter
            />
            <ShareGaugeCard
              label="INSS"
              value={data.financials.totalInss}
              total={data.financials.totalGross}
              caption={fmtKz(data.financials.totalInss)}
              showPercent
              lowerIsBetter
            />
            <ShareGaugeCard
              label="IRT"
              value={data.financials.totalIrt}
              total={data.financials.totalGross}
              caption={fmtKz(data.financials.totalIrt)}
              showPercent
              lowerIsBetter
            />
            <ShareGaugeCard
              label="Encargos patronais"
              value={data.financials.employerCharges}
              total={data.financials.totalPersonnelCost}
              caption={fmtKz(data.financials.employerCharges)}
              showPercent
              lowerIsBetter
            />
            <ShareGaugeCard
              label="Custo total com pessoal"
              value={data.financials.totalPersonnelCost}
              total={data.financials.totalPersonnelCost}
              caption={fmtKz(data.financials.totalPersonnelCost)}
              showPercent
            />
            <ShareGaugeCard
              label="Total a pagar"
              value={data.financials.totalPayable}
              total={data.financials.totalPersonnelCost}
              caption={fmtKz(data.financials.totalPayable)}
              showPercent
            />
          </Section>

          <Section title="Recibos e pagamentos">
            <DonutStatCard
              label="Recibos emitidos"
              value={data.receipts.issued + data.receipts.pending > 0 ? (data.receipts.issued / (data.receipts.issued + data.receipts.pending)) * 100 : 0}
              sub={`${data.receipts.issued} de ${data.receipts.issued + data.receipts.pending}`}
            />
            <ShareGaugeCard
              label="Recibos pendentes"
              value={data.receipts.pending}
              total={data.receipts.issued + data.receipts.pending}
              lowerIsBetter
            />
            <ShareGaugeCard
              label="Pagamentos pendentes"
              value={data.pendingPayments}
              total={data.employees.total}
              lowerIsBetter
            />
          </Section>
        </div>
      )}
    </div>
  );
}
