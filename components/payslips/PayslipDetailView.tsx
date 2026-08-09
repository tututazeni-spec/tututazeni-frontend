// components/payslips/PayslipDetailView.tsx
// Vista apresentacional do detalhe de um recibo salarial — sem fetch, sem
// mutações, sem reducer próprio. Recebe os dados e callbacks do container
// (hooks/usePayslipDetail.ts, usado em DetailView dentro de
// app/(platform)/payslips/page.tsx). `maskedData` fica aqui porque é estado
// puramente de UI (mostrar/ocultar NIF·NIB), sem ligação a dados remotos.
// Ver memory project_innova_component_separation_audit, item 3.2.

'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/apiClient';
import { formatDate as fmtDate, formatKz as fmtKz } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { DisputeAction, DisputeState } from '@/hooks/usePayslipDetail';
import { fmtPeriod } from './format';
import { PAYSLIP_STATUS_MAP, type Payslip } from './types';

function maskString(value: string, visibleEnd = 4): string {
  if (!value) return '—';
  const visible = value.slice(-visibleEnd);
  const masked = '•'.repeat(Math.max(0, value.length - visibleEnd));
  return masked + visible;
}

export interface PayslipDetailViewProps {
  payslipId: number;
  payslip: Payslip | undefined;
  loading: boolean;
  error: string | null;
  acknowledging: boolean;
  onAcknowledge: () => void;
  onBack: () => void;
  dispute: DisputeState;
  dispatchDispute: (action: DisputeAction) => void;
  onSubmitDispute: () => void;
}

