// components/dashboard-rh/PayrollPanel.tsx
// Painel "Folha Salarial" — resumo bruto/líquido/deduções por período.
// Dados próprios (useApiQuery, parametrizado pelo mês seleccionado) +
// apresentação. Período no formato "AAAA-MM" (Payslip.period).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PayrollData } from './types';

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const money = (v?: number) =>
  new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(v ?? 0);

export function PayrollPanel() {
  const [period, setPeriod] = useState(currentPeriod());

  const { data, isLoading: loading } = useApiQuery<PayrollData>(
    queryKeys.dashboardRh.payroll(period),
    '/dashboard-rh/payroll',
    { params: { period }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <label className="font-body text-xs font-medium text-ink-muted" htmlFor="payroll-period">
          Período
        </label>
        <Input
          id="payroll-period"
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-40"
        />
      </div>

      {loading ? (
        <Skeleton
          rows={4}
          wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
          itemClassName="h-24 rounded-card bg-surface-sunken"
        />
      ) : !data?.headcount ? (
        <p className="font-body text-sm text-ink-faint">
          Sem recibos processados para {period}.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Recibos Processados"
            value={data.headcount}
            intent="primary"
            className="w-full"
          />
          <KpiCard
            label="Massa Salarial Bruta"
            value={money(data.totalGross)}
            intent="info"
            className="w-full"
          />
          <KpiCard
            label="Massa Salarial Líquida"
            value={money(data.totalNet)}
            intent="success"
            className="w-full"
          />
          <KpiCard
            label="Deduções Totais"
            value={money(data.totalDeductions)}
            intent="warning"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
