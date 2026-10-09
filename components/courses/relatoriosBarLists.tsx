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
    <div className="space-y-1.5">
      {rows.map((row, i) => {
        const content = (
          <>
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0 break-words text-xs text-ink-muted">
                {row.label}
              </span>
              <span className="flex-shrink-0 whitespace-nowrap text-right font-data text-xs text-ink">
                {row.display}
              </span>
            </span>
            <span className="mt-1 block h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <span
                className={`block h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
              />
            </span>
          </>
        );
        return row.onClick ? (
          <button
            key={row.key}
            type="button"
            onClick={row.onClick}
            className="block w-full rounded-md p-1 text-left hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {content}
          </button>
        ) : (
          <div key={row.key} className="p-1">
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
 * Ranking de taxas (0-100%) como barras de progresso horizontais: nome do curso
 * e percentagem numa linha, barra de largura total por baixo. Uma só cor por
 * card (`tone`) — o valor fica sempre visível em texto. Cada linha abre o curso.
 */
export function CourseProgressList({
  title,
  items,
  tone,
  onSelect,
}: {
  title: string;
  items: Array<{ id: number; title: string; value: number }>;
  tone: 'green' | 'red';
  onSelect: (id: number) => void;
}) {
  const barClass = tone === 'green' ? 'bg-emerald-500' : 'bg-rose-500';
  return (
    <Card className="p-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-ink-faint">Sem dados</p>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 6).map((c) => {
            const pct = Math.min(100, Math.max(0, c.value));
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className="block w-full rounded-md text-left hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="min-w-0 break-words text-xs font-medium text-ink">
                    {c.title}
                  </span>
                  <span className="flex-shrink-0 font-data text-xs text-ink">
                    {c.value}%
                  </span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={c.title}
                >
                  <div
                    className={`h-full rounded-full ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
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