export function PayslipDetailView({
  payslipId,
  payslip: data,
  loading,
  error,
  acknowledging,
  onAcknowledge,
  onBack,
  dispute,
  dispatchDispute,
  onSubmitDispute,
}: PayslipDetailViewProps) {
  const [maskedData, setMaskedData] = useState(true);

  if (loading)
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );

  if (error || !data)
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-500 mb-4">
          {error ?? 'Recibo não encontrado'}
        </p>
        <button onClick={onBack} className="text-sm text-blue-600 underline">
          ← Voltar
        </button>
      </div>
    );

  const SalaryRow = ({
    label,
    amount,
    type = 'neutral',
    sub,
  }: {
    label: string;
    amount: number;
    type?: 'positive' | 'deduction' | 'neutral';
    sub?: string;
  }) => (
    <div className="flex justify-between items-baseline py-1.5 border-b border-gray-100 last:border-0">
      <div>
        <span className="text-sm text-gray-600">{label}</span>
        {sub && <span className="text-xs text-gray-400 ml-2">{sub}</span>}
      </div>
      <span
        className={`text-sm font-mono font-medium ${type === 'positive' ? 'text-emerald-600' : type === 'deduction' ? 'text-red-600' : 'text-gray-900'}`}
      >
        {type === 'deduction' ? '− ' : ''}
        {fmtKz(amount)}
      </span>
    </div>
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
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
                {data.paymentDate && (
                  <span>Pagamento: {fmtDate(data.paymentDate)}</span>
                )}
              </div>
              <div className="text-xs text-blue-300 mt-2 font-mono">
                {data.receiptCode}
              </div>
            </div>
            <StatusBadge
              value={data.status}
              map={PAYSLIP_STATUS_MAP}
              variant="dot"
            />
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Info colaborador + dados fiscais */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Colaborador
              </div>
              <div className="space-y-0">
                {[
                  ['Nome', data.user?.fullName ?? '—'],
                  ['Nº Funcionário', data.user?.employeeNumber ?? '—'],
                  ['Cargo', data.user?.position?.name ?? '—'],
                  ['Departamento', data.user?.department?.name ?? '—'],
                  ['Admissão', fmtDate(data.user?.hireDate ?? null)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-medium text-gray-900">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Dados fiscais
                </div>
                <button
                  onClick={() => setMaskedData((m) => !m)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {maskedData ? '👁 mostrar' : '🔒 ocultar'}
                </button>
              </div>
              <div className="space-y-0">
                {[
                  [
                    'NIF/BI',
                    maskedData
                      ? maskString(data.user?.nif ?? '', 3)
                      : (data.user?.nif ?? '—'),
                  ],
                  [
                    'NIB',
                    maskedData
                      ? maskString(data.user?.nib ?? '', 4)
                      : (data.user?.nib ?? '—'),
                  ],
                  ['INSS colaborador', '3%'],
                  ['INSS empregador', '8%'],
                  [
                    'Escalão IRT',
                    data.irtBracketRate !== null
                      ? `${((data.irtBracketRate ?? 0) * 100).toFixed(0)}%`
                      : '—',
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs text-gray-500">{label}</span>
                    <span
                      className={`text-xs font-medium ${maskedData && (label === 'NIF/BI' || label === 'NIB') ? 'text-gray-400 tracking-widest' : 'text-gray-900'}`}
                    >
                      {value}
                    </span>
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
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Remunerações
              </div>
              <SalaryRow label="Salário base" amount={data.baseSalary} />
              {data.mealAllowance > 0 && (
                <SalaryRow
                  label="Subsídio de alimentação"
                  amount={data.mealAllowance}
                  type="positive"
                />
              )}
              {data.vacationAllowance > 0 && (
                <SalaryRow
                  label="Subsídio de férias"
                  amount={data.vacationAllowance}
                  type="positive"
                />
              )}
              {data.christmasAllowance > 0 && (
                <SalaryRow
                  label="Subsídio de Natal"
                  amount={data.christmasAllowance}
                  type="positive"
                />
              )}
              {data.overtime > 0 && (
                <SalaryRow
                  label="Horas extras"
                  amount={data.overtime}
                  type="positive"
                />
              )}
              {data.bonuses > 0 && (
                <SalaryRow
                  label="Prémios / Comissões"
                  amount={data.bonuses}
                  type="positive"
                />
              )}
              {data.otherAllowances > 0 && (
                <SalaryRow
                  label="Outros subsídios"
                  amount={data.otherAllowances}
                  type="positive"
                />
              )}
              <div className="flex justify-between items-baseline py-2 mt-1">
                <span className="text-sm font-medium text-gray-900">
                  Total bruto
                </span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {fmtKz(data.grossSalary)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Deduções
              </div>
              <SalaryRow
                label="IRT"
                amount={data.incomeTax}
                type="deduction"
                sub={
                  data.irtBracketRate !== null
                    ? `${((data.irtBracketRate ?? 0) * 100).toFixed(0)}%`
                    : undefined
                }
              />
              <SalaryRow
                label="INSS colaborador (3%)"
                amount={data.socialSecurity}
                type="deduction"
              />
              {data.healthInsurance > 0 && (
                <SalaryRow
                  label="Seguro de saúde"
                  amount={data.healthInsurance}
                  type="deduction"
                />
              )}
              {data.loanDeduction > 0 && (
                <SalaryRow
                  label="Dedução empréstimo"
                  amount={data.loanDeduction}
                  type="deduction"
                />
              )}
              {data.advanceDeduction > 0 && (
                <SalaryRow
                  label="Adiantamento salarial"
                  amount={data.advanceDeduction}
                  type="deduction"
                />
              )}
              {data.otherDeductions > 0 && (
                <SalaryRow
                  label="Outras deduções"
                  amount={data.otherDeductions}
                  type="deduction"
                />
              )}
              <div className="flex justify-between items-baseline py-2 mt-1">
                <span className="text-sm font-medium text-gray-900">
                  Total deduções
                </span>
                <span className="text-sm font-mono font-semibold text-red-600">
                  − {fmtKz(data.totalDeductions)}
                </span>
              </div>
            </div>
          </div>

          {/* Resumo final */}
          <div className="bg-blue-50 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Salário líquido
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                INSS empregador (informativo): {fmtKz(data.employerInss)}
                &nbsp;·&nbsp; Encargo total empresa:{' '}
                {fmtKz(data.grossSalary + data.employerInss)}
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-700">
              {fmtKz(data.netSalary)}
            </div>
          </div>

          {/* Acções */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={`${API_URL}/payslips/my/${payslipId}/pdf`}
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
                onClick={onAcknowledge}
                disabled={acknowledging}
                className="flex items-center gap-2 px-4 py-2 border border-emerald-300 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 ml-auto"
              >
                {acknowledging ? 'A confirmar…' : '✓ Confirmar recepção'}
              </button>
            )}

            {data.status !== 'DISPUTED' && (
              <button
                onClick={() => dispatchDispute({ type: 'OPEN' })}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
              >
                ⚠ Abrir disputa
              </button>
            )}
          </div>

          {/* Modal disputa (inline) */}
          {dispute.open && (
            <div className="border border-red-100 bg-red-50 rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium text-red-800">
                Abrir disputa sobre este recibo
              </div>
              <input
                className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Motivo da disputa *"
                value={dispute.reason}
                onChange={(e) =>
                  dispatchDispute({
                    type: 'SET_REASON',
                    reason: e.target.value,
                  })
                }
              />
              <textarea
                className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                placeholder="Detalhes adicionais (opcional)"
                rows={3}
                value={dispute.details}
                onChange={(e) =>
                  dispatchDispute({
                    type: 'SET_DETAILS',
                    details: e.target.value,
                  })
                }
              />
              <div className="flex gap-2">
                <button
                  onClick={onSubmitDispute}
                  disabled={!dispute.reason.trim() || dispute.submitting}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {dispute.submitting ? 'A enviar…' : 'Enviar disputa'}
                </button>
                <button
                  onClick={() => dispatchDispute({ type: 'CLOSE' })}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
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
