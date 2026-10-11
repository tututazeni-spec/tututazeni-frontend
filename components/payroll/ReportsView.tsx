// components/payroll/ReportsView.tsx
// Relatórios do Payroll (docs/payroll.md §9): GET /payroll/reports/:type
// com filtros de período/ano/mês/departamento/estado. Exporta CSV no cliente.
'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { useDepartmentOptions } from './runData';
import type { ReportResult } from './insightTypes';

const REPORT_ITEMS = [
  { value: 'monthly-payroll', label: 'Folha salarial mensal' },
  { value: 'earnings', label: 'Remunerações, subsídios, extra e prémios' },
  { value: 'deductions', label: 'Deduções, INSS e IRT' },
  { value: 'by-department', label: 'Salários por departamento' },
  { value: 'by-unit', label: 'Salários por unidade' },
  { value: 'by-position', label: 'Salários por cargo' },
  { value: 'evolution', label: 'Evolução e variação mensal' },
  { value: 'receipts', label: 'Recibos emitidos / pendentes' },
  { value: 'payments', label: 'Pagamentos' },
];

const STATUS_ITEMS = [
  { value: 'all', label: 'Todos os estados' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ISSUED', label: 'Emitido' },
  { value: 'ACKNOWLEDGED', label: 'Confirmado' },
  { value: 'DISPUTED', label: 'Em disputa' },
];

const COLUMN_LABEL: Record<string, string> = {
  key: 'Grupo',
  period: 'Período',
  employees: 'Colaboradores',
  totalGross: 'Bruto',
  totalNet: 'Líquido',
  totalDeductions: 'Deduções',
  totalEmployerCost: 'Custo patronal',
  totalEarnings: 'Remunerações',
  baseSalary: 'Salário base',
  allowances: 'Subsídios',
  overtime: 'Horas extra',
  bonuses: 'Prémios',
  inss: 'INSS',
  irt: 'IRT',
  other: 'Outras',
  variationPct: 'Variação %',
  total: 'Total',
  issued: 'Emitidos',
  acknowledged: 'Confirmados',
  disputed: 'Em disputa',
  pending: 'Pendentes',
  bankName: 'Banco',
  employeeCount: 'Colaboradores',
  totalAmount: 'Valor',
  expectedDate: 'Prevista',
  effectiveDate: 'Efectiva',
  status: 'Estado',
  reference: 'Referência',
};

const COUNT_COLS = new Set([
  'employees',
  'employeeCount',
  'total',
  'issued',
  'acknowledged',
  'disputed',
  'pending',
]);

const TOTAL_LABEL: Record<string, string> = {
  employees: 'Colaboradores',
  payslips: 'Recibos',
  totalGross: 'Total bruto',
  totalNet: 'Total líquido',
  totalDeductions: 'Total deduções',
  totalInss: 'INSS',
  totalIrt: 'IRT',
  totalEmployerCost: 'Custo patronal',
  issued: 'Emitidos',
  pending: 'Pendentes',
  disputed: 'Em disputa',
  payments: 'Pagamentos',
  totalAmount: 'Valor total',
  paid: 'Pagos',
  failed: 'Falhados',
};

const COUNT_TOTALS = new Set([
  'employees',
  'payslips',
  'issued',
  'pending',
  'disputed',
  'payments',
  'paid',
  'failed',
]);

function cell(col: string, v: string | number | null): string {
  if (v === null || v === undefined || v === '') return '—';
  if (col === 'variationPct') return `${v}%`;
  if (typeof v === 'number' && !COUNT_COLS.has(col)) return fmtKz(v);
  return String(v);
}

function exportCsv(report: ReportResult, columns: string[]) {
  const head = columns.map((c) => COLUMN_LABEL[c] ?? c).join(';');
  const body = report.rows.map((r) =>
    columns.map((c) => String(r[c] ?? '').replace(/;/g, ',')).join(';'),
  );
  const blob = new Blob([[head, ...body].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payroll-${report.type}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsView() {
  const [type, setType] = useState('monthly-payroll');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState('');
  const [status, setStatus] = useState('all');
  const [departmentId, setDepartmentId] = useState('all');
  const { options: depOptions } = useDepartmentOptions();

  const params: Record<string, string> = {};
  if (/^\d{4}$/.test(year)) params.year = year;
  if (month && Number(month) >= 1 && Number(month) <= 12) params.month = month;
  if (status !== 'all') params.status = status;
  if (departmentId !== 'all') params.departmentId = departmentId;

  const { data, isLoading, error } = useApiQuery<ReportResult>(
    queryKeys.payroll.section('report', { type, ...params }),
    `/payroll/reports/${type}`,
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const columns = data?.rows[0] ? Object.keys(data.rows[0]) : [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          items={REPORT_ITEMS}
          value={type}
          onValueChange={setType}
          className="w-72"
        />
        <Input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Ano"
          className="w-24"
        />
        <Input
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="Mês (1-12)"
          className="w-28"
        />
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={setStatus}
          className="w-44"
        />
        <Select
          items={[
            { value: 'all', label: 'Todos os departamentos' },
            ...depOptions.map((d) => ({
              value: String(d.value),
              label: d.label,
            })),
          ]}
          value={departmentId}
          onValueChange={setDepartmentId}
          className="w-56"
        />
        {data && data.rows.length > 0 && (
          <Button
            className="ml-auto"
            intent="secondary"
            onClick={() => exportCsv(data, columns)}
          >
            Exportar CSV
          </Button>
        )}
      </div>

      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Object.entries(data.totals).map(([k, v]) => (
              <KpiCard
                key={k}
                label={TOTAL_LABEL[k] ?? k}
                value={COUNT_TOTALS.has(k) ? v : fmtKz(v)}
              />
            ))}
          </div>

          {data.rows.length === 0 ? (
            <EmptyState
              title="Sem dados para os filtros escolhidos"
              description="Ajuste o período ou limpe os filtros."
            />
          ) : (
            <div className="overflow-hidden rounded-[14px] border border-[#1E3A66] bg-[#071D3B] shadow-[0_4px_16px_rgba(7,29,59,0.35)]">
              <table className="w-full text-left font-body text-xs">
                <thead className="bg-[#0B2D5B]">
                  <tr>
                    {columns.map((c) => (
                      <th
                        key={c}
                        className="px-2 py-3 text-xs font-bold uppercase leading-tight tracking-wide text-white"
                      >
                        {COLUMN_LABEL[c] ?? c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr
                      key={`${r.key ?? i}`}
                      className="border-b border-[#6F8FB8]/20 transition-colors duration-150 last:border-0 hover:bg-white/5"
                    >
                      {columns.map((c) => (
                        <td
                          key={c}
                          className="px-2 py-3 text-white"
                        >
                          {cell(c, r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
