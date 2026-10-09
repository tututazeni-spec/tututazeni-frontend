// components/ui/NavyStatCard.tsx
// Card de estatística "cabeçalho azul-marinho + ícone circular sobreposto +
// número centralizado" (docs/prompt_claude_code_cards_estatisticas.md).
// Sem hover/escala: o card mantém-se estável.

import type { LucideIcon } from 'lucide-react';

export type NavyStatTone = 'blue' | 'green' | 'orange' | 'red';

// Classes completas: o Tailwind não detecta nomes montados dinamicamente
const TONES: Record<NavyStatTone, { bg: string; text: string }> = {
  blue: { bg: 'bg-[#1877F2]', text: 'text-[#1877F2]' },
  green: { bg: 'bg-[#218653]', text: 'text-[#218653]' },
  orange: { bg: 'bg-[#E99A16]', text: 'text-[#E99A16]' },
  red: { bg: 'bg-[#EF4657]', text: 'text-[#EF4657]' },
};

export function NavyStatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: NavyStatTone;
}) {
  const t = TONES[tone];
  return (
    <div className="relative h-[155px] overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)]">
      <div className="flex h-[60px] items-center bg-[#152F59] pl-[86px] pr-3">
        <h3 className="line-clamp-2 font-body text-[15px] font-semibold leading-tight text-white">
          {label}
        </h3>
      </div>
      <span
        aria-hidden
        className={`absolute left-4 top-[32px] flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-white text-white shadow-sm ${t.bg}`}
      >
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <div className="flex h-[95px] items-center justify-center px-3">
        <p className={`font-display text-[38px] font-bold leading-none ${t.text}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
