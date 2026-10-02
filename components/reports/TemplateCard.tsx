// components/reports/TemplateCard.tsx
// Cartão de template usado no Report Hub. Extraído de
// app/(platform)/reports/page.tsx.

import { CAT_CONFIG } from './constants';
import type { Template } from './types';

interface TemplateCardProps {
  tpl: Template;
  onRun: (t: Template) => void;
}

export function TemplateCard({ tpl, onRun }: TemplateCardProps) {
  const cat = CAT_CONFIG[tpl.category] ?? CAT_CONFIG.HR;
  const Icon = cat.icon;

  return (
    <button
      type="button"
      onClick={() => onRun(tpl)}
      className="w-full overflow-hidden rounded-2xl border border-border bg-white text-left shadow-resting transition-shadow hover:shadow-lg"
    >
      <div className={`h-1.5 w-full ${cat.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={cat.color} />
        <h4 className="mt-3 font-display text-sm font-semibold text-ink">
          {tpl.name}
        </h4>
        <p className="mt-1 font-body text-xs text-ink-faint">
          {tpl.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className={`font-body text-[10px] font-medium ${cat.color}`}>
            {cat.label}
          </span>
          <span className="font-body text-[10px] font-semibold text-primary">
            Executar →
          </span>
        </div>
      </div>
    </button>
  );
}