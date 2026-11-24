// components/payroll/ClosureView.tsx
// Fecho Salarial (docs/payroll.md §8): validação RH + financeira,
// checklist e fecho definitivo (GET/POST /payroll/runs/:id/closure/*).
'use client';

import { useState, type ReactNode } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  BadgeCheck,
  Filter,
  Landmark,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { WalletStat } from '@/components/roi-impact/WalletStat';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import { RunPicker } from './RunPicker';
import { RUN_STATUS_MAP } from './types';
import type { ClosureOverview } from './insightTypes';

interface StepProps {
  icon: LucideIcon;
  label: string;
  /** 1.ª linha em destaque (quem); as seguintes em tom suave (quando). */
  lines: string[];
  action?: ReactNode;
}

/** Coluna do cartão de aprovação: ícone, título, texto e acção opcional. */
function Step({ icon: Icon, label, lines, action }: StepProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-4">
      <Icon size={20} strokeWidth={1.5} className="shrink-0 text-[#1E4DA8]" />
      <div className="min-w-0 text-left">
        <div className="font-body text-[13.89px] font-medium leading-tight text-[#0F1F3D]">
          {label}
        </div>
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              i === 0
                ? 'mt-0.5 font-body text-[13.23px] font-semibold leading-tight text-[#0F1F3D]'
                : 'font-body text-[13.23px] leading-tight text-[#0F1F3D]/70'
            }
          >
            {l}
          </div>
        ))}
      </div>
      {action}
    </div>
  );
}

interface ValidationProps {
  icon: LucideIcon;
  label: string;
  info: { at: string; by: string | null } | null;
  onValidate: () => void;
  pending: boolean;
  disabled: boolean;
}

function Validation({
  icon,
  label,
  info,
  onValidate,
  pending,
  disabled,
}: ValidationProps) {
  return (
    <Step
      icon={icon}
      label={label}
      lines={
        info
          ? [`Validado por ${info.by ?? '—'}`, fmtDate(info.at)]
          : ['Por validar']
      }
      action={
        !info && (
          <button
            type="button"
            disabled={disabled || pending}
            onClick={onValidate}
            className="shrink-0 cursor-pointer rounded-full bg-[#0F1F3D] px-3 py-0.5 font-body text-[13.23px] font-semibold text-white transition hover:bg-[#1E4DA8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'A validar…' : 'Validar'}
          </button>
        )
      }
    />
  );
}

