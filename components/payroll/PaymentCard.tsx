// components/payroll/PaymentCard.tsx
// Card de um pagamento no desenho de public/images/pagamentos.jpg: faixa navy
// em degradé com ilustração à esquerda, colunas com ícone separadas por linhas
// finas e um painel claro curvo à direita com os botões em pílula.
// Mantém a tipografia da plataforma (font-display / font-body).
'use client';

import type { ReactNode } from 'react';
import {
  CalendarDays,
  Coins,
  CreditCard,
  Landmark,
  UserRound,
} from 'lucide-react';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { fmtPeriodNumeric } from '@/components/payslips/format';
import { PAYMENT_STATUS_MAP, type PayrollPayment } from './insightTypes';

// Cores medidas na imagem de referência.
const BAND =
  'linear-gradient(100deg, #001A4D 0%, #002056 30%, #013B8D 72%, #0255C1 100%)';
const SOFT_BLUE = '#8FB8FF';
const DIVIDER = 'rgba(120,150,230,0.45)';
const PANEL = '#F6FAFE';

function Illustration() {
  return (
    <svg
      viewBox="0 0 110 120"
      className="h-24 w-24 shrink-0"
      role="img"
      aria-label="Pagamento"
    >
      <defs>
        <linearGradient id="pc-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6FA8FF" />
          <stop offset="1" stopColor="#2F63D8" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 55 60)">
        <rect
          x="14"
          y="18"
          width="70"
          height="82"
          rx="12"
          fill="url(#pc-card)"
        />
        <rect x="22" y="28" width="54" height="62" rx="8" fill="#F1F6FF" />
        <circle cx="49" cy="52" r="13" fill="#3F7BEA" />
        <text
          x="49"
          y="58"
          textAnchor="middle"
          fontSize="17"
          fontWeight="700"
          fill="#fff"
          fontFamily="inherit"
        >
          $
        </text>
        <rect x="32" y="72" width="34" height="6" rx="3" fill="#3F7BEA" />
        <rect x="38" y="82" width="22" height="5" rx="2.5" fill="#9DBDF5" />
        <rect x="41" y="8" width="16" height="14" rx="6" fill="#2A56C6" />
        <circle cx="49" cy="15" r="3" fill="#CFE0FF" />
      </g>
      <circle
        cx="84"
        cy="88"
        r="15"
        fill="#3DBDB0"
        stroke="#F1F6FF"
        strokeWidth="3"
      />
      <path
        d="M77 88l5 5 9-10"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Col({
  icon: Icon,
  label,
  value,
  sub,
  first,
}: {
  icon: typeof Landmark;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  first?: boolean;
}) {
  return (
    <div
      className="flex min-w-0 flex-col gap-1 lg:px-5"
      style={first ? undefined : { borderLeft: `1px solid ${DIVIDER}` }}
    >
      <Icon className="h-6 w-6 text-white" strokeWidth={1.5} aria-hidden />
      <p className="font-body text-sm text-white">{label}</p>
      <p className="break-words font-body text-sm font-bold leading-snug text-white">
        {value}
      </p>
      {sub && (
        <p className="break-words font-body text-xs leading-snug text-white/70">
          {sub}
        </p>
      )}
    </div>
  );
}

export interface PaymentCardProps {
  payment: PayrollPayment;
  /** Botões do painel direito (já com os estilos de pílula). */
  actions: ReactNode;
}

export function PaymentCard({ payment: p, actions }: PaymentCardProps) {
  const status = PAYMENT_STATUS_MAP[p.status]?.label ?? p.status;
  return (
    <article
      className="overflow-hidden rounded-[22px] shadow-[0_6px_18px_rgba(21,47,89,0.14)] lg:grid lg:grid-cols-[minmax(250px,21%)_1fr_minmax(190px,17%)]"
      style={{ background: BAND }}
    >
      {/* Ilustração + referência */}
      <div className="flex items-center gap-4 px-6 py-6">
        <Illustration />
        <div
          className="min-w-0 pl-4"
          style={{ borderLeft: `1px solid ${DIVIDER}` }}
        >
          <p className="whitespace-nowrap font-display text-base font-bold leading-tight tracking-tight text-white">
            {p.reference ?? `Pagamento #${p.id}`}
          </p>
          <p
            className="mt-1.5 font-body text-base font-semibold"
            style={{ color: SOFT_BLUE }}
          >
            {status}
          </p>
          <p className="mt-1 font-body text-sm text-white">
            <span className="text-white/70">Período </span>
            {fmtPeriodNumeric(p.period)}
          </p>
          {p.errorMessage && (
            <p className="mt-1 max-w-[220px] font-body text-xs text-[#FFB4B4]">
              {p.errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Colunas de informação */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-5 px-6 pb-6 pt-1 sm:grid-cols-3 lg:grid-cols-5 lg:items-start lg:px-2 lg:py-7">
        <Col first icon={Landmark} label="Banco" value={p.bankName ?? '—'} />
        <Col icon={CreditCard} label="Conta" value={p.paymentAccount ?? '—'} />
        <Col
          icon={Coins}
          label="Valor total"
          value={fmtKz(p.totalAmount)}
          sub={`${p.employeeCount} ${
            p.employeeCount === 1 ? 'colaborador' : 'colaboradores'
          }`}
        />
        <Col
          icon={CalendarDays}
          label="Data prevista"
          value={p.expectedDate ? fmtDate(p.expectedDate) : '—'}
          sub={`Efectiva: ${p.effectiveDate ? fmtDate(p.effectiveDate) : '—'}`}
        />
        <Col
          icon={UserRound}
          label="Responsável"
          value={p.responsibleName ?? '—'}
        />
      </div>

      {/* Painel claro curvo com os botões */}
      <div
        className="flex flex-col justify-center gap-2.5 px-6 py-6 lg:rounded-l-[80px] lg:pl-10"
        style={{ backgroundColor: PANEL }}
      >
        {actions}
      </div>
    </article>
  );
}
