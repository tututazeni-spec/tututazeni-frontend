// components/payslips/PayslipDetailView.tsx
// Vista apresentacional do detalhe de um recibo salarial — sem fetch, sem
// mutações, sem reducer próprio. Recebe os dados e callbacks do container
// (hooks/usePayslipDetail.ts, usado em DetailView dentro de
// app/(platform)/payslips/page.tsx). `maskedData` fica aqui porque é estado
// puramente de UI (mostrar/ocultar NIF·NIB), sem ligação a dados remotos.
// Ver memory project_innova_component_separation_audit, item 3.2.

'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Mail,
  Printer,
  Wallet,
} from 'lucide-react';
import { API_URL } from '@/lib/apiClient';
import { formatDate as fmtDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button, buttonVariants } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { DisputeAction, DisputeState } from '@/hooks/usePayslipDetail';
import { fmtPeriod } from './format';
import { PayslipAmountBreakdown } from './PayslipAmountBreakdown';
import { PAYSLIP_STATUS_MAP, type Payslip } from './types';
import { LinkButton } from '@/components/ui/LinkButton';

function maskString(value: string, visibleEnd = 4): string {
  if (!value) return '—';
  const visible = value.slice(-visibleEnd);
  const masked = '•'.repeat(Math.max(0, value.length - visibleEnd));
  return masked + visible;
}

// Motivos habituais de disputa; "Outro" abre o campo de texto livre.
const MANUAL = '__manual';
const DISPUTE_REASONS = [
  'Salário base incorrecto',
  'Subsídio em falta ou incorrecto',
  'Horas extras não contabilizadas',
  'Dedução de IRT incorrecta',
  'Dedução de INSS incorrecta',
  'Desconto indevido (empréstimo, adiantamento ou seguro)',
  'Dias de falta ou de ausência mal registados',
  'Dados pessoais ou fiscais incorrectos',
];
const REASON_ITEMS = [
  ...DISPUTE_REASONS.map((r) => ({ value: r, label: r })),
  { value: MANUAL, label: 'Outro motivo (escrever manualmente)' },
];

// Estado "Emitido" a verde sólido com letra branca neste card; os restantes
// estados mantêm o mapa partilhado.
const CARD_STATUS_MAP: typeof PAYSLIP_STATUS_MAP = {
  ...PAYSLIP_STATUS_MAP,
  ISSUED: { label: 'Emitido', cls: 'bg-success text-white' },
};

type InfoRow = [label: string, value: string, masked?: boolean];

