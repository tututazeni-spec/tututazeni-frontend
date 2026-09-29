// components/ui/charts/ChartLegend.tsx
// Legenda partilhada pelos gráficos — visível sempre que houver ≥2 séries
// (uma série única já é identificada pelo título do gráfico, não precisa de
// legenda própria — regra da skill dataviz). Rótulo directo (valor ao lado
// do nome) só até 4 séries; acima disso o valor sai da legenda.
import { cn } from '@/lib/cn';

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string | number;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
  className?: string;
}

export function ChartLegend({ items, className }: ChartLegendProps) {
  if (items.length < 2) return null;
  const directLabel = items.length <= 4;
  return (
    <div className={cn('flex flex-wrap gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 font-body text-xs text-ink-muted"
        >
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
          {directLabel && item.value != null && (
            <span className="font-semibold text-ink">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
