// components/reports/TemplateCard.tsx
// Cartão de template usado no Report Hub. Extraído de
// app/(platform)/reports/page.tsx.

'use client';

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
    <div
      className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onRun(tpl)}
    >
      <div className={`p-2 rounded-lg ${cat.bg} w-fit mb-3`}>
        <Icon size={16} className={cat.color} />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{tpl.name}</h4>
      <p className="text-xs text-slate-400 mb-3">{tpl.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium ${cat.color}`}>
          {cat.label}
        </span>
        <span className="text-[10px] text-indigo-600 font-semibold hover:underline">
          Executar →
        </span>
      </div>
    </div>
  );
}
