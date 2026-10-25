// components/monitoring/CompactTabs.tsx
// Separadores compactos (tamanho de botões de filtro) no desenho da aba Talento
// do dashboard-rh. Partilhados pelos filtros das abas Alertas e Histórico.

'use client';

import type { LucideIcon } from 'lucide-react';

// Separadores no desenho da aba Talento do dashboard-rh, mas compactos
// (tamanho dos botões de filtro anteriores, sem esticar à largura toda).
export interface CompactTabItem<T> {
  value: T;
  label: string;
  icon: LucideIcon;
  count?: number;
}

export function CompactTabs<T extends string | number | null>({
  items,
  value,
  onChange,
}: {
  items: CompactTabItem<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-panel border border-border bg-surface p-1 shadow-sm">
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={String(it.value)}
            type="button"
            onClick={() => onChange(it.value)}
            className={`flex items-center gap-1.5 rounded-control px-3 py-1 font-body text-sm font-medium transition-colors ${
              on
                ? 'bg-brand text-canvas shadow-sm'
                : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            <it.icon size={14} strokeWidth={1.75} />
            <span>{it.label}</span>
            {it.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-micro font-semibold ${
                  on
                    ? 'bg-canvas/20 text-canvas'
                    : 'bg-surface-sunken text-ink-faint'
                }`}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
