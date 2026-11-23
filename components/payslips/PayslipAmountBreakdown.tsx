// components/payslips/PayslipAmountBreakdown.tsx
// Bloco apresentacional Remunerações / Deduções / Salário líquido de um recibo,
// no desenho de public/images/remunerações.jpg: painel navy à esquerda com
// ilustração e título, painel claro ao centro com as duas colunas e uma
// pílula de total em cada, e cartão navy à direita com o salário líquido.
// Partilhado entre a vista do colaborador (components/payslips) e a vista
// admin (components/payroll/AdminPayslipDetailView).

import { CheckCircle2, FileText, Wallet } from 'lucide-react';
import { formatKz as fmtKz } from '@/lib/format';
import type { Payslip } from './types';

export interface PayslipAmountBreakdownProps {
  payslip: Pick<
    Payslip,
    | 'baseSalary'
    | 'mealAllowance'
    | 'vacationAllowance'
    | 'christmasAllowance'
    | 'overtime'
    | 'bonuses'
    | 'otherAllowances'
    | 'grossSalary'
    | 'incomeTax'
    | 'socialSecurity'
    | 'employerInss'
    | 'healthInsurance'
    | 'loanDeduction'
    | 'advanceDeduction'
    | 'otherDeductions'
    | 'totalDeductions'
    | 'netSalary'
    | 'irtBracketRate'
  >;
}

// Cores medidas na imagem de referência.
const NAVY_GRADIENT =
  'linear-gradient(135deg, #0A2A57 0%, #052659 45%, #011E4D 100%)';
const NAVY_TEXT = '#0F1F3D';
const PANEL_BG = '#F5F9FF';
const PILL_BG = '#DCE7FB';
const ACCENT = '#1E6FE0';

interface Row {
  label: string;
  amount: number;
  sub?: string;
}

function Rows({ rows, minus }: { rows: Row[]; minus?: boolean }) {
  return (
    <div>
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-baseline justify-between gap-3 border-b border-[#EAEFF8] py-1.5 last:border-0"
        >
          <span className="font-body text-sm text-[#1B2742]">
            {r.label}
            {r.sub && (
              <span className="ml-2 text-xs text-ink-faint">{r.sub}</span>
            )}
          </span>
          <span className="shrink-0 font-body text-sm text-[#1B2742]">
            {minus ? '− ' : ''}
            {fmtKz(r.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  children,
}: {
  icon: typeof Wallet;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <Icon
        className="h-6 w-6"
        style={{ color: ACCENT }}
        strokeWidth={1.75}
        aria-hidden
      />
      <h4
        className="font-display text-lg font-bold"
        style={{ color: NAVY_TEXT }}
      >
        {children}
      </h4>
    </div>
  );
}

function TotalPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="mt-auto flex items-baseline justify-between gap-3 rounded-[12px] px-4 py-2.5"
      style={{ backgroundColor: PILL_BG }}
    >
      <span
        className="font-body text-sm font-bold"
        style={{ color: NAVY_TEXT }}
      >
        {label}
      </span>
      <span
        className="font-body text-sm font-bold"
        style={{ color: NAVY_TEXT }}
      >
        {value}
      </span>
    </div>
  );
}

/** Documento com moeda sobre plataforma, como na imagem de referência. */
function SummaryIllustration() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-24 w-24 shrink-0"
      role="img"
      aria-label="Resumo da remuneração"
    >
      <defs>
        <linearGradient id="pab-doc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4C8DFF" />
          <stop offset="1" stopColor="#1D4FD8" />
        </linearGradient>
        <linearGradient id="pab-coin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
      {/* plataforma */}
      <ellipse cx="60" cy="98" rx="50" ry="14" fill="#0B3A8F" />
      <ellipse cx="60" cy="92" rx="50" ry="14" fill="#1E5BD8" />
      <ellipse cx="60" cy="90" rx="38" ry="9" fill="#0A2F7A" />
      {/* documento */}
      <rect x="26" y="14" width="50" height="66" rx="7" fill="url(#pab-doc)" />
      <rect x="34" y="26" width="30" height="4" rx="2" fill="#fff" />
      <rect
        x="34"
        y="37"
        width="34"
        height="4"
        rx="2"
        fill="#fff"
        opacity=".85"
      />
      <rect
        x="34"
        y="48"
        width="24"
        height="4"
        rx="2"
        fill="#fff"
        opacity=".85"
      />
      <rect
        x="34"
        y="59"
        width="18"
        height="4"
        rx="2"
        fill="#fff"
        opacity=".7"
      />
      {/* moeda */}
      <circle cx="82" cy="70" r="20" fill="#0B3A8F" />
      <circle cx="82" cy="67" r="20" fill="url(#pab-coin)" />
      <circle
        cx="82"
        cy="67"
        r="15"
        fill="none"
        stroke="#8FB8FF"
        strokeWidth="1.5"
      />
      <text
        x="82"
        y="75"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="#fff"
        fontFamily="inherit"
      >
        $
      </text>
    </svg>
  );
}

