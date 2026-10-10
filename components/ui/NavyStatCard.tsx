// components/ui/NavyStatCard.tsx
// Card de estatística "cabeçalho azul-marinho + ícone circular sobreposto +
// número centralizado" (docs/prompt_claude_code_cards_estatisticas.md).
// Hover: zoom subtil (escala 1.06), desactivado com prefers-reduced-motion.

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type NavyStatTone = 'blue' | 'green' | 'orange' | 'red';

// Classes completas: o Tailwind não detecta nomes montados dinamicamente
export const NAVY_TONES: Record<NavyStatTone, { bg: string; text: string }> = {
  blue: { bg: 'bg-[#1877F2]', text: 'text-[#1877F2]' },
  green: { bg: 'bg-[#218653]', text: 'text-[#218653]' },
  orange: { bg: 'bg-[#E99A16]', text: 'text-[#E99A16]' },
  red: { bg: 'bg-[#EF4657]', text: 'text-[#EF4657]' },
};

export function NavyStatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  tone,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Linha secundária opcional (contexto do valor). */
  sub?: string;
  /** Variação opcional face ao período anterior. */
  trend?: number | null;
  tone: NavyStatTone;
  className?: string;
}) {
  const t = NAVY_TONES[tone];
  return (
    <div
      className={cn(
        'relative h-[155px] overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)] transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100',
        className,
      )}
    >
      <div className="flex h-[60px] items-center bg-[#152F59] pl-[86px] pr-3">
        <h3 className="break-words font-body text-[15px] font-semibold leading-tight text-white">
          {label}
        </h3>
      </div>
      <span
        aria-hidden
        className={`absolute left-4 top-[32px] flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-white text-white shadow-sm ${t.bg}`}
      >
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <div className="flex h-[95px] flex-col items-center justify-center px-3 text-center">
        <p
          className={`flex items-baseline gap-2 font-display text-[38px] font-bold leading-none ${t.text}`}
        >
          {value}
          {typeof trend === 'number' && trend !== 0 && (
            <span
              className={`font-body text-xs font-semibold ${trend > 0 ? 'text-success' : 'text-danger'}`}
            >
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}
            </span>
          )}
        </p>
        {sub && (
          <p className="mt-1.5 line-clamp-2 font-body text-xs leading-tight text-ink-faint">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
