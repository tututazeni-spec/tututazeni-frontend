// components/ui/NavyStatCard.tsx
// Card de estatística "cabeçalho azul-marinho + ícone circular sobreposto +
// número centralizado" (docs/prompt_claude_code_cards_estatisticas.md).
// Hover: zoom subtil (escala 1.06), desactivado com prefers-reduced-motion.

import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { goToTab } from '@/lib/tabNavigation';

// Valores longos (ex.: montantes em AOA) encolhem para caberem inteiros no cartão.
function valueSize(value: string | number): string {
  const len = String(value).length;
  if (len > 14) return 'text-[20px]';
  if (len > 10) return 'text-[24px]';
  if (len > 7) return 'text-[32px]';
  return 'text-[38px]';
}

export type NavyStatTone = 'blue' | 'green' | 'orange' | 'red' | 'gray';

// Classes completas: o Tailwind não detecta nomes montados dinamicamente
export const NAVY_TONES: Record<NavyStatTone, { bg: string; text: string }> = {
  blue: { bg: 'bg-[#1877F2]', text: 'text-[#1877F2]' },
  green: { bg: 'bg-[#218653]', text: 'text-[#218653]' },
  orange: { bg: 'bg-[#E99A16]', text: 'text-[#E99A16]' },
  red: { bg: 'bg-[#EF4657]', text: 'text-[#EF4657]' },
  gray: { bg: 'bg-[#8A94A6]', text: 'text-[#8A94A6]' },
};

// Tom extra só para o círculo do ícone (amarelo, distinto do laranja de `orange`)
export type NavyIconTone = NavyStatTone | 'yellow';

function iconBg(tone: NavyIconTone): string {
  return tone === 'yellow' ? 'bg-[#F2C230]' : NAVY_TONES[tone].bg;
}

export function NavyStatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  tone,
  iconTone,
  className,
  href,
  tab,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Linha secundária opcional (contexto do valor). */
  sub?: string;
  /** Variação opcional face ao período anterior. */
  trend?: number | null;
  tone: NavyStatTone;
  /** Cor só do círculo do ícone (omisso: igual a `tone`). */
  iconTone?: NavyIconTone;
  className?: string;
  /** Torna o card clicável: abre esta rota (outro módulo ou página). */
  href?: string;
  /** Torna o card clicável: salta para esta aba do módulo onde está. */
  tab?: string;
  /** Acção própria (ex.: abrir um filtro ou um modal). */
  onClick?: () => void;
}) {
  const t = NAVY_TONES[tone];
  // Palavra única longa (ex.: "Colaboradores") não deve partir a meio
  const singleWord = !/\s/.test(label.trim());
  // Palavra longa dentro de um rótulo com várias palavras ("Colaboradores
  // Activos") também não parte a meio: fonte menor e quebra só entre palavras.
  const hasLongWord = label.split(/\s+/).some((w) => w.length > 10);
  const interactive = !!(href || tab || onClick);
  const rootClass = cn(
    'relative flex min-h-[155px] flex-col overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)] transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100',
    interactive &&
      'group w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2',
    className,
  );
  const content = (
    <>
      <div className="flex min-h-[60px] shrink-0 items-center bg-[#152F59] py-2 pl-[80px] pr-2">
        <h3
          className={`min-w-0 font-body font-semibold leading-tight text-white ${singleWord && label.length > 10 ? 'whitespace-nowrap text-[12px]' : `break-normal ${label.length > 24 || hasLongWord ? 'text-[12px]' : label.length > 10 ? 'text-[13px]' : 'text-[15px]'}`}`}
        >
          {label}
        </h3>
        {interactive && (
          <ChevronRight
            aria-hidden
            size={18}
            className="ml-auto shrink-0 text-white/0 transition-colors group-hover:text-white/90 group-focus-visible:text-white/90"
          />
        )}
      </div>
      <span
        aria-hidden
        className={`absolute left-4 top-[32px] flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-white text-white shadow-sm ${iconBg(iconTone ?? tone)}`}
      >
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <div className="flex min-h-[95px] flex-1 flex-col items-center justify-center px-3 pb-2 pt-8 text-center">
        <p
          className={`flex items-baseline gap-2 whitespace-nowrap font-display font-bold leading-none ${valueSize(value)} ${t.text}`}
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
          <p className="mt-1.5 break-words font-body text-xs leading-tight text-ink-faint">
            {sub}
          </p>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={rootClass} title="Ver detalhes">
        {content}
      </Link>
    );
  }
  if (tab || onClick) {
    return (
      <button
        type="button"
        className={rootClass}
        title="Ver detalhes"
        onClick={(e) => {
          if (tab) goToTab(tab, e.currentTarget);
          onClick?.();
        }}
      >
        {content}
      </button>
    );
  }
  return <div className={rootClass}>{content}</div>;
}
