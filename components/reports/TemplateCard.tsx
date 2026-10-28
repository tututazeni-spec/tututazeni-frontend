// components/reports/TemplateCard.tsx
// Cartão de template usado no Report Hub. Mesmo desenho dos "Modelos
// pré-configurados" das Automações (cabeçalho em gradiente, tile do ícone,
// painel de dados), a 80% da largura e da altura. Extraído de
// app/(platform)/reports/page.tsx.

import { ArrowRight, Tag } from 'lucide-react';
import { TEMPLATE_PALETTES } from '@/components/automation/templateTheme';
import { CAT_CONFIG } from './constants';
import type { Template } from './types';

interface TemplateCardProps {
  tpl: Template;
  index: number;
  onRun: (t: Template) => void;
}

export function TemplateCard({ tpl, index, onRun }: TemplateCardProps) {
  const cat = CAT_CONFIG[tpl.category] ?? CAT_CONFIG.HR;
  const Icon = cat.icon;
  const c = TEMPLATE_PALETTES[index % TEMPLATE_PALETTES.length];

  return (
    <button
      type="button"
      onClick={() => onRun(tpl)}
      className={`group flex h-[230px] w-4/5 flex-col overflow-hidden rounded-panel border bg-surface text-left shadow-resting transition-shadow duration-150 hover:shadow-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${c.border}`}
    >
      <div
        className={`relative h-16 w-full shrink-0 overflow-hidden bg-gradient-to-br ${c.header}`}
      >
        <div
          className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-white/15"
          aria-hidden
        />
        <div
          className="absolute -bottom-8 right-20 h-20 w-20 rounded-full bg-white/10"
          aria-hidden
        />
        <Icon
          size={58}
          strokeWidth={1.25}
          className="absolute -bottom-2 right-4 rotate-12 text-white/25"
          aria-hidden
        />
        <span className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-0.5 font-body text-micro font-medium text-[#20241f] shadow-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} aria-hidden />
          {cat.label}
        </span>
      </div>

      <div className="relative -mt-5 flex w-full min-w-0 flex-1 flex-col gap-2 px-3 pb-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-gradient-to-br text-white shadow-lg ring-[3px] ring-surface ${c.tile}`}
          aria-hidden
        >
          <Icon size={18} strokeWidth={1.75} />
        </span>

        <div className="min-w-0">
          <h4 className="line-clamp-1 font-display text-sm font-bold leading-snug text-brand">
            {tpl.name}
          </h4>
          <p className="mt-0.5 line-clamp-2 font-body text-micro leading-snug text-ink-muted">
            {tpl.description}
          </p>
        </div>

        <dl
          className={`mt-auto space-y-1.5 rounded-card px-2.5 py-2 ${c.panel}`}
        >
          <div className="flex items-center gap-2">
            <Tag
              size={12}
              strokeWidth={1.75}
              className={`shrink-0 ${c.accent}`}
              aria-hidden
            />
            <dt className="w-14 shrink-0 font-body text-micro text-[#6e756b]">
              Categoria
            </dt>
            <dd className="min-w-0 truncate font-body text-micro font-semibold text-[#0f1f3d]">
              {cat.label}
            </dd>
          </div>
          <div
            className={`flex items-center gap-2 border-t pt-1.5 ${c.divider}`}
          >
            <ArrowRight
              size={12}
              strokeWidth={1.75}
              className={`shrink-0 ${c.accent}`}
              aria-hidden
            />
            <dt className="w-14 shrink-0 font-body text-micro text-[#6e756b]">
              Acção
            </dt>
            <dd className="min-w-0 font-body text-micro font-semibold text-[#0f1f3d]">
              Executar
            </dd>
          </div>
        </dl>
      </div>
    </button>
  );
}
