// components/development-plans/PlanCard.tsx
// Cartão de plano de desenvolvimento (lista "Os meus PDIs"). Segue o design
// do TemplateCard de "Planos de Integração" (onboarding): cabeçalho com
// fachada de vidro em CSS, linha de métricas, divisor e linhas de informação.

'use client';

import {
  CalendarDays,
  ClipboardList,
  Target,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDate as fmtDate } from '@/lib/format';
import { STATUS_CFG, PRIORITY_CFG } from './constants';
import { isOverdue, progressTextClass } from './utils';
import type { Plan } from './types';

// Paleta por plano (escolhida pelo id, estável entre renders).
// [início, meio, fim do gradiente]
const PALETTE: Array<[string, string, string]> = [
  ['#1267B8', '#0B4F9C', '#0F1F3D'], // azul
  ['#0E9AA7', '#0B7A86', '#0F3D45'], // turquesa
  ['#2E9E6B', '#1E7D52', '#0F3D2A'], // verde
  ['#7B5CD6', '#5B3FB5', '#2A1B63'], // roxo
  ['#D9822B', '#B5651A', '#5A3009'], // âmbar
  ['#D6455D', '#B02D45', '#5E1424'], // carmim
  ['#3F6FD8', '#2B4FB0', '#14235E'], // índigo
  ['#5B7083', '#46586A', '#1E2A36'], // ardósia
];

// Fachada de vidro: gradiente + grelha de montantes finos + brilho
function headerBackground([c1, c2, c3]: [string, string, string]) {
  return [
    'linear-gradient(135deg, rgba(15,31,61,0.35) 0%, rgba(15,31,61,0.10) 60%, rgba(255,255,255,0) 100%)',
    'repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 46px)',
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 38px)',
    `linear-gradient(160deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`,
  ].join(', ');
}

// Fundo do cabeçalho do plano — partilhado com o cabeçalho da vista de detalhe
// para que o mesmo PDI tenha a mesma cor nos dois sítios.
export function planHeaderBackground(plan: Plan) {
  return headerBackground(
    PALETTE[Math.abs((plan.user?.id ?? 0) * 3 + plan.id) % PALETTE.length],
  );
}

function Metric({
  icon: Icon,
  danger,
  children,
}: {
  icon: LucideIcon;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 text-[15px] first:pl-0 last:pr-0',
        danger ? 'text-[#C23A52]' : 'text-[#0F1F3D]',
      )}
    >
      <Icon
        size={22}
        strokeWidth={1.75}
        className={cn('shrink-0', danger ? 'text-[#C23A52]' : 'text-[#49658A]')}
      />
      <span>{children}</span>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  onClick: () => void;
  onDelete?: () => void;
}

export function PlanCard({ plan, onClick, onDelete }: PlanCardProps) {
  const pct = plan.actionProgress ?? plan.overallProgress;
  const hasOverdue = (plan.overdueActions ?? 0) > 0;
  // Cor depende do utilizador do PDI e do próprio plano: utilizadores
  // diferentes e PDIs consecutivos do mesmo utilizador não repetem cor.
  const palette =
    PALETTE[Math.abs((plan.user?.id ?? 0) * 3 + plan.id) % PALETTE.length];
  const statusLabel = STATUS_CFG[plan.status]?.label ?? plan.status;
  const priorityLabel = PRIORITY_CFG[plan.priority]?.label ?? plan.priority;
  const endOverdue = !!plan.endDate && isOverdue(plan.endDate, plan.status);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'cursor-pointer overflow-hidden rounded-[20px] border bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)] transition-shadow duration-150 hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        hasOverdue ? 'border-[#C23A52]' : 'border-[#D8E2F0]',
      )}
    >
      <div
        className="flex min-h-[190px] flex-col justify-between p-7 text-white"
        style={{ background: headerBackground(palette) }}
      >
        <div className="flex items-start justify-between">
          <Target size={30} strokeWidth={1.75} aria-hidden />
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white',
              plan.status === 'ACTIVE' ? 'bg-[#16A765]' : 'bg-white/20',
            )}
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-white" />
            {statusLabel}
          </span>
        </div>
        <div>
          <h3 className="break-words font-display text-[24px] font-semibold leading-tight">
            {plan.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[15px] text-white/80">
            {plan.goal}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
            <Avatar
              name={plan.user?.fullName ?? ''}
              url={plan.user?.avatarUrl ?? undefined}
              size="sm"
            />
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-semibold text-white">
              {priorityLabel}
            </span>
            {plan.period && <span>{plan.period}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-y-2 divide-x divide-[#E6ECF4] px-7 py-6">
        <Metric icon={ClipboardList}>{plan._count?.actions ?? 0} Acções</Metric>
        <Metric icon={Target}>{plan._count?.goals ?? 0} Metas</Metric>
        {plan.endDate && (
          <Metric icon={CalendarDays} danger={endOverdue}>
            {fmtDate(plan.endDate)}
          </Metric>
        )}
      </div>

      <div className="mx-7 border-t border-[#E6ECF4]" />

      <div className="space-y-3 px-7 py-6">
        <div className="flex items-center gap-3 rounded-[14px] bg-white px-4 py-3">
          <div className="flex-1">
            <ProgressBar value={pct} color={palette[0]} />
            <p className="mt-1.5 text-xs text-black">Progresso</p>
          </div>
          <span
            className={cn(
              'w-10 shrink-0 text-right font-data text-sm font-semibold',
              progressTextClass(pct),
            )}
          >
            {pct}%
          </span>
        </div>
        {(hasOverdue || onDelete) && (
          <div className="flex items-center justify-between gap-3">
            {hasOverdue ? (
              <span className="flex items-center gap-2 text-[15px] font-medium text-[#C23A52]">
                <TriangleAlert size={20} strokeWidth={1.75} />
                {plan.overdueActions} atrasada(s)
              </span>
            ) : (
              <span />
            )}
            {onDelete && (
              <button
                type="button"
                aria-label="Apagar PDI"
                title="Apagar PDI"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="rounded-lg p-2 text-[#49658A] transition-colors hover:bg-[#C23A52]/10 hover:text-[#C23A52]"
              >
                <Trash2 size={18} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
