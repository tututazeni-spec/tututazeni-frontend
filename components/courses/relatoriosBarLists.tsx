// components/courses/relatoriosBarLists.tsx
// Cards de distribuição/ranking da aba "Relatórios" com o mesmo design dos
// cards "Por categoria / Por nível / Por unidade" do dashboard de cursos
// (AdminDashboardView): etiqueta à esquerda, barra horizontal colorida
// proporcional ao máximo e valor sempre visível em texto (nunca só cor).

import { Card } from '@/components/ui/Card';

/** Cores das barras, alinhadas com os tons dos cards (azul, verde, dourado, vermelho). */
const BAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
] as const;

interface BarRow {
  key: string | number;
  label: string;
  value: number;
  display: string;
  onClick?: () => void;
}

function BarRows({ rows, max }: { rows: BarRow[]; max: number }) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const content = (
          <>
            <span
              className="w-28 flex-shrink-0 truncate text-xs text-ink-muted"
              title={row.label}
            >
              {row.label}
            </span>
            <div className="h-5 flex-1 overflow-hidden rounded-md bg-surface-sunken">
              <div
                className={`h-full rounded-md ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
              />
            </div>
            <span className="min-w-10 flex-shrink-0 whitespace-nowrap text-right font-data text-xs text-ink">
              {row.display}
            </span>
          </>
        );
        return row.onClick ? (
          <button
            key={row.key}
            type="button"
            onClick={row.onClick}
            className="flex w-full items-center gap-3 rounded-md text-left hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {content}
          </button>
        ) : (
          <div key={row.key} className="flex items-center gap-3">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function BarCard({
  title,
  rows,
  max,
}: {
  title: string;
  rows: BarRow[];
  max: number;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-ink-faint">Sem dados</p>
      ) : (
        <BarRows rows={rows} max={max} />
      )}
    </Card>
  );
}

/** Distribuição por categoria (departamento, unidade, …) — contagem por etiqueta. */
export function DistributionList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  const rows = items.slice(0, 6).map((item, i) => ({
    key: i,
    label: item.label,
    value: item.count,
    display: String(item.count),
  }));
  return (
    <BarCard
      title={title}
      rows={rows}
      max={Math.max(1, ...rows.map((r) => r.value))}
    />
  );
}

/**
 * Ranking de cursos no mesmo design. `percent` fixa a escala em 0-100 (taxas);
 * sem ele a escala é o máximo da lista (contagens). Cada linha abre o curso.
 */
export function CourseBarList({
  title,
  items,
  suffix,
  percent = false,
  onSelect,
}: {
  title: string;
  items: Array<{ id: number; title: string; value: number }>;
  suffix: string;
  percent?: boolean;
  onSelect: (id: number) => void;
}) {
  const rows = items.slice(0, 6).map((c) => ({
    key: c.id,
    label: c.title,
    value: c.value,
    display: `${c.value}${suffix}`,
    onClick: () => onSelect(c.id),
  }));
  return (
    <BarCard
      title={title}
      rows={rows}
      max={percent ? 100 : Math.max(1, ...rows.map((r) => r.value))}
    />
  );
}
