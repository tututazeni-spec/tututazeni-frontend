// components/ui/NavyStatGroupCard.tsx
// Card único com cabeçalho azul-marinho (mesmo desenho do NavyStatCard) e,
// por baixo, N divisões lado a lado — uma por item (ícone circular + número
// centralizado + rótulo; zoom ao passar o cursor). Usado para distribuições
// por estado.

import type { LucideIcon } from 'lucide-react';
import { NAVY_TONES, type NavyStatTone } from '@/components/ui/NavyStatCard';

export interface NavyStatGroupItem {
  key: string;
  icon: LucideIcon;
  tone: NavyStatTone;
  label: string;
  value: string | number;
  /** Se definido, a divisão passa a botão clicável. */
  onClick?: () => void;
}

export function NavyStatGroupCard({
  title,
  items,
}: {
  title: string;
  items: NavyStatGroupItem[];
}) {
  return (
    <div className="overflow-hidden rounded-panel border border-brand-line bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)]">
      <div className="flex h-[60px] items-center bg-[#152F59] px-4">
        <h3 className="font-body text-[15px] font-semibold leading-tight text-white">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-brand-line md:grid-cols-3 md:divide-y-0 xl:grid-cols-5">
        {items.map(({ key, icon: Icon, tone, label, value, onClick }) => {
          const t = NAVY_TONES[tone];
          const Wrapper = onClick ? 'button' : 'div';
          return (
            <Wrapper
              key={key}
              {...(onClick ? { type: 'button' as const, onClick } : {})}
              className={`flex items-center justify-center px-3 py-5 ${onClick ? 'cursor-pointer hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary' : ''}`}
            >
              {/* Zoom no conteúdo (não na divisão) para o overflow-hidden do card não o cortar */}
              <div className="flex origin-center flex-col items-center gap-1.5 text-center transition-transform duration-200 ease-out hover:scale-110 motion-reduce:hover:scale-100">
                <span
                  aria-hidden
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${t.bg}`}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <p
                  className={`font-display text-[32px] font-bold leading-none ${t.text}`}
                >
                  {value}
                </p>
                <p className="font-body text-xs font-medium text-ink-muted">
                  {label}
                </p>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