// Coluna de informação do recibo: título + linhas etiqueta/valor.
function InfoColumn({
  title,
  rows,
  action,
  footer,
}: {
  title: string;
  rows: InfoRow[];
  action?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2 border-b-2 border-[#0F1F3D] pb-2">
        <h4 className="font-body text-xs font-bold uppercase tracking-wider text-[#0F1F3D]">
          {title}
        </h4>
        {action}
      </div>
      <dl>
        {rows.map(([label, value, masked]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 border-b border-[#DCE6F7] py-2 last:border-0"
          >
            <dt className="shrink-0 font-body text-xs text-ink-muted">
              {label}
            </dt>
            <dd
              className={cn(
                'min-w-0 text-right font-body text-sm font-semibold',
                masked ? 'tracking-widest text-ink-faint' : 'text-brand-ink',
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {footer}
    </div>
  );
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
  const [manualReason, setManualReason] = useState(false);
  // Ao fechar/enviar a disputa, o motivo volta a ser escolhido da lista.
  useEffect(() => {
    if (!dispute.open) setManualReason(false);
  }, [dispute.open]);

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

  return (
    <div>
      <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar aos recibos
      </Button>

      <div className="payslip-print space-y-6">
        {/* Card 1 — empresa, colaborador e dados fiscais */}
        <section className="print:break-inside-avoid relative overflow-hidden rounded-[28px] border border-[#DCE6F7] bg-gradient-to-br from-white via-[#F4F8FF] to-[#E8F0FD] pb-5 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
          {/* Cabeçalho do documento */}
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-br-[28px] bg-gradient-to-r from-[#0F1F3D] to-[#1E4DA8] py-3 pl-6 pr-10 text-white">
              <FileText size={26} strokeWidth={1.8} aria-hidden="true" />
              <h3 className="font-body text-lg font-bold uppercase tracking-wide">
                Recibo de vencimento
              </h3>
            </div>
            <div className="pr-6 pt-3">
              <StatusBadge
                value={data.status}
                map={CARD_STATUS_MAP}
                variant="dot"
                className="px-3 py-1 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid gap-x-10 gap-y-6 px-6 pt-5 md:grid-cols-3">
            <InfoColumn
              title="Empresa e período"
              rows={[
                ['Empresa', 'INNOVA Angola, Lda.'],
                ['NIF', '5000045678'],
                ['Morada', 'Rua da Missão, 42, Luanda'],
                ['Período', fmtPeriod(data.period)],
                [
                  'Pagamento',
                  data.paymentDate ? fmtDate(data.paymentDate) : '—',
                ],
                ['Recibo', data.receiptCode],
              ]}
            />
            <InfoColumn
              title="Colaborador"
              rows={[
                ['Nome', data.user?.fullName ?? '—'],
                ['Nº Funcionário', data.user?.employeeNumber ?? '—'],
                ['Cargo', data.user?.position?.name ?? '—'],
                ['Departamento', data.user?.department?.name ?? '—'],
                ['Admissão', fmtDate(data.user?.hireDate ?? null)],
              ]}
            />
            <InfoColumn
              title="Dados fiscais"
              action={
                <LinkButton
                  onClick={() => setMaskedData((m) => !m)}
                  className="flex items-center gap-1 font-body text-xs normal-case tracking-normal"
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
                </LinkButton>
              }
              rows={[
                [
                  'NIF/BI',
                  maskedData
                    ? maskString(data.user?.nif ?? '', 3)
                    : (data.user?.nif ?? '—'),
                  maskedData,
                ],
                [
                  'NIB',
                  maskedData
                    ? maskString(data.user?.nib ?? '', 4)
                    : (data.user?.nib ?? '—'),
                  maskedData,
                ],
                ['INSS colaborador', '3%'],
                ['INSS empregador', '8%'],
                [
                  'Escalão IRT',
                  data.irtBracketRate !== null
                    ? `${((data.irtBracketRate ?? 0) * 100).toFixed(0)}%`
                    : '—',
                ],
              ]}
              footer={
                data.irtFormula ? (
                  <div className="mt-2 rounded-control bg-warning-subtle p-2 font-body text-xs text-warning-ink">
                    {data.irtFormula}
                  </div>
                ) : null
              }
            />
          </div>
        </section>

        {/* Card 2 — remunerações, deduções, resumo e acções */}
        <div className="print:break-before-page print:pt-[12mm]">
          <section className="print:break-inside-avoid relative overflow-hidden rounded-[28px] border border-[#DCE6F7] bg-gradient-to-br from-white via-[#F4F8FF] to-[#E8F0FD] pb-5 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
            <div className="inline-flex items-center gap-3 rounded-br-[28px] bg-gradient-to-r from-[#0F1F3D] to-[#1E4DA8] py-3 pl-6 pr-10 text-white">
              <Wallet size={26} strokeWidth={1.8} aria-hidden="true" />
              <h3 className="font-body text-lg font-bold uppercase tracking-wide">
                Remunerações e deduções
              </h3>
            </div>
            <div className="space-y-6 px-6 pt-5">
              {/* Remunerações / Deduções / Resumo final */}
              <PayslipAmountBreakdown payslip={data} compact />

              {/* Acções */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[#DCE6F7] pt-5 print:hidden">
                <a
                  href={`${API_URL}/payslips/my/${payslipId}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ intent: 'primary', size: 'md' })}
                >
                  <Download size={16} strokeWidth={1.75} />
                  Download PDF
                </a>
                <Button intent="secondary" onClick={() => window.print()}>
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
                  <div className="font-body text-sm font-medium text-black">
                    Abrir disputa sobre este recibo
                  </div>
                  <Select
                    className="w-full"
                    placeholder="Motivo da disputa *"
                    items={REASON_ITEMS}
                    value={
                      manualReason
                        ? MANUAL
                        : DISPUTE_REASONS.includes(dispute.reason)
                          ? dispute.reason
                          : ''
                    }
                    onValueChange={(v) => {
                      setManualReason(v === MANUAL);
                      dispatchDispute({
                        type: 'SET_REASON',
                        reason: v === MANUAL ? '' : v,
                      });
                    }}
                  />
                  {manualReason && (
                    <Input
                      className="w-full"
                      placeholder="Escreva o motivo da disputa *"
                      value={dispute.reason}
                      onChange={(e) =>
                        dispatchDispute({
                          type: 'SET_REASON',
                          reason: e.target.value,
                        })
                      }
                    />
                  )}
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
          </section>
        </div>
      </div>
    </div>
  );
}
