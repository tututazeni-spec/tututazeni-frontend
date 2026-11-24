// components/payroll/PayslipDisputeCard.tsx
// Card de uma disputa no detalhe do recibo, no desenho de
// public/images/fechos salariais.jpg (o da Checklist em ClosureView): separador
// navy no topo e informação com selos, numa só linha baixa.
'use client';

import type { ReactNode } from 'react';
import { CalendarCheck, CalendarDays, MessageSquareText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import { DISPUTE_STATUS_MAP, type PayslipDispute } from './types';

export interface PayslipDisputeCardProps {
  dispute: Pick<
    PayslipDispute,
    'status' | 'reason' | 'details' | 'createdAt' | 'resolvedAt' | 'resolution'
  >;
  /** Só passado em disputas abertas: mostra o botão "Resolver". */
  onResolve?: () => void;
  /** Itens extra no início da lista (ex.: colaborador e recibo, na aba Disputas). */
  leading?: ReactNode;
}

export function DisputeItem({
  icon: Icon,
  label,
  children,
  done,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  done?: boolean;
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: done ? '#3E9B5A' : '#1E4DA8' }}
        aria-hidden
      >
        <Icon className="h-3 w-3" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="font-body text-[10.7px] leading-tight text-black">
          {label}
        </p>
        <div className="break-words font-body text-[12.8px] leading-tight text-black">
          {children}
        </div>
      </div>
    </li>
  );
}

export function PayslipDisputeCard({
  dispute: d,
  onResolve,
  leading,
}: PayslipDisputeCardProps) {
  const status = DISPUTE_STATUS_MAP[d.status]?.label ?? d.status;
  const resolved = d.status === 'RESOLVED';

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#DCE6F7] bg-gradient-to-br from-white via-[#F4F8FF] to-[#E8F0FD] pb-1.5 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      <div className="inline-flex max-w-full items-center gap-3 rounded-br-[28px] bg-gradient-to-r from-[#0F1F3D] to-[#1E4DA8] py-1 pl-4 pr-6 text-white">
        <MessageSquareText
          className="h-4 w-4 shrink-0"
          strokeWidth={1.8}
          aria-hidden
        />
        <h4 className="min-w-0 break-words font-body text-sm font-bold tracking-wide">
          {d.reason}
        </h4>
        <span className="shrink-0 rounded-full bg-white/15 px-3 py-0.5 font-body text-xs font-semibold">
          {status}
        </span>
      </div>

      <div className="flex items-center gap-4 px-5 pt-1.5">
        <ul className="flex flex-1 flex-wrap gap-x-8 gap-y-1">
          {leading}
          {d.details && (
            <DisputeItem icon={MessageSquareText} label="Detalhes">
              {d.details}
            </DisputeItem>
          )}
          <DisputeItem icon={CalendarDays} label="Aberta em">
            {fmtDate(d.createdAt)}
          </DisputeItem>
          {resolved && (
            <DisputeItem icon={CalendarCheck} label="Resolvida em" done>
              {d.resolvedAt ? fmtDate(d.resolvedAt) : '—'}
            </DisputeItem>
          )}
          {resolved && d.resolution && (
            <DisputeItem icon={CalendarCheck} label="Resolução" done>
              {d.resolution}
            </DisputeItem>
          )}
        </ul>
        {onResolve && (
          <button
            type="button"
            onClick={onResolve}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0F1F3D] px-4 py-1.5 font-body text-sm font-semibold text-white shadow-md transition hover:bg-[#1A3160]"
          >
            <span aria-hidden="true">✓</span>
            Resolver
          </button>
        )}
      </div>
    </section>
  );
}
