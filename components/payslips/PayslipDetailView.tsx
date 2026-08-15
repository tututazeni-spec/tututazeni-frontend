// components/payslips/PayslipDetailView.tsx
// Vista apresentacional do detalhe de um recibo salarial — sem fetch, sem
// mutações, sem reducer próprio. Recebe os dados e callbacks do container
// (hooks/usePayslipDetail.ts, usado em DetailView dentro de
// app/(platform)/payslips/page.tsx). `maskedData` fica aqui porque é estado
// puramente de UI (mostrar/ocultar NIF·NIB), sem ligação a dados remotos.
// Ver memory project_innova_component_separation_audit, item 3.2.

'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Mail,
  Printer,
} from 'lucide-react';
import { API_URL } from '@/lib/apiClient';
import { formatDate as fmtDate, formatKz as fmtKz } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button, buttonVariants } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
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
        <div className="h-24 rounded-card bg-surface-sunken" />
        <div className="h-48 rounded-card bg-surface-sunken" />
      </div>
    );

  if (error || !data)
    return (
      <div className="py-12 text-center">
        <p className="mb-4 font-body text-sm text-danger">
          {error ?? 'Recibo não encontrado'}
        </p>
        <Button intent="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
      </div>
    );

  interface SalaryRowProps {
    label: string;
    amount: number;
    type?: 'positive' | 'deduction' | 'neutral';
    sub?: string;
  }

  const SalaryRow = ({
    label,
    amount,
    type = 'neutral',
    sub,
  }: SalaryRowProps) => (
    <div className="flex items-baseline justify-between border-b border-border py-1.5 last:border-0">
      <div>
        <span className="font-body text-sm text-ink-muted">{label}</span>
        {sub && (
          <span className="ml-2 font-body text-xs text-ink-faint">{sub}</span>
        )}
      </div>
      <span
        className={`font-mono text-sm font-medium ${type === 'positive' ? 'text-success' : type === 'deduction' ? 'text-danger' : 'text-ink'}`}
      >
        {type === 'deduction' ? '− ' : ''}
        {fmtKz(amount)}
      </span>
    </div>
  );

  return (
    <div>
      <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar aos recibos
      </Button>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {/* Cabeçalho do documento */}
        <div className="bg-primary px-6 py-5 text-canvas">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-base font-semibold">
                INNOVA Angola, Lda.
              </div>
              <div className="mt-1 flex flex-wrap gap-3 font-body text-xs text-canvas/70">
                <span>NIF: 5000045678</span>
                <span>Rua da Missão, 42, Luanda</span>
                <span>Período: {fmtPeriod(data.period)}</span>
                {data.paymentDate && (
                  <span>Pagamento: {fmtDate(data.paymentDate)}</span>
                )}
              </div>
              <div className="mt-2 font-mono text-xs text-canvas/60">
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

        <div className="space-y-6 px-6 py-5">
          {/* Info colaborador + dados fiscais */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
                    className="flex justify-between border-b border-border py-1.5 last:border-0"
                  >
                    <span className="font-body text-xs text-ink-muted">
                      {label}
                    </span>
                    <span className="font-body text-xs font-medium text-ink">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Dados fiscais
                </div>
                <button
                  onClick={() => setMaskedData((m) => !m)}
                  className="flex items-center gap-1 font-body text-xs text-primary hover:underline"
                >
                  {maskedData ? (
                    <>
                      <Eye size={12} strokeWidth={1.75} /> mostrar
                    </>
                  ) : (
                    <>
                      <EyeOff size={12} strokeWidth={1.75} /> ocultar
                    </>
                  )}
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
                    className="flex justify-between border-b border-border py-1.5 last:border-0"
                  >
                    <span className="font-body text-xs text-ink-muted">
                      {label}
                    </span>
                    <span
                      className={cn(
                        'font-body text-xs font-medium',
                        maskedData && (label === 'NIF/BI' || label === 'NIB')
                          ? 'tracking-widest text-ink-faint'
                          : 'text-ink',
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              {data.irtFormula && (
                <div className="mt-2 rounded-control bg-warning-subtle p-2 font-mono text-xs text-warning-ink">
                  {data.irtFormula}
                </div>
              )}
            </div>
          </div>

          {/* Remunerações + Deduções */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
              <div className="mt-1 flex items-baseline justify-between py-2">
                <span className="font-body text-sm font-medium text-ink">
                  Total bruto
                </span>
                <span className="font-mono text-sm font-semibold text-ink">
                  {fmtKz(data.grossSalary)}
                </span>
              </div>
            </div>
            <div>
              <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
              <div className="mt-1 flex items-baseline justify-between py-2">
                <span className="font-body text-sm font-medium text-ink">
                  Total deduções
                </span>
                <span className="font-mono text-sm font-semibold text-danger">
                  − {fmtKz(data.totalDeductions)}
                </span>
              </div>
            </div>
          </div>

          {/* Resumo final */}
          <div className="flex items-center justify-between rounded-card bg-primary-subtle px-5 py-4">
            <div>
              <div className="font-body text-sm font-semibold text-ink">
                Salário líquido
              </div>
              <div className="mt-0.5 font-body text-xs text-ink-muted">
                INSS empregador (informativo): {fmtKz(data.employerInss)}
                &nbsp;·&nbsp; Encargo total empresa:{' '}
                {fmtKz(data.grossSalary + data.employerInss)}
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-primary">
              {fmtKz(data.netSalary)}
            </div>
          </div>

          {/* Acções */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={`${API_URL}/payslips/my/${payslipId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ intent: 'primary', size: 'md' })}
            >
              <Download size={16} strokeWidth={1.75} />
              Download PDF
            </a>
            <Button intent="secondary">
              <Printer size={16} strokeWidth={1.75} />
              Imprimir
            </Button>
            <Button intent="secondary">
              <Mail size={16} strokeWidth={1.75} />
              Enviar por email
            </Button>

            {data.status === 'ISSUED' && (
              <Button
                intent="success"
                loading={acknowledging}
                onClick={onAcknowledge}
                className="ml-auto"
              >
                {!acknowledging && (
                  <CheckCircle2 size={16} strokeWidth={1.75} />
                )}
                {acknowledging ? 'A confirmar…' : 'Confirmar recepção'}
              </Button>
            )}

            {data.status !== 'DISPUTED' && (
              <Button
                intent="danger"
                onClick={() => dispatchDispute({ type: 'OPEN' })}
              >
                <AlertTriangle size={16} strokeWidth={1.75} />
                Abrir disputa
              </Button>
            )}
          </div>

          {/* Modal disputa (inline) */}
          {dispute.open && (
            <div className="space-y-3 rounded-card border border-danger/30 bg-danger-subtle p-4">
              <div className="font-body text-sm font-medium text-danger-ink">
                Abrir disputa sobre este recibo
              </div>
              <Input
                className="w-full"
                placeholder="Motivo da disputa *"
                value={dispute.reason}
                onChange={(e) =>
                  dispatchDispute({
                    type: 'SET_REASON',
                    reason: e.target.value,
                  })
                }
              />
              <Textarea
                className="w-full resize-none"
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
                <Button
                  intent="danger"
                  loading={dispute.submitting}
                  disabled={!dispute.reason.trim()}
                  onClick={onSubmitDispute}
                >
                  {dispute.submitting ? 'A enviar…' : 'Enviar disputa'}
                </Button>
                <Button
                  intent="secondary"
                  onClick={() => dispatchDispute({ type: 'CLOSE' })}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
