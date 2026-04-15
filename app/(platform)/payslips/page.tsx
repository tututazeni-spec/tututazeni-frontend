
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type PayslipStatus = 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'DISPUTED';

interface Payslip {
  id: number;
  receiptCode: string;
  period: string;
  paymentDate: string | null;
  netSalary: number;
  grossSalary: number;
  baseSalary: number;
  mealAllowance: number;
  vacationAllowance: number;
  christmasAllowance: number;
  overtime: number;
  bonuses: number;
  otherAllowances: number;
  incomeTax: number;
  socialSecurity: number;
  employerInss: number;
  healthInsurance: number;
  loanDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  irtBracketRate: number | null;
  irtFormula: string | null;
  status: PayslipStatus;
  issuedAt: string | null;
  acknowledgedAt: string | null;
  notes: string | null;
  user?: {
    id: number;
    fullName: string;
    employeeNumber: string;
    nif: string;
    nib: string;
    hireDate: string;
    position: { name: string } | null;
    department: { name: string } | null;
  };
}

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
  monthlySeries: { period: string; grossSalary: number; netSalary: number; incomeTax: number; socialSecurity: number }[];
}

interface CompareResult {
  periodA: string;
  periodB: string;
  [key: string]: { a: number; b: number; delta: number; pct: number | null } | string;
}

interface SimulateResult {
  grossSalary: number;
  incomeTax: number;
  socialSecurity: number;
  employerInss: number;
  totalDeductions: number;
  netSalary: number;
  irtDetails: {
    bracket: { min: number; max: number | null; rate: number; deduction: number };
    formula: string;
    effectiveRate: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function fmtKz(value: number): string {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })
    .format(value)
    .replace('AOA', 'Kz')
    .trim();
}

function fmtPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function maskString(value: string, visibleEnd = 4): string {
  if (!value) return '—';
  const visible = value.slice(-visibleEnd);
  const masked = '•'.repeat(Math.max(0, value.length - visibleEnd));
  return masked + visible;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PayslipStatus }) {
  const config: Record<PayslipStatus, { label: string; className: string }> = {
    DRAFT:        { label: 'Rascunho',  className: 'bg-gray-100 text-gray-600' },
    ISSUED:       { label: 'Emitido',   className: 'bg-emerald-50 text-emerald-700' },
    ACKNOWLEDGED: { label: 'Confirmado',className: 'bg-blue-50 text-blue-700' },
    DISPUTED:     { label: 'Disputa',   className: 'bg-red-50 text-red-700' },
  };
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

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

function DeltaBadge({ delta, pct }: { delta: number; pct: number | null }) {
  if (delta === 0) return <span className="text-xs text-gray-400 font-mono">—</span>;
  const up = delta > 0;
  return (
    <span className={`text-xs font-mono font-medium ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      {up ? '↑' : '↓'} {pct !== null ? `${Math.abs(pct).toFixed(1)}%` : fmtKz(Math.abs(delta))}
    </span>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

// 1. Lista de recibos
function ListView({
  onSelect,
}: {
  onSelect: (id: number) => void;
}) {
  const [data, setData] = useState<PaginatedPayslips | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<PaginatedPayslips>(
        `/payslips/my?year=${year}&page=${page}&limit=12`
      );
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [year, page]);

  useEffect(() => { load(); }, [load]);

  const years = Array.from({ length: 4 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={year}
          onChange={e => { setYear(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-sm text-gray-400">{data?.total ?? 0} recibos</span>
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

        {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Sem recibos para {year}
          </div>
        )}

        {!loading && data?.data.map(p => (
          <div
            key={p.id}
            className="grid grid-cols-[1fr_120px_160px_130px_100px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
            onClick={() => onSelect(p.id)}
          >
            <div>
              <div className="text-sm font-medium text-gray-900">{fmtPeriod(p.period)}</div>
              <div className="text-xs text-gray-400 font-mono mt-0.5">{p.receiptCode}</div>
            </div>
            <div className="text-sm text-gray-500">{fmtDate(p.paymentDate)}</div>
            <div className="text-sm font-semibold font-mono text-gray-900">{fmtKz(p.netSalary)}</div>
            <div><StatusBadge status={p.status} /></div>
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onSelect(p.id)}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-sm"
                title="Ver detalhe"
              >
                &#128065;
              </button>
              <button
                onClick={() => window.open(`${API_BASE}/payslips/my/${p.id}/pdf`, '_blank')}
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
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage(p => p + 1)}
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
function DetailView({
  payslipId,
  onBack,
}: {
  payslipId: number;
  onBack: () => void;
}) {
  const [data, setData] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maskedData, setMaskedData] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    apiFetch<Payslip>(`/payslips/my/${payslipId}`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [payslipId]);

  const acknowledge = async () => {
    if (!data || data.status === 'ACKNOWLEDGED') return;
    setAcknowledging(true);
    try {
      const updated = await apiFetch<Payslip>(`/payslips/my/${payslipId}/acknowledge`, { method: 'PATCH' });
      setData(updated);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAcknowledging(false);
    }
  };

  const submitDispute = async () => {
    if (!disputeReason.trim()) return;
    setDisputeLoading(true);
    try {
      await apiFetch(`/payslips/my/${payslipId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason: disputeReason, details: disputeDetails }),
      });
      setShowDispute(false);
      alert('Disputa registada com sucesso. O RH será notificado.');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDisputeLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      <div className="h-24 bg-gray-100 rounded-xl" />
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  );

  if (error || !data) return (
    <div className="py-12 text-center">
      <p className="text-sm text-red-500 mb-4">{error ?? 'Recibo não encontrado'}</p>
      <button onClick={onBack} className="text-sm text-blue-600 underline">← Voltar</button>
    </div>
  );

  const SalaryRow = ({ label, amount, type = 'neutral', sub }: { label: string; amount: number; type?: 'positive' | 'deduction' | 'neutral'; sub?: string }) => (
    <div className="flex justify-between items-baseline py-1.5 border-b border-gray-100 last:border-0">
      <div>
        <span className="text-sm text-gray-600">{label}</span>
        {sub && <span className="text-xs text-gray-400 ml-2">{sub}</span>}
      </div>
      <span className={`text-sm font-mono font-medium ${type === 'positive' ? 'text-emerald-600' : type === 'deduction' ? 'text-red-600' : 'text-gray-900'}`}>
        {type === 'deduction' ? '− ' : ''}{fmtKz(amount)}
      </span>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        ← Voltar aos recibos
      </button>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Cabeçalho do documento */}
        <div className="bg-blue-700 text-white px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-semibold">INNOVA Angola, Lda.</div>
              <div className="text-xs text-blue-200 mt-1 flex flex-wrap gap-3">
                <span>NIF: 5000045678</span>
                <span>Rua da Missão, 42, Luanda</span>
                <span>Período: {fmtPeriod(data.period)}</span>
                {data.paymentDate && <span>Pagamento: {fmtDate(data.paymentDate)}</span>}
              </div>
              <div className="text-xs text-blue-300 mt-2 font-mono">{data.receiptCode}</div>
            </div>
            <StatusBadge status={data.status} />
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Info colaborador + dados fiscais */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Colaborador</div>
              <div className="space-y-0">
                {[
                  ['Nome', data.user?.fullName ?? '—'],
                  ['Nº Funcionário', data.user?.employeeNumber ?? '—'],
                  ['Cargo', data.user?.position?.name ?? '—'],
                  ['Departamento', data.user?.department?.name ?? '—'],
                  ['Admissão', fmtDate(data.user?.hireDate ?? null)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Dados fiscais</div>
                <button
                  onClick={() => setMaskedData(m => !m)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {maskedData ? '👁 mostrar' : '🔒 ocultar'}
                </button>
              </div>
              <div className="space-y-0">
                {[
                  ['NIF/BI', maskedData ? maskString(data.user?.nif ?? '', 3) : (data.user?.nif ?? '—')],
                  ['NIB', maskedData ? maskString(data.user?.nib ?? '', 4) : (data.user?.nib ?? '—')],
                  ['INSS colaborador', '3%'],
                  ['INSS empregador', '8%'],
                  ['Escalão IRT', data.irtBracketRate !== null ? `${((data.irtBracketRate ?? 0) * 100).toFixed(0)}%` : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-xs font-medium ${maskedData && (label === 'NIF/BI' || label === 'NIB') ? 'text-gray-400 tracking-widest' : 'text-gray-900'}`}>{value}</span>
                  </div>
                ))}
              </div>
              {data.irtFormula && (
                <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 font-mono">
                  {data.irtFormula}
                </div>
              )}
            </div>
          </div>

          {/* Remunerações + Deduções */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Remunerações</div>
              <SalaryRow label="Salário base" amount={data.baseSalary} />
              {data.mealAllowance > 0 && <SalaryRow label="Subsídio de alimentação" amount={data.mealAllowance} type="positive" />}
              {data.vacationAllowance > 0 && <SalaryRow label="Subsídio de férias" amount={data.vacationAllowance} type="positive" />}
              {data.christmasAllowance > 0 && <SalaryRow label="Subsídio de Natal" amount={data.christmasAllowance} type="positive" />}
              {data.overtime > 0 && <SalaryRow label="Horas extras" amount={data.overtime} type="positive" />}
              {data.bonuses > 0 && <SalaryRow label="Prémios / Comissões" amount={data.bonuses} type="positive" />}
              {data.otherAllowances > 0 && <SalaryRow label="Outros subsídios" amount={data.otherAllowances} type="positive" />}
              <div className="flex justify-between items-baseline py-2 mt-1">
                <span className="text-sm font-medium text-gray-900">Total bruto</span>
                <span className="text-sm font-mono font-semibold text-gray-900">{fmtKz(data.grossSalary)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Deduções</div>
              <SalaryRow label="IRT" amount={data.incomeTax} type="deduction" sub={data.irtBracketRate !== null ? `${((data.irtBracketRate ?? 0) * 100).toFixed(0)}%` : undefined} />
              <SalaryRow label="INSS colaborador (3%)" amount={data.socialSecurity} type="deduction" />
              {data.healthInsurance > 0 && <SalaryRow label="Seguro de saúde" amount={data.healthInsurance} type="deduction" />}
              {data.loanDeduction > 0 && <SalaryRow label="Dedução empréstimo" amount={data.loanDeduction} type="deduction" />}
              {data.advanceDeduction > 0 && <SalaryRow label="Adiantamento salarial" amount={data.advanceDeduction} type="deduction" />}
              {data.otherDeductions > 0 && <SalaryRow label="Outras deduções" amount={data.otherDeductions} type="deduction" />}
              <div className="flex justify-between items-baseline py-2 mt-1">
                <span className="text-sm font-medium text-gray-900">Total deduções</span>
                <span className="text-sm font-mono font-semibold text-red-600">− {fmtKz(data.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Resumo final */}
          <div className="bg-blue-50 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">Salário líquido</div>
              <div className="text-xs text-gray-500 mt-0.5">
                INSS empregador (informativo): {fmtKz(data.employerInss)}
                &nbsp;·&nbsp; Encargo total empresa: {fmtKz(data.grossSalary + data.employerInss)}
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-700">{fmtKz(data.netSalary)}</div>
          </div>

          {/* Acções */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={`${API_BASE}/payslips/my/${payslipId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
            >
              ⬇ Download PDF
            </a>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              🖨 Imprimir
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              ✉ Enviar por email
            </button>

            {data.status === 'ISSUED' && (
              <button
                onClick={acknowledge}
                disabled={acknowledging}
                className="flex items-center gap-2 px-4 py-2 border border-emerald-300 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 ml-auto"
              >
                {acknowledging ? 'A confirmar…' : '✓ Confirmar recepção'}
              </button>
            )}

            {data.status !== 'DISPUTED' && (
              <button
                onClick={() => setShowDispute(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
              >
                ⚠ Abrir disputa
              </button>
            )}
          </div>

          {/* Modal disputa (inline) */}
          {showDispute && (
            <div className="border border-red-100 bg-red-50 rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium text-red-800">Abrir disputa sobre este recibo</div>
              <input
                className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Motivo da disputa *"
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
              />
              <textarea
                className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                placeholder="Detalhes adicionais (opcional)"
                rows={3}
                value={disputeDetails}
                onChange={e => setDisputeDetails(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={submitDispute}
                  disabled={!disputeReason.trim() || disputeLoading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {disputeLoading ? 'A enviar…' : 'Enviar disputa'}
                </button>
                <button onClick={() => setShowDispute(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. Comparador
function CompareView() {
  const currentYear = new Date().getFullYear();
  const [periodA, setPeriodA] = useState(`${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [periodB, setPeriodB] = useState(`${currentYear}-${String(new Date().getMonth()).padStart(2, '0')}`);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CompareResult>(`/payslips/my/compare?periodA=${periodA}&periodB=${periodB}`);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const compareFields: Array<{ key: string; label: string }> = [
    { key: 'baseSalary',     label: 'Salário base' },
    { key: 'grossSalary',    label: 'Bruto total' },
    { key: 'incomeTax',      label: 'IRT' },
    { key: 'socialSecurity', label: 'INSS (3%)' },
    { key: 'bonuses',        label: 'Prémios' },
    { key: 'overtime',       label: 'Horas extras' },
    { key: 'totalDeductions',label: 'Total deduções' },
    { key: 'netSalary',      label: 'Salário líquido' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <input
          type="month"
          value={periodA}
          onChange={e => setPeriodA(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-400">vs</span>
        <input
          type="month"
          value={periodB}
          onChange={e => setPeriodB(e.target.value)}
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

      {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

      {result && (
        <div>
          <div className="grid grid-cols-[1fr_80px_1fr] gap-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Col A */}
            <div className="p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{fmtPeriod(result.periodA)}</div>
              {compareFields.map(f => {
                const field = result[f.key] as { a: number; b: number; delta: number; pct: number | null };
                return (
                  <div key={f.key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500">{f.label}</span>
                    <span className={`text-xs font-mono font-medium ${f.key === 'netSalary' ? 'text-blue-700' : 'text-gray-900'}`}>
                      {fmtKz(field.a)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Delta col */}
            <div className="bg-gray-50 flex flex-col pt-9">
              {compareFields.map(f => {
                const field = result[f.key] as { a: number; b: number; delta: number; pct: number | null };
                return (
                  <div key={f.key} className="flex items-center justify-center py-2 border-b border-gray-100 last:border-0 h-[37px]">
                    <DeltaBadge delta={field.delta} pct={field.pct} />
                  </div>
                );
              })}
            </div>

            {/* Col B */}
            <div className="p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{fmtPeriod(result.periodB)}</div>
              {compareFields.map(f => {
                const field = result[f.key] as { a: number; b: number; delta: number; pct: number | null };
                return (
                  <div key={f.key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500">{f.label}</span>
                    <span className={`text-xs font-mono font-medium ${f.key === 'netSalary' ? 'text-blue-700' : 'text-gray-900'}`}>
                      {fmtKz(field.b)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insight automático */}
          {(() => {
            const net = result['netSalary'] as { delta: number; pct: number | null };
            if (!net || net.delta === 0) return null;
            const up = net.delta > 0;
            return (
              <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${up ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                <strong>{up ? '↑' : '↓'} Variação de {fmtKz(Math.abs(net.delta))} no salário líquido</strong>
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
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const simulate = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<SimulateResult>('/payslips/simulate', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult(data);
    } catch {
      // silent — keep old result
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    const t = setTimeout(simulate, 400);
    return () => clearTimeout(t);
  }, [simulate]);

  const IRT_BRACKETS = [
    { min: 0,        max: 150000,   label: '1',  rate: 'Isento' },
    { min: 150001,   max: 200000,   label: '2',  rate: '10%' },
    { min: 200001,   max: 300000,   label: '3',  rate: '13%' },
    { min: 300001,   max: 500000,   label: '4',  rate: '16%' },
    { min: 500001,   max: 1000000,  label: '5',  rate: '18%' },
    { min: 1000001,  max: 1500000,  label: '6',  rate: '19%' },
    { min: 1500001,  max: Infinity, label: '7',  rate: '25%' },
  ];

  const activeIdx = result ? IRT_BRACKETS.findIndex(
    b => form.baseSalary >= b.min && form.baseSalary <= b.max
  ) : -1;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="space-y-4">
        {[
          { key: 'baseSalary',     label: 'Salário base (Kz)' },
          { key: 'mealAllowance',  label: 'Subsídio de alimentação (Kz)' },
          { key: 'overtime',       label: 'Horas extras (Kz)' },
          { key: 'bonuses',        label: 'Prémios / Comissões (Kz)' },
          { key: 'otherAllowances',label: 'Outros subsídios (Kz)' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
            <input
              type="number"
              min={0}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
              className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        ))}

        {/* Tabela IRT */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Tabela IRT Angola 2026</div>
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
                  <td className="py-1 font-mono">{b.min.toLocaleString('pt-AO')}</td>
                  <td className="py-1 font-mono">{b.max === Infinity ? '—' : b.max.toLocaleString('pt-AO')}</td>
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
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Resultado estimado</div>

          {[
            { label: 'Bruto total', value: result?.grossSalary },
            { label: `IRT (${result ? ((result.irtDetails.bracket.rate) * 100).toFixed(0) : '—'}%)`, value: result?.incomeTax, negative: true },
            { label: 'INSS colaborador (3%)', value: result?.socialSecurity, negative: true },
            { label: 'Total deduções', value: result?.totalDeductions, negative: true },
          ].map(({ label, value, negative }) => (
            <div key={label} className="flex justify-between items-baseline border-b border-blue-100 pb-2 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className={`text-sm font-mono font-medium ${negative ? 'text-red-600' : 'text-gray-900'}`}>
                {loading ? '…' : value !== undefined ? `${negative ? '− ' : ''}${fmtKz(value)}` : '—'}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-gray-900">Salário líquido</span>
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
              Simulação meramente indicativa. Os valores finais podem variar com deduções adicionais aprovadas pelo RH.
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
  const [data, setData] = useState<AnnualSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<AnnualSummary>(`/payslips/my/annual-summary?year=${year}`);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const years = Array.from({ length: 4 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
          ⬇ Exportar CSV
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400 animate-pulse">A carregar…</div>}
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
                <div className="text-lg font-semibold font-mono text-gray-900">{fmtKz(value)}</div>
              </div>
            ))}
          </div>

          {/* Subsídios */}
          {(data.totalMealAllowance + data.totalVacationAllowance + data.totalChristmasAllowance + data.totalBonuses) > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Subsídio alimentação', value: data.totalMealAllowance },
                { label: 'Subsídio férias', value: data.totalVacationAllowance },
                { label: 'Subsídio Natal', value: data.totalChristmasAllowance },
                { label: 'Prémios', value: data.totalBonuses },
              ].map(({ label, value }) => (
                <div key={label} className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-xs text-emerald-600 mb-1.5">{label}</div>
                  <div className="text-base font-semibold font-mono text-emerald-800">{fmtKz(value)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Evolução mensal simples */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Evolução mensal {year}
            </div>
            {data.monthlySeries.map(m => {
              const maxVal = Math.max(...data.monthlySeries.map(x => x.grossSalary));
              const pct = (m.netSalary / maxVal) * 100;
              return (
                <div key={m.period} className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 last:border-0">
                  <div className="w-20 text-xs text-gray-500 flex-shrink-0">{fmtPeriod(m.period)}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded transition-all duration-500"
                      style={{ width: `${pct.toFixed(1)}%` }}
                    />
                  </div>
                  <div className="w-28 text-right text-xs font-mono font-medium text-gray-900">{fmtKz(m.netSalary)}</div>
                  <div className="w-20 text-right text-xs font-mono text-red-500">IRT {fmtKz(m.incomeTax)}</div>
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

const NAV: Array<{ id: View; label: string }> = [
  { id: 'list',     label: 'Os meus recibos' },
  { id: 'compare',  label: 'Comparar meses' },
  { id: 'simulate', label: 'Simulador IRT' },
  { id: 'annual',   label: 'Resumo anual' },
];

export default function PayslipsPage() {
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedId(null);
    setView('list');
  };

  const titles: Record<View, string> = {
    list:     'Os meus recibos',
    detail:   'Detalhe do recibo',
    compare:  'Comparar meses',
    simulate: 'Simulador IRT Angola 2026',
    annual:   'Resumo anual',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{titles[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Recursos Humanos</p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => window.open(`${API_BASE}/payslips/my/annual-summary/export`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ⬇ Exportar ano
          </button>
        )}
      </div>

      {/* Tabs (não mostrar em detail) */}
      {view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id
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
      {view === 'list'     && <ListView onSelect={handleSelect} />}
      {view === 'detail'   && selectedId !== null && <DetailView payslipId={selectedId} onBack={handleBack} />}
      {view === 'compare'  && <CompareView />}
      {view === 'simulate' && <SimulateView />}
      {view === 'annual'   && <AnnualView />}
    </div>
  );
}
