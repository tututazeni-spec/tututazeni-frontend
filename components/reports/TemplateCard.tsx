// components/reports/TemplateCard.tsx
// Cartão de template usado no Report Hub, no desenho NavyStatCard
// (cabeçalho azul-marinho + ícone circular sobreposto). Extraído de
// app/(platform)/reports/page.tsx.

import type { NavyStatTone } from '@/components/ui/NavyStatCard';
import { CAT_CONFIG } from './constants';
import type { Template } from './types';

// Classes completas: o Tailwind não detecta nomes montados dinamicamente
const TONES: Record<NavyStatTone, { bg: string; text: string }> = {
  blue: { bg: 'bg-[#1877F2]', text: 'text-[#1877F2]' },
  green: { bg: 'bg-[#218653]', text: 'text-[#218653]' },
  orange: { bg: 'bg-[#E99A16]', text: 'text-[#E99A16]' },
  red: { bg: 'bg-[#EF4657]', text: 'text-[#EF4657]' },
};

const CAT_TONE: Record<string, NavyStatTone> = {
  HR: 'blue',
  LEARNING: 'green',
  PERFORMANCE: 'orange',
  TALENT: 'green',
  ENGAGEMENT: 'blue',
  COMPLIANCE: 'red',
  OPERATIONAL: 'blue',
  FINANCIAL: 'orange',
};

interface TemplateCardProps {
  tpl: Template;
  onRun: (t: Template) => void;
}

export function TemplateCard({ tpl, onRun }: TemplateCardProps) {
  const cat = CAT_CONFIG[tpl.category] ?? CAT_CONFIG.HR;
  const Icon = cat.icon;
  const t = TONES[CAT_TONE[tpl.category] ?? 'blue'];

  return (
    <button
      type="button"
      onClick={() => onRun(tpl)}
      className="relative h-[155px] w-full overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white text-left shadow-[0_4px_14px_rgba(21,47,89,0.08)] transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100"
    >
      <div className="flex h-[60px] items-center bg-[#152F59] pl-[86px] pr-3">
        <h4 className="line-clamp-2 font-body text-[15px] font-semibold leading-tight text-white">
          {tpl.name}
        </h4>
      </div>
      <span
        aria-hidden
        className={`absolute left-4 top-[32px] flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-white text-white shadow-sm ${t.bg}`}
      >
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <div className="flex h-[95px] flex-col justify-between px-4 pb-3 pt-9">
        <p className="line-clamp-2 font-body text-xs leading-tight text-ink-faint">
          {tpl.description}
        </p>
        <div className="flex items-center justify-between">
          <span className={`font-body text-[11px] font-semibold ${t.text}`}>
            {cat.label}
          </span>
          <span className="font-body text-[11px] font-semibold text-primary">
            Executar →
          </span>
        </div>
      </div>
    </button>
  );
}
