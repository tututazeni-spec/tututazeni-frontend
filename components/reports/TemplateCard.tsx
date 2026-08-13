// components/reports/TemplateCard.tsx
// Cartão de template usado no Report Hub. Extraído de
// app/(platform)/reports/page.tsx.

import { Card, CardBody } from '@/components/ui/Card';
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
    <Card interactive onClick={() => onRun(tpl)}>
      <CardBody>
        <div className={`mb-3 w-fit rounded-control p-2 ${cat.bg}`}>
          <Icon size={16} strokeWidth={1.75} className={cat.color} />
        </div>
        <h4 className="mb-1 font-display text-sm font-semibold text-ink">{tpl.name}</h4>
        <p className="mb-3 font-body text-xs text-ink-faint">{tpl.description}</p>
        <div className="flex items-center justify-between">
          <span className={`font-body text-[10px] font-medium ${cat.color}`}>{cat.label}</span>
          <span className="font-body text-[10px] font-semibold text-primary hover:underline">
            Executar →
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