export function ClosureView() {
  const notify = useToast();
  const [runId, setRunId] = useState<number | null>(null);

  const { data, isLoading, error } = useApiQuery<ClosureOverview>(
    queryKeys.payroll.section('closure', runId),
    `/payroll/runs/${runId}/closure`,
    { enabled: runId !== null, staleTime: STALE_TIME.DYNAMIC },
  );

  const act = useApiMutation(
    (action: 'validate-hr' | 'validate-finance' | 'close') =>
      apiClient.post<ClosureOverview>(
        `/payroll/runs/${runId}/closure/${action}`,
      ),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: (res) =>
        notify({
          title: res.closed ? 'Folha fechada' : 'Validação registada',
          intent: 'success',
        }),
    },
  );

  const done = data?.checklist.filter((i) => i.ok).length ?? 0;

  return (
    <div>
      <div className="mb-5">
        <RunPicker
          variant="underline"
          icon={Filter}
          value={runId}
          onChange={setRunId}
        />
      </div>

      {runId === null && (
        <EmptyState
          title="Escolha um processamento"
          description="O fecho encerra definitivamente a folha depois das validações e do pagamento."
        />
      )}
      {runId !== null && isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 font-body text-sm text-ink-muted">
            Período <span className="font-body text-ink">{data.period}</span>
            <StatusBadge
              value={data.status as keyof typeof RUN_STATUS_MAP}
              map={RUN_STATUS_MAP}
              variant="dot"
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            <WalletStat
              zoom
              tight
              image="/images/colaboradores.png"
              money="coins"
              tone="blue"
              label="Colaboradores"
              value={data.totals.employees}
            />
            <WalletStat
              zoom
              tight
              image="/images/carteira.png"
              money="bills"
              tone="blue"
              label="Total bruto"
              value={fmtKz(data.totals.totalGross)}
            />
            <WalletStat
              zoom
              tight
              image="/images/carteira.png"
              money="stack"
              tone="green"
              label="Total líquido"
              value={fmtKz(data.totals.totalNet)}
            />
            <WalletStat
              zoom
              tight
              image="/images/carteira-vermelha.png"
              money="coins"
              tone="red"
              label="Impostos (INSS + IRT)"
              value={fmtKz(data.totals.totalTaxes)}
            />
            <WalletStat
              zoom
              tight
              image="/images/carteira-vermelha.png"
              money="bills"
              tone="red"
              label="Encargos patronais"
              value={fmtKz(data.totals.totalEmployerCharges)}
            />
            <WalletStat
              zoom
              tight
              image="/images/recibos.png"
              money="mixed"
              tone="blue"
              label="Recibos emitidos"
              value={data.totals.receiptsIssued}
            />
            <WalletStat
              zoom
              tight
              check
              image="/images/carteira-vermelha.png"
              money="fan"
              tone="red"
              label="Pagamentos processados"
              value={data.totals.paymentsProcessed}
            />
          </div>

          <div className="relative mt-6 overflow-hidden rounded-[28px] border border-[#DCE6F7] bg-white py-2 text-[#0F1F3D] shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
            <div className="relative grid items-center gap-3 md:grid-cols-3 md:gap-0">
              <div>
                <Step
                  icon={BadgeCheck}
                  label="Aprovação"
                  lines={
                    data.approval
                      ? [
                          `Aprovado por ${data.approval.by ?? '—'}`,
                          fmtDate(data.approval.at),
                        ]
                      : ['Por aprovar']
                  }
                />
              </div>
              <div className="md:border-l md:border-[#DCE6F7]">
                <Validation
                  icon={Users}
                  label="Validação RH"
                  info={data.hrValidation}
                  pending={act.isPending && act.variables === 'validate-hr'}
                  disabled={data.closed || act.isPending}
                  onValidate={() => act.mutate('validate-hr')}
                />
              </div>
              <div className="md:border-l md:border-[#DCE6F7]">
                <Validation
                  icon={Landmark}
                  label="Validação financeira"
                  info={data.financeValidation}
                  pending={act.isPending && act.variables === 'validate-finance'}
                  disabled={data.closed || act.isPending}
                  onValidate={() => act.mutate('validate-finance')}
                />
              </div>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-[28px] border border-[#DCE6F7] bg-gradient-to-br from-white via-[#F4F8FF] to-[#E8F0FD] pb-5 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
            <div className="inline-flex items-center gap-3 rounded-br-[28px] bg-gradient-to-r from-[#0F1F3D] to-[#1E4DA8] py-3 pl-6 pr-10 text-white">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="18" rx="3" />
                <path d="M9 4V3h6v1M8 10h8M8 14h8M8 18h5" />
              </svg>
              <h3 className="font-body text-lg font-bold uppercase tracking-wide">
                Checklist ({done}/{data.checklist.length})
              </h3>
            </div>

            <div className="flex items-center gap-6 px-6 pt-4">
              <ul className="grid flex-1 gap-x-10 gap-y-3 font-body text-base text-brand-ink sm:grid-cols-2 sm:grid-flow-col sm:grid-rows-[repeat(5,auto)]">
                {data.checklist.map((i) => (
                  <li key={i.code} className="flex items-center gap-3">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="shrink-0"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="11"
                        fill={i.ok ? '#3E9B5A' : '#FFFFFF'}
                        stroke={i.ok ? '#3E9B5A' : '#C3CFE3'}
                        strokeWidth="1.5"
                      />
                      {i.ok && (
                        <path
                          d="M7 12.5l3.3 3.3L17 9"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                    <span className={i.ok ? '' : 'text-ink-muted'}>
                      {i.label}
                    </span>
                  </li>
                ))}
              </ul>

              <svg
                width="150"
                height="170"
                viewBox="0 0 150 170"
                aria-hidden="true"
                className="hidden shrink-0 md:block"
              >
                <rect x="20" y="22" width="96" height="124" rx="12" fill="#3B6FE0" />
                <rect x="30" y="34" width="76" height="102" rx="6" fill="#F4F8FF" />
                <rect x="48" y="12" width="40" height="18" rx="9" fill="#2A55B8" />
                <circle cx="68" cy="8" r="6" fill="none" stroke="#2A55B8" strokeWidth="3" />
                <g stroke="#3B6FE0" strokeWidth="4" strokeLinecap="round" fill="none">
                  <path d="M38 58l5 5 8-9M38 86l5 5 8-9M38 114l5 5 8-9" />
                </g>
                <g stroke="#7FA2EE" strokeWidth="5" strokeLinecap="round">
                  <path d="M60 60h36M60 88h36M60 116h22" />
                </g>
                <circle cx="108" cy="124" r="26" fill="#2F66DB" stroke="#fff" strokeWidth="4" />
                <path
                  d="M96 124l8 8 14-16"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="mx-6 mt-4 flex flex-wrap items-center gap-4 border-t border-[#DCE6F7] pt-5">
              {!data.closed && (
                <>
                  <button
                    type="button"
                    disabled={!data.canClose || act.isPending}
                    onClick={() => act.mutate('close')}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0F1F3D] px-6 py-3 font-body text-base font-semibold text-white shadow-md transition hover:bg-[#1A3160] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span aria-hidden="true">✕</span>
                    {act.isPending && act.variables === 'close'
                      ? 'A fechar…'
                      : 'Fechar folha'}
                  </button>
                  {!data.canClose && (
                    <>
                      <span
                        className="hidden h-8 w-px bg-[#0F1F3D]/40 sm:block"
                        aria-hidden="true"
                      />
                      <span className="font-body text-sm text-brand-ink">
                        Requer checklist completa e as duas validações.
                      </span>
                    </>
                  )}
                </>
              )}
              {data.closed && (
                <p className="font-body text-sm text-brand-ink">
                  A folha está protegida contra alterações normais.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
