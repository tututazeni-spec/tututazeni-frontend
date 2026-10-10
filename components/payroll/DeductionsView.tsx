// components/payroll/DeductionsView.tsx
// Deduções & Impostos (docs/payroll.md §5): totais por tipo, INSS, IRT por
// escalão e regras fiscais do ano (GET /payroll/deductions).
'use client';

import { Fragment, useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { KpiCard } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DeductionsSummary } from './insightTypes';

const thisMonth = () => new Date().toISOString().slice(0, 7);
const pct = (r: number) => `${(r * 100).toFixed(2).replace(/\.?0+$/, '')}%`;

const TH =
  'px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint';
const H3 =
  'mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint';

export function DeductionsView() {
  const [period, setPeriod] = useState(thisMonth());
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
  const { data, isLoading, error } = useApiQuery<DeductionsSummary>(
    queryKeys.payroll.section('deductions', period),
    '/payroll/deductions',
    { params: { period }, enabled: valid, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <div className="mb-5">
        <Input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="Período (AAAA-MM)"
          className="w-44"
        />
      </div>
      {valid && isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {data && data.employees === 0 && (
        <EmptyState
          title="Sem recibos neste período"
          description="As deduções aparecem depois de o processamento calcular os recibos."
        />
      )}

      {data && data.employees > 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <KpiCard
              label="Base contributiva INSS"
              value={fmtKz(data.inss.contributoryBase)}
            />
            <KpiCard
              label="INSS trabalhador"
              value={fmtKz(data.inss.employeeTotal)}
            />
            <KpiCard
              label="INSS patronal"
              value={fmtKz(data.inss.employerTotal)}
              intent="info"
            />
            <KpiCard
              label="IRT retido"
              value={fmtKz(data.irt.withheld)}
              intent="warning"
            />
          </div>

          <section>
            <h3 className={H3}>Por tipo de dedução</h3>
            <div className="overflow-x-auto rounded-card border border-border bg-surface">
              <table className="w-full min-w-[560px] text-left font-body text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className={TH}>Tipo</th>
                    <th className={TH}>Obrigatório</th>
                    <th className={TH}>Colaboradores</th>
                    <th className={`${TH} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.types.map((t) => (
                    <tr
                      key={t.code}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-ink">{t.name}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {t.mandatory ? 'Sim' : 'Não'}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {t.employeesAffected}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink">
                        {fmtKz(t.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className={H3}>IRT por escalão aplicado</h3>
            <div className="overflow-x-auto rounded-card border border-border bg-surface">
              <table className="w-full min-w-[420px] text-left font-body text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className={TH}>Escalão</th>
                    <th className={TH}>Colaboradores</th>
                    <th className={`${TH} text-right`}>IRT</th>
                  </tr>
                </thead>
                <tbody>
                  {data.irt.byBracket.map((b) => (
                    <tr
                      key={b.bracket}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-ink">{b.bracket}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {b.employees}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink">
                        {fmtKz(b.irt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {data?.config && (
        <section className="mt-8">
          <h3 className={H3}>
            Regras fiscais {data.config.taxYear} ({data.config.countryCode})
          </h3>
          <div className="rounded-[14px] border border-[#1E3A66] bg-[#071D3B] p-4 font-body text-sm text-white shadow-[0_4px_16px_rgba(7,29,59,0.35)]">
            <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-[#9DB4D3]">INSS trabalhador</dt>
              <dd>{pct(data.config.socialSecurity.employeeRate)}</dd>
              <dt className="text-[#9DB4D3]">INSS patronal</dt>
              <dd>{pct(data.config.socialSecurity.employerRate)}</dd>
              <dt className="text-[#9DB4D3]">Tecto INSS</dt>
              <dd>
                {data.config.socialSecurity.ceiling
                  ? fmtKz(data.config.socialSecurity.ceiling)
                  : '—'}
              </dd>
              <dt className="text-[#9DB4D3]">Salário mínimo</dt>
              <dd>{fmtKz(data.config.minimumWage)}</dd>
            </dl>
            <div className="mt-3 grid grid-cols-[1fr_1fr_80px_1fr] gap-x-4 gap-y-1.5 border-t border-[#6F8FB8]/20 pt-3 text-[#CFE3FF]">
              <div className="text-xs font-bold uppercase tracking-wide text-white">De</div>
              <div className="text-xs font-bold uppercase tracking-wide text-white">Até</div>
              <div className="text-xs font-bold uppercase tracking-wide text-white">Taxa</div>
              <div className="text-xs font-bold uppercase tracking-wide text-white">Parcela a abater</div>
              {data.config.irtBrackets.map((b) => (
                <Fragment key={b.id}>
                  <div>{fmtKz(b.min)}</div>
                  <div>{b.max == null ? '∞' : fmtKz(b.max)}</div>
                  <div>{pct(b.rate)}</div>
                  <div>{b.deduction ? fmtKz(b.deduction) : '—'}</div>
                </Fragment>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
