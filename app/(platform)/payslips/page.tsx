// src/app/(dashboard)/payslips/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { usePayslipDetail } from '@/hooks/usePayslipDetail';
import { apiClient, API_URL } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate, formatKz as fmtKz } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtPeriod } from '@/components/payslips/format';
import { PAYSLIP_STATUS_MAP, type Payslip } from '@/components/payslips/types';
import { PayslipDetailView } from '@/components/payslips/PayslipDetailView';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginatedPayslips {
  data: Payslip[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AnnualSummary {
  year: string;
  months: number;
  totalGross: number;
  totalNet: number;
  totalIRT: number;
  totalINSSEmployee: number;
  totalINSSEmployer: number;
  totalMealAllowance: number;
  totalVacationAllowance: number;
  totalChristmasAllowance: number;
  totalBonuses: number;
  totalDeductions: number;
  monthlySeries: {
    period: string;
    grossSalary: number;
    netSalary: number;
    incomeTax: number;
    socialSecurity: number;
  }[];
}

interface CompareResult {
  periodA: string;
  periodB: string;
  [key: string]:
    { a: number; b: number; delta: number; pct: number | null } | string;
}

interface SimulateResult {
  grossSalary: number;
  incomeTax: number;
  socialSecurity: number;
  employerInss: number;
  totalDeductions: number;
  netSalary: number;
  irtDetails: {
    bracket: {
      min: number;
      max: number | null;
      rate: number;
      deduction: number;
    };
    formula: string;
    effectiveRate: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Base usada para links directos de PDF/export (navegação do browser com cookie).
const API_BASE = API_URL;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 animate-pulse">
      <div className="flex-1 h-4 bg-gray-100 rounded" />
      <div className="w-24 h-4 bg-gray-100 rounded" />
      <div className="w-32 h-4 bg-gray-100 rounded" />
      <div className="w-20 h-4 bg-gray-100 rounded" />
    </div>
  );
}

interface DeltaBadgeProps {
  delta: number;
  pct: number | null;
}

function DeltaBadge({ delta, pct }: DeltaBadgeProps) {
  if (delta === 0)
    return <span className="text-xs text-gray-400 font-mono">—</span>;
  const up = delta > 0;
  return (
    <span
      className={`text-xs font-mono font-medium ${up ? 'text-emerald-600' : 'text-red-600'}`}
    >
      {up ? '↑' : '↓'}{' '}
      {pct !== null ? `${Math.abs(pct).toFixed(1)}%` : fmtKz(Math.abs(delta))}
    </span>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

// 1. Lista de recibos
interface ListViewProps {
  onSelect: (id: number) => void;
}

function ListView({ onSelect }: ListViewProps) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);
  const params = { year, page, limit: 12 };

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<PaginatedPayslips>(
    queryKeys.payslips.list(params),
    '/payslips/my',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );
  const error = queryError?.message ?? null;

  const years = Array.from({ length: 4 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {data?.total ?? 0} recibos
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="grid grid-cols-[1fr_120px_160px_130px_100px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Período</div>
          <div>Pagamento</div>
          <div>Salário líquido</div>
          <div>Estado</div>
          <div>Acções</div>
        </div>

        {loading &&
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Sem recibos para {year}
          </div>
        )}

        {!loading &&
          data?.data.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_120px_160px_130px_100px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
              onClick={() => onSelect(p.id)}
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {fmtPeriod(p.period)}
                </div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">
                  {p.receiptCode}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {fmtDate(p.paymentDate)}
              </div>
              <div className="text-sm font-semibold font-mono text-gray-900">
                {fmtKz(p.netSalary)}
              </div>
              <div>
                <StatusBadge
                  value={p.status}
                  map={PAYSLIP_STATUS_MAP}
                  variant="dot"
                />
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onSelect(p.id)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-sm"
                  title="Ver detalhe"
                >
                  &#128065;
                </button>
                <button
                  onClick={() =>
                    window.open(`${API_BASE}/payslips/my/${p.id}/pdf`, '_blank')
                  }
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-sm"
                  title="Download PDF"
                >
                  &#8595;
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Detalhe do recibo
// Container: usePayslipDetail trata dados/mutações/disputa; a apresentação
// (JSX do recibo) vive em components/payslips/PayslipDetailView.tsx.
interface DetailViewProps {
  payslipId: number;
  onBack: () => void;
}

function DetailView({ payslipId, onBack }: DetailViewProps) {
  const {
    payslip,
    loading,
    error,
    acknowledging,
    acknowledge,
    dispute,
    dispatchDispute,
    submitDispute,
  } = usePayslipDetail(payslipId);

  return (
    <PayslipDetailView
      payslipId={payslipId}
      payslip={payslip}
      loading={loading}
      error={error}
      acknowledging={acknowledging}
      onAcknowledge={acknowledge}
      onBack={onBack}
      dispute={dispute}
      dispatchDispute={dispatchDispute}
      onSubmitDispute={submitDispute}
    />
  );
}

// 3. Comparador
function CompareView() {
  const currentYear = new Date().getFullYear();
  const [periodA, setPeriodA] = useState(
    `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  );
  const [periodB, setPeriodB] = useState(
    `${currentYear}-${String(new Date().getMonth()).padStart(2, '0')}`,
  );

  // useApiMutation em vez de loading/error/data à mão: mesmo padrão usado no
  // resto da página (DetailView usa useApiQuery), com retry/backoff de borla.
  const compareMut = useApiMutation<CompareResult, void>(() =>
    apiClient.get<CompareResult>('/payslips/my/compare', {
      params: { periodA, periodB },
    }),
  );
  const { data: result, isPending: loading, error } = compareMut;
  const compare = () => compareMut.mutate();

  const compareFields: Array<{ key: string; label: string }> = [
    { key: 'baseSalary', label: 'Salário base' },
    { key: 'grossSalary', label: 'Bruto total' },
    { key: 'incomeTax', label: 'IRT' },
    { key: 'socialSecurity', label: 'INSS (3%)' },
    { key: 'bonuses', label: 'Prémios' },
    { key: 'overtime', label: 'Horas extras' },
    { key: 'totalDeductions', label: 'Total deduções' },
    { key: 'netSalary', label: 'Salário líquido' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <input
          type="month"
          value={periodA}
          onChange={(e) => setPeriodA(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-400">vs</span>
        <input
          type="month"
          value={periodB}
          onChange={(e) => setPeriodB(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={compare}
          disabled={loading}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'A comparar…' : 'Comparar'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-500 mb-4">{error.message}</div>
      )}

      {result && (
        <div>
          <div className="grid grid-cols-[1fr_80px_1fr] gap-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Col A */}
            <div className="p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                {fmtPeriod(result.periodA)}
              </div>
              {compareFields.map((f) => {
                const field = result[f.key] as {
                  a: number;
                  b: number;
                  delta: number;
                  pct: number | null;
                };
                return (
                  <div
                    key={f.key}
                    className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs text-gray-500">{f.label}</span>
                    <span
                      className={`text-xs font-mono font-medium ${f.key === 'netSalary' ? 'text-blue-700' : 'text-gray-900'}`}
                    >
                      {fmtKz(field.a)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Delta col */}
            <div className="bg-gray-50 flex flex-col pt-9">
              {compareFields.map((f) => {
                const field = result[f.key] as {
                  a: number;
                  b: number;
                  delta: number;
                  pct: number | null;
                };
                return (
                  <div
                    key={f.key}
                    className="flex items-center justify-center py-2 border-b border-gray-100 last:border-0 h-[37px]"
                  >
                    <DeltaBadge delta={field.delta} pct={field.pct} />
                  </div>
                );
              })}
            </div>

            {/* Col B */}
            <div className="p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                {fmtPeriod(result.periodB)}
              </div>
              {compareFields.map((f) => {
                const field = result[f.key] as {
                  a: number;
                  b: number;
                  delta: number;
                  pct: number | null;
                };
                return (
                  <div
                    key={f.key}
                    className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs text-gray-500">{f.label}</span>
                    <span
                      className={`text-xs font-mono font-medium ${f.key === 'netSalary' ? 'text-blue-700' : 'text-gray-900'}`}
                    >
                      {fmtKz(field.b)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insight automático */}
          {(() => {
            const net = result['netSalary'] as {
              delta: number;
              pct: number | null;
            };
            if (!net || net.delta === 0) return null;
            const up = net.delta > 0;
            return (
              <div
                className={`mt-4 px-4 py-3 rounded-xl text-sm ${up ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}
              >
                <strong>
                  {up ? '↑' : '↓'} Variação de {fmtKz(Math.abs(net.delta))} no
                  salário líquido
                </strong>
                {net.pct !== null && ` (${Math.abs(net.pct).toFixed(1)}%)`}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// 4. Simulador
function SimulateView() {
  const [form, setForm] = useState({
    baseSalary: 350000,
    overtime: 0,
    bonuses: 0,
    mealAllowance: 25000,
    otherAllowances: 0,
  });
  // Simulação disparada 400ms após o form mudar. Em erro, `data` do
  // useMutation mantém o último resultado bem-sucedido (mesmo comportamento
  // do try/catch silencioso anterior — "keep old result").
  const simulateMutation = useApiMutation((payload: typeof form) =>
    apiClient.post<SimulateResult>('/payslips/simulate', payload),
  );
  const result = simulateMutation.data ?? null;
  const loading = simulateMutation.isPending;

  useEffect(() => {
    const t = setTimeout(() => simulateMutation.mutate(form), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `mutate` do useMutation é estável entre renders; só `form` deve disparar o debounce.
  }, [form]);

  const IRT_BRACKETS = [
    { min: 0, max: 150000, label: '1', rate: 'Isento' },
    { min: 150001, max: 200000, label: '2', rate: '10%' },
    { min: 200001, max: 300000, label: '3', rate: '13%' },
    { min: 300001, max: 500000, label: '4', rate: '16%' },
    { min: 500001, max: 1000000, label: '5', rate: '18%' },
    { min: 1000001, max: 1500000, label: '6', rate: '19%' },
    { min: 1500001, max: Infinity, label: '7', rate: '25%' },
  ];

  const activeIdx = result
    ? IRT_BRACKETS.findIndex(
        (b) => form.baseSalary >= b.min && form.baseSalary <= b.max,
      )
    : -1;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="space-y-4">
        {[
          { key: 'baseSalary', label: 'Salário base (Kz)' },
          { key: 'mealAllowance', label: 'Subsídio de alimentação (Kz)' },
          { key: 'overtime', label: 'Horas extras (Kz)' },
          { key: 'bonuses', label: 'Prémios / Comissões (Kz)' },
          { key: 'otherAllowances', label: 'Outros subsídios (Kz)' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              {label}
            </label>
            <input
              type="number"
              min={0}
              value={form[key as keyof typeof form]}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [key]: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        ))}

        {/* Tabela IRT */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Tabela IRT Angola 2026
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left pb-1.5 font-medium">Escal.</th>
                <th className="text-left pb-1.5 font-medium">Mínimo</th>
                <th className="text-left pb-1.5 font-medium">Máximo</th>
                <th className="text-right pb-1.5 font-medium">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {IRT_BRACKETS.map((b, i) => (
                <tr
                  key={i}
                  className={`${i === activeIdx ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-600'} rounded`}
                >
                  <td className="py-1 pl-1 rounded-l">{b.label}</td>
                  <td className="py-1 font-mono">
                    {b.min.toLocaleString('pt-AO')}
                  </td>
                  <td className="py-1 font-mono">
                    {b.max === Infinity ? '—' : b.max.toLocaleString('pt-AO')}
                  </td>
                  <td className="py-1 text-right rounded-r">{b.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resultado */}
      <div>
        <div className="bg-blue-50 rounded-xl p-5 space-y-3">
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">
            Resultado estimado
          </div>

          {[
            { label: 'Bruto total', value: result?.grossSalary },
            {
              label: `IRT (${result ? (result.irtDetails.bracket.rate * 100).toFixed(0) : '—'}%)`,
              value: result?.incomeTax,
              negative: true,
            },
            {
              label: 'INSS colaborador (3%)',
              value: result?.socialSecurity,
              negative: true,
            },
            {
              label: 'Total deduções',
              value: result?.totalDeductions,
              negative: true,
            },
          ].map(({ label, value, negative }) => (
            <div
              key={label}
              className="flex justify-between items-baseline border-b border-blue-100 pb-2 last:border-0"
            >
              <span className="text-sm text-gray-600">{label}</span>
              <span
                className={`text-sm font-mono font-medium ${negative ? 'text-red-600' : 'text-gray-900'}`}
              >
                {loading
                  ? '…'
                  : value !== undefined
                    ? `${negative ? '− ' : ''}${fmtKz(value)}`
                    : '—'}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-gray-900">
              Salário líquido
            </span>
            <span className="text-2xl font-bold font-mono text-blue-700">
              {loading ? '…' : result ? fmtKz(result.netSalary) : '—'}
            </span>
          </div>
        </div>

        {result && (
          <>
            <div className="mt-3 bg-amber-50 rounded-xl p-4 text-xs text-amber-800">
              <div className="font-medium mb-1">Fórmula IRT aplicada</div>
              <div className="font-mono">{result.irtDetails.formula}</div>
              <div className="mt-1 text-amber-700">
                Taxa efectiva: {result.irtDetails.effectiveRate.toFixed(1)}%
                &nbsp;·&nbsp; INSS empregador: {fmtKz(result.employerInss)}
              </div>
            </div>

            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
              Simulação meramente indicativa. Os valores finais podem variar com
              deduções adicionais aprovadas pelo RH.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 5. Resumo anual
function AnnualView() {
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<AnnualSummary>(
    queryKeys.payslips.annual(year),
    '/payslips/my/annual-summary',
    { params: { year }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const error = queryError?.message ?? null;

  const years = Array.from({ length: 4 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
          ⬇ Exportar CSV
        </button>
      </div>

      {loading && (
        <div className="text-sm text-gray-400 animate-pulse">A carregar…</div>
      )}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {data && (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total bruto', value: data.totalGross },
              { label: 'Total líquido', value: data.totalNet },
              { label: 'Total IRT', value: data.totalIRT },
              { label: 'Total INSS', value: data.totalINSSEmployee },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1.5">{label}</div>
                <div className="text-lg font-semibold font-mono text-gray-900">
                  {fmtKz(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Subsídios */}
          {data.totalMealAllowance +
            data.totalVacationAllowance +
            data.totalChristmasAllowance +
            data.totalBonuses >
            0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: 'Subsídio alimentação',
                  value: data.totalMealAllowance,
                },
                {
                  label: 'Subsídio férias',
                  value: data.totalVacationAllowance,
                },
                {
                  label: 'Subsídio Natal',
                  value: data.totalChristmasAllowance,
                },
                { label: 'Prémios', value: data.totalBonuses },
              ].map(({ label, value }) => (
                <div key={label} className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-xs text-emerald-600 mb-1.5">{label}</div>
                  <div className="text-base font-semibold font-mono text-emerald-800">
                    {fmtKz(value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Evolução mensal simples */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Evolução mensal {year}
            </div>
            {data.monthlySeries.map((m) => {
              const maxVal = Math.max(
                ...data.monthlySeries.map((x) => x.grossSalary),
              );
              const pct = (m.netSalary / maxVal) * 100;
              return (
                <div
                  key={m.period}
                  className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 last:border-0"
                >
                  <div className="w-20 text-xs text-gray-500 flex-shrink-0">
                    {fmtPeriod(m.period)}
                  </div>
                  <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded transition-all duration-500"
                      style={{ width: `${pct.toFixed(1)}%` }}
                    />
                  </div>
                  <div className="w-28 text-right text-xs font-mono font-medium text-gray-900">
                    {fmtKz(m.netSalary)}
                  </div>
                  <div className="w-20 text-right text-xs font-mono text-red-500">
                    IRT {fmtKz(m.incomeTax)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

type View = 'list' | 'detail' | 'compare' | 'simulate' | 'annual';

const NAV: Array<{ id: Exclude<View, 'detail'>; label: string }> = [
  { id: 'list', label: 'Os meus recibos' },
  { id: 'compare', label: 'Comparar meses' },
  { id: 'simulate', label: 'Simulador IRT' },
  { id: 'annual', label: 'Resumo anual' },
];

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };

export default function PayslipsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });

  const titles: Record<View, string> = {
    list: 'Os meus recibos',
    detail: 'Detalhe do recibo',
    compare: 'Comparar meses',
    simulate: 'Simulador IRT Angola 2026',
    annual: 'Resumo anual',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {titles[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Recursos Humanos
          </p>
        </div>
        {nav.view === 'list' && (
          <button
            onClick={() =>
              window.open(
                `${API_BASE}/payslips/my/annual-summary/export`,
                '_blank',
              )
            }
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ⬇ Exportar ano
          </button>
        )}
      </div>

      {/* Tabs (não mostrar em detail) */}
      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                nav.view === n.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      {nav.view === 'list' && <ListView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView payslipId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'compare' && <CompareView />}
      {nav.view === 'simulate' && <SimulateView />}
      {nav.view === 'annual' && <AnnualView />}
    </div>
  );
}
