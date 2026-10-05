// components/payroll/EmployeesView.tsx
// Colaboradores do processamento (docs/payroll.md §3):
// GET /payroll/runs/:id/employees; ao abrir um colaborador mostra a ficha
// salarial (GET /payroll/employees/:userId).
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { RunPicker } from './RunPicker';
import type { Paginated } from './types';
import type { EmployeeProfile, RunEmployeeRow } from './insightTypes';

const TH =
  'whitespace-nowrap px-3 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint';
const TD = 'whitespace-nowrap px-3 py-3';

function EmployeeProfileView({
  userId,
  onBack,
}: {
  userId: number;
  onBack: () => void;
}) {
  const { data, isLoading, error } = useApiQuery<EmployeeProfile>(
    queryKeys.payroll.section('employee', userId),
    `/payroll/employees/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-4">
        ← Voltar
      </Button>
      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {data && (
        <div className="space-y-6 font-body text-sm">
          <div className="rounded-card border border-border bg-surface p-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              {data.user.fullName}
            </h2>
            <p className="mt-1 text-ink-muted">
              Nº {data.user.employeeNumber ?? '—'} · NIF {data.user.nif ?? '—'}{' '}
              · NIB {data.user.nib ?? '—'}
            </p>
            <p className="text-ink-muted">
              {data.user.position?.name ?? '—'} ·{' '}
              {data.user.department?.name ?? '—'}
              {data.user.unit ? ` · ${data.user.unit.name}` : ''}
            </p>
          </div>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Remuneração base e componentes
            </h3>
            {data.compensation ? (
              <div className="rounded-card border border-border bg-surface p-4 text-ink-muted">
                <p>
                  Salário base:{' '}
                  <span className="font-mono text-ink">
                    {fmtKz(data.compensation.baseSalary)}
                  </span>{' '}
                  (desde {fmtDate(data.compensation.effectiveFrom)})
                </p>
                <p>
                  Alimentação {fmtKz(data.compensation.foodAllowance)} ·
                  Transporte {fmtKz(data.compensation.transportAllowance)}
                  {data.compensation.bankName
                    ? ` · Banco ${data.compensation.bankName}`
                    : ''}
                </p>
                {data.compensation.components.length > 0 && (
                  <ul className="mt-2 list-disc pl-5">
                    {data.compensation.components.map((c) => (
                      <li key={c.id}>
                        {c.componentCode}: {fmtKz(c.value)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <EmptyState
                title="Sem compensação registada"
                description="Defina a remuneração base em Compensações."
              />
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Histórico salarial
            </h3>
            <ul className="space-y-1 text-ink-muted">
              {data.salaryHistory.map((h) => (
                <li key={h.id}>
                  {fmtDate(h.effectiveFrom)} →{' '}
                  {h.effectiveTo ? fmtDate(h.effectiveTo) : 'actual'}:{' '}
                  <span className="font-mono text-ink">
                    {fmtKz(h.baseSalary)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Recibos e pagamentos
            </h3>
            <div className="overflow-x-auto rounded-card border border-border bg-surface">
              <table className="w-full min-w-[520px] text-left">
                <thead className="border-b border-border">
                  <tr>
                    <th className={TH}>Período</th>
                    <th className={TH}>Recibo</th>
                    <th className={TH}>Líquido</th>
                    <th className={TH}>Estado</th>
                    <th className={TH}>Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payslips.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className={`${TD} font-mono`}>{p.period}</td>
                      <td className={`${TD} text-ink-muted`}>
                        {p.receiptCode ?? '—'}
                      </td>
                      <td className={`${TD} font-mono`}>
                        {fmtKz(p.netSalary)}
                      </td>
                      <td className={`${TD} text-ink-muted`}>{p.status}</td>
                      <td className={`${TD} text-ink-muted`}>
                        {p.paymentDate ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function EmployeesView() {
  const [runId, setRunId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);

  const params: Record<string, string | number> = { page, limit: 30 };
  if (search.trim()) params.search = search.trim();

  const { data, isLoading, error } = useApiQuery<Paginated<RunEmployeeRow>>(
    queryKeys.payroll.section('employees', { runId, ...params }),
    `/payroll/runs/${runId}/employees`,
    {
      params,
      enabled: runId !== null,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  if (userId !== null)
    return (
      <EmployeeProfileView userId={userId} onBack={() => setUserId(null)} />
    );

  const rows = data?.data ?? [];
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <RunPicker
          value={runId}
          onChange={(id) => {
            setRunId(id);
            setPage(1);
          }}
        />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Nome ou nº de colaborador"
          className="w-64"
        />
      </div>

      {runId === null && (
        <EmptyState
          title="Escolha um processamento"
          description="Seleccione o run para ver a situação salarial de cada colaborador."
        />
      )}
      {runId !== null && isLoading && <Skeleton rows={8} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {runId !== null && !isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Sem colaboradores neste processamento"
          description="Processe o run para gerar os recibos."
        />
      )}

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full min-w-[1200px] text-left font-body text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className={TH}>Colaborador</th>
                  <th className={TH}>Nº</th>
                  <th className={TH}>NIF</th>
                  <th className={TH}>Departamento</th>
                  <th className={TH}>Cargo</th>
                  <th className={`${TH} text-right`}>Base</th>
                  <th className={`${TH} text-right`}>Subsídios</th>
                  <th className={`${TH} text-right`}>Extra</th>
                  <th className={`${TH} text-right`}>Prémios</th>
                  <th className={`${TH} text-right`}>Faltas</th>
                  <th className={`${TH} text-right`}>INSS</th>
                  <th className={`${TH} text-right`}>IRT</th>
                  <th className={`${TH} text-right`}>Outras ded.</th>
                  <th className={`${TH} text-right`}>Bruto</th>
                  <th className={`${TH} text-right`}>Líquido</th>
                  <th className={`${TH} text-right`}>Custo patronal</th>
                  <th className={TH}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.payslipId}
                    onClick={() => setUserId(r.userId)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-sunken"
                  >
                    <td className={`${TD} font-medium text-ink`}>
                      {r.fullName}
                      {r.hasExceptions && (
                        <span className="ml-2 text-xs text-warning-ink">⚠</span>
                      )}
                    </td>
                    <td className={`${TD} text-ink-muted`}>
                      {r.employeeNumber ?? '—'}
                    </td>
                    <td className={`${TD} text-ink-muted`}>{r.nif ?? '—'}</td>
                    <td className={`${TD} text-ink-muted`}>
                      {r.department ?? '—'}
                    </td>
                    <td className={`${TD} text-ink-muted`}>
                      {r.position ?? '—'}
                    </td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.baseSalary)}
                    </td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.allowances)}
                    </td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.overtime)}
                    </td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.bonuses)}
                    </td>
                    <td className={`${TD} text-right`}>{r.absenceDays}</td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.inss)}
                    </td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.irt)}
                    </td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.otherDeductions)}
                    </td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.grossSalary)}
                    </td>
                    <td className={`${TD} text-right font-mono font-medium`}>
                      {fmtKz(r.netSalary)}
                    </td>
                    <td className={`${TD} text-right font-mono`}>
                      {fmtKz(r.employerCost)}
                    </td>
                    <td className={`${TD} text-ink-muted`}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