export function PayslipAmountBreakdown({
  payslip: data,
}: PayslipAmountBreakdownProps) {
  const irtSub =
    data.irtBracketRate !== null
      ? `${((data.irtBracketRate ?? 0) * 100).toFixed(0)}%`
      : undefined;

  const earnings = [
    { label: 'Salário base', amount: data.baseSalary },
    data.mealAllowance > 0 && {
      label: 'Subsídio de alimentação',
      amount: data.mealAllowance,
    },
    data.vacationAllowance > 0 && {
      label: 'Subsídio de férias',
      amount: data.vacationAllowance,
    },
    data.christmasAllowance > 0 && {
      label: 'Subsídio de Natal',
      amount: data.christmasAllowance,
    },
    data.overtime > 0 && { label: 'Horas extras', amount: data.overtime },
    data.bonuses > 0 && { label: 'Prémios / Comissões', amount: data.bonuses },
    data.otherAllowances > 0 && {
      label: 'Outros subsídios',
      amount: data.otherAllowances,
    },
  ].filter(Boolean) as Row[];

  const deductions = [
    { label: 'IRT', amount: data.incomeTax, sub: irtSub },
    { label: 'INSS colaborador (3%)', amount: data.socialSecurity },
    data.healthInsurance > 0 && {
      label: 'Seguro de saúde',
      amount: data.healthInsurance,
    },
    data.loanDeduction > 0 && {
      label: 'Dedução empréstimo',
      amount: data.loanDeduction,
    },
    data.advanceDeduction > 0 && {
      label: 'Adiantamento salarial',
      amount: data.advanceDeduction,
    },
    data.otherDeductions > 0 && {
      label: 'Outras deduções',
      amount: data.otherDeductions,
    },
  ].filter(Boolean) as Row[];

  return (
    <div>
      <div
        className="grid overflow-hidden rounded-[22px] border border-[#D6E0F2] lg:grid-cols-[minmax(330px,31%)_1fr_minmax(210px,18%)]"
        style={{
          backgroundColor: PANEL_BG,
          boxShadow: '0 6px 18px rgba(21,47,89,0.12)',
        }}
      >
        {/* Painel esquerdo (navy, borda direita curva) */}
        <div
          className="relative flex items-center gap-4 overflow-hidden px-6 py-7 text-white lg:rounded-r-[110px] lg:pr-16"
          style={{ background: NAVY_GRADIENT }}
        >
          <svg
            aria-hidden
            viewBox="0 0 200 60"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -bottom-px right-0 hidden h-16 w-3/5 lg:block"
          >
            <path
              d="M0 60 C 60 58, 130 40, 200 0 L200 60 Z"
              fill={ACCENT}
              opacity=".75"
            />
          </svg>
          <SummaryIllustration />
          <span className="hidden h-24 w-px bg-white/25 sm:block" aria-hidden />
          <div className="relative">
            <p className="font-display text-2xl font-bold leading-tight">
              Resumo da Remuneração
            </p>
            <p className="mt-2 font-body text-sm leading-snug text-white/75">
              Detalhes da sua remuneração e deduções
            </p>
          </div>
        </div>

        {/* Painel central */}
        <div className="grid gap-6 px-6 py-5 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-[#BCC6E0]">
          <div className="flex flex-col sm:pr-6">
            <SectionHeader icon={Wallet}>Remunerações</SectionHeader>
            <Rows rows={earnings} />
            <div className="min-h-3 flex-1" />
            <TotalPill label="Total bruto" value={fmtKz(data.grossSalary)} />
          </div>
          <div className="flex flex-col sm:pl-6">
            <SectionHeader icon={FileText}>Deduções</SectionHeader>
            <Rows rows={deductions} minus />
            <div className="min-h-3 flex-1" />
            <TotalPill
              label="Total deduções"
              value={`− ${fmtKz(data.totalDeductions)}`}
            />
          </div>
        </div>

        {/* Cartão do salário líquido */}
        <div className="p-2.5 lg:pl-0">
          <div
            className="relative flex h-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[20px] px-5 py-6 text-center text-white"
            style={{ background: NAVY_GRADIENT }}
          >
            <svg
              aria-hidden
              viewBox="0 0 200 80"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -bottom-px right-0 h-14 w-full"
            >
              <path
                d="M60 80 C 120 78, 170 50, 200 6 L200 80 Z"
                fill={ACCENT}
                opacity=".85"
              />
            </svg>
            <CheckCircle2
              className="relative h-10 w-10"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="relative mt-1 font-body text-sm font-bold">
              Salário líquido
            </p>
            <p className="relative font-display text-3xl font-bold leading-tight">
              {fmtKz(data.netSalary)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
