// components/payroll/ReportsView.tsx
// Relatórios do Payroll (docs/payroll.md §9): GET /payroll/reports/:type
// com filtros de período/ano/mês/departamento/estado. Exporta CSV no cliente.
'use client';

import { ExportMenu } from '@/components/ui/ExportMenu';
import { exportTable, type ExportFormat } from '@/lib/tableExport';
import { useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Landmark,
  type LucideIcon,
  MapPin,
  ShieldCheck,
  TrendingDown,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildCsv } from '@/lib/csv';
import { KpiCard } from '@/components/ui/KpiCard';
import { WalletStat } from '@/components/roi-impact/WalletStat';
import { useDepartmentOptions } from './runData';
import { thisMonth } from './periodOptions';
import type { ReportResult } from './insightTypes';
import { saveBlob } from '@/lib/download';

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

// Totalizadores apresentados como carteira (igual ao Fecho Salarial).
const WALLET_STYLE: Record<
  string,
  {
    tone: 'blue' | 'green' | 'orange' | 'red';
    money: 'bills' | 'coins' | 'stack' | 'mixed' | 'fan';
    image?: string;
  }
> = {
  employees: {
    tone: 'blue',
    money: 'coins',
    image: '/images/colaboradores.png',
  },
  payslips: { tone: 'blue', money: 'mixed', image: '/images/recibos.png' },
  totalGross: { tone: 'blue', money: 'bills' },
  totalNet: { tone: 'green', money: 'stack' },
  totalDeductions: { tone: 'orange', money: 'mixed' },
  totalInss: { tone: 'orange', money: 'coins' },
  totalIrt: { tone: 'orange', money: 'coins' },
  totalEmployerCost: { tone: 'red', money: 'bills' },
};

// Ícone e cor por totalizador: azul neutro, verde positivo, laranja
// deduções/pendentes, vermelho custo/problema.
const TOTAL_STYLE: Record<
  string,
  { icon: LucideIcon; intent: 'primary' | 'success' | 'warning' | 'danger' }
> = {
  employees: { icon: Users, intent: 'primary' },
  payslips: { icon: FileText, intent: 'primary' },
  totalGross: { icon: Banknote, intent: 'primary' },
  totalNet: { icon: Wallet, intent: 'success' },
  totalDeductions: { icon: TrendingDown, intent: 'warning' },
  totalInss: { icon: ShieldCheck, intent: 'warning' },
  totalIrt: { icon: Landmark, intent: 'warning' },
  totalEmployerCost: { icon: Building2, intent: 'danger' },
  issued: { icon: CheckCircle2, intent: 'success' },
  pending: { icon: Clock, intent: 'warning' },
  disputed: { icon: AlertTriangle, intent: 'danger' },
  payments: { icon: CreditCard, intent: 'primary' },
  totalAmount: { icon: Coins, intent: 'primary' },
  paid: { icon: CheckCircle2, intent: 'success' },
  failed: { icon: XCircle, intent: 'danger' },
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

function exportReport(
  report: ReportResult,
  columns: string[],
  format: ExportFormat,
) {
  if (format !== 'csv') {
    void exportTable(format, {
      title: `Relatório de folha de pagamento — ${report.type}`,
      filename: `payroll-${report.type}`,
      headers: columns.map((c) => COLUMN_LABEL[c] ?? c),
      rows: report.rows.map((r) =>
        columns.map((c) => (format === 'pdf' ? cell(c, r[c]) : r[c])),
      ),
    });
    return;
  }
  const csv = buildCsv(
    columns.map((c) => COLUMN_LABEL[c] ?? c),
    report.rows.map((r) => columns.map((c) => r[c])),
    ';',
  );
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveBlob(blob, `payroll-${report.type}.csv`);
}

export function ReportsView() {
  const [type, setType] = useState('monthly-payroll');
  const [period, setPeriod] = useState(thisMonth());
  const [pYear, pMonth] = period.split('-');
  const year = pYear || String(new Date().getFullYear());
  const month = pMonth ? String(Number(pMonth)) : '';
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
  const gridCols = `repeat(${columns.length}, minmax(7rem, 1fr))`;

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
          type="month"
          variant="underline"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Período (mês e ano)"
          className="w-44"
        />
        <Select
          variant="underline"
          icon={MapPin}
          items={STATUS_ITEMS}
          value={status}
          onValueChange={setStatus}
          className="w-44"
        />
        <Select
          variant="underline"
          icon={Building2}
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
          <div className="ml-auto">
            <ExportMenu
              onExport={(format) => exportReport(data, columns, format)}
            />
          </div>
        )}
      </div>

      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {data && (
        <div className="space-y-6">
          {Object.entries(data.totals).some(([k]) => k in WALLET_STYLE) && (
            <div className="grid grid-cols-1 items-start gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Object.entries(data.totals)
                .filter(([k]) => k in WALLET_STYLE)
                .map(([k, v]) => (
                  <WalletStat
                    key={k}
                    zoom
                    image={WALLET_STYLE[k].image ?? '/images/carteira.png'}
                    money={WALLET_STYLE[k].money}
                    tone={WALLET_STYLE[k].tone}
                    label={TOTAL_LABEL[k] ?? k}
                    value={COUNT_TOTALS.has(k) ? v : fmtKz(v)}
                  />
                ))}
            </div>
          )}
          {Object.entries(data.totals).some(([k]) => !(k in WALLET_STYLE)) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Object.entries(data.totals)
                .filter(([k]) => !(k in WALLET_STYLE))
                .map(([k, v]) => (
                  <KpiCard
                    key={k}
                    icon={TOTAL_STYLE[k]?.icon}
                    intent={TOTAL_STYLE[k]?.intent}
                    label={TOTAL_LABEL[k] ?? k}
                    value={COUNT_TOTALS.has(k) ? v : fmtKz(v)}
                  />
                ))}
            </div>
          )}

          {data.rows.length === 0 ? (
            <EmptyState
              title="Sem dados para os filtros escolhidos"
              description="Ajuste o período ou limpe os filtros."
            />
          ) : (
            <div className="overflow-x-auto rounded-[18px] border border-brand-line bg-surface shadow-[0_4px_12px_rgba(21,47,89,0.10)]">
              <div className="min-w-fit">
                <div
                  className="grid items-center gap-x-6 bg-brand-dark px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  {columns.map((c) => (
                    <div key={c}>{COLUMN_LABEL[c] ?? c}</div>
                  ))}
                </div>
                {data.rows.map((r, i) => (
                  <div
                    key={`${r.key ?? i}`}
                    className="grid items-center gap-x-6 border-b border-brand-line px-4 py-[11px] last:border-0"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    {columns.map((c) => (
                      <div
                        key={c}
                        className="truncate font-body text-xs font-semibold text-ink"
                      >
                        {cell(c, r[c])}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
