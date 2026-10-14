// components/processes/ProcessModelCard.tsx
// Card de modelo de processo — mesmo desenho dos "Modelos pré-configurados"
// das Automações (cabeçalho em gradiente, tile do ícone, painel de dados).
// Partilhado por «Modelos de Processos» e «Fluxos de Trabalho».

import type { LucideIcon } from 'lucide-react';
import { Building2, ListChecks, PlayCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TEMPLATE_PALETTES } from '@/components/automation/templateTheme';
import { PROCESS_STATUS_MAP, RISK_LEVEL_MAP } from './constants';
import type { Process } from './types';

export interface ProcessModelCardProps {
  process: Process;
  icon: LucideIcon;
  onClick: () => void;
}

export function ProcessModelCard({
  process: p,
  icon: Icon,
  onClick,
}: ProcessModelCardProps) {
  const c = TEMPLATE_PALETTES[p.id % TEMPLATE_PALETTES.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-surface text-left shadow-resting transition-shadow duration-150 hover:shadow-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F1F3D] ${c.border}`}
    >
      <div
        className={`relative h-20 w-full overflow-hidden bg-gradient-to-br ${c.header}`}
      >
        <div
          className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/15"
          aria-hidden
        />
        <div
          className="absolute -bottom-10 right-24 h-24 w-24 rounded-full bg-white/10"
          aria-hidden
        />
        <Icon
          size={72}
          strokeWidth={1.25}
          className="absolute -bottom-2 right-5 rotate-12 text-white/25"
          aria-hidden
        />
        <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 shadow-sm">
          <StatusBadge
            value={p.status}
            map={PROCESS_STATUS_MAP}
            variant="dot"
          />
        </span>
      </div>

      <div className="relative -mt-6 flex w-full flex-1 flex-col gap-3 px-4 pb-4">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ring-[3px] ring-surface ${c.tile}`}
          aria-hidden
        >
          <Icon size={22} strokeWidth={1.75} />
        </span>

        <div className="min-w-0">
          <h4 className="break-words font-display text-base font-bold leading-snug text-[#0F1F3D]">
            {p.title}
          </h4>
          <p className="font-data text-[11px] text-ink-muted">
            {p.code} · v{p.version}
          </p>
          {p.tags?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {p.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className={`rounded-full px-2 py-0.5 font-body text-[11px] ${c.panel} ${c.accent}`}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <dl className={`mt-auto space-y-2 rounded-xl px-3 py-2.5 ${c.panel}`}>
          <div className="flex items-start gap-2.5">
            <Building2
              size={14}
              strokeWidth={1.75}
              className={`mt-0.5 shrink-0 ${c.accent}`}
              aria-hidden
            />
            <dt className="w-20 shrink-0 font-body text-xs text-ink-muted">
              Departamento
            </dt>
            <dd className="min-w-0 break-words font-body text-xs font-semibold text-[#0F1F3D]">
              {p.department?.name ?? '—'}
            </dd>
          </div>
          <div
            className={`flex items-start gap-2.5 border-t pt-2.5 ${c.divider}`}
          >
            <ListChecks
              size={14}
              strokeWidth={1.75}
              className={`mt-0.5 shrink-0 ${c.accent}`}
              aria-hidden
            />
            <dt className="w-20 shrink-0 font-body text-xs text-ink-muted">
              Etapas
            </dt>
            <dd className="min-w-0 font-body text-xs font-semibold text-[#0F1F3D]">
              {p.steps?.length ?? 0}
            </dd>
          </div>
          <div
            className={`flex items-start gap-2.5 border-t pt-2.5 ${c.divider}`}
          >
            <PlayCircle
              size={14}
              strokeWidth={1.75}
              className={`mt-0.5 shrink-0 ${c.accent}`}
              aria-hidden
            />
            <dt className="w-20 shrink-0 font-body text-xs text-ink-muted">
              Instâncias
            </dt>
            <dd className="min-w-0 font-body text-xs font-semibold text-[#0F1F3D]">
              {p._count?.instances ?? 0}
            </dd>
          </div>
          <div
            className={`flex items-center gap-2.5 border-t pt-2.5 ${c.divider}`}
          >
            <span className="w-[calc(14px+0.625rem+5rem)] shrink-0 font-body text-xs text-ink-muted">
              Risco
            </span>
            <StatusBadge value={p.riskLevel} map={RISK_LEVEL_MAP} />
          </div>
        </dl>
      </div>
    </button>
  );
}
