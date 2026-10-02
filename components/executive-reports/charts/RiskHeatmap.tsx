// components/executive-reports/charts/RiskHeatmap.tsx
// Mapa de calor departamento × indicador de risco (docs/Executive_Reports.md
// §6.5). Os critérios de cada coluna vêm do backend e ficam visíveis.

import { cn } from '@/lib/cn';
import type {
  RiskChartsResponse,
  RiskColumn,
  RiskLevel,
} from '../dashboardTypes';

const COLUMNS: { key: RiskColumn; label: string; unit: string }[] = [
  { key: 'turnover', label: 'Rotatividade', unit: '%' },
  { key: 'absenteeism', label: 'Absentismo', unit: '%' },
  { key: 'overduePdi', label: 'PDI em atraso', unit: '' },
  { key: 'overdueMandatory', label: 'Obrig. em atraso', unit: '' },
];

const LEVEL_CLASS: Record<RiskLevel, string> = {
  OK: 'bg-success-subtle text-success-ink',
  WARNING: 'bg-warning-subtle text-warning-ink',
  CRITICAL: 'bg-danger-subtle text-danger-ink',
  NO_DATA: 'bg-surface-sunken text-ink-faint',
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  OK: 'Normal',
  WARNING: 'Alerta',
  CRITICAL: 'Crítico',
  NO_DATA: 'Sem dados',
};

export interface RiskHeatmapProps {
  data: Pick<RiskChartsResponse, 'heatmap' | 'criteria'>;
  onSelectDepartment?: (id: number) => void;
}

export function RiskHeatmap({ data, onSelectDepartment }: RiskHeatmapProps) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-left">
          <thead>
            <tr>
              <th className="px-2 py-1 font-body text-xs font-medium text-ink-muted">
                Departamento
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="px-2 py-1 text-center font-body text-xs font-medium text-ink-muted"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.heatmap.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="px-2 py-1 font-normal">
                  <button
                    type="button"
                    disabled={!onSelectDepartment}
                    onClick={() => onSelectDepartment?.(row.id)}
                    className={cn(
                      'text-left font-body text-xs text-ink',
                      onSelectDepartment && 'hover:underline',
                    )}
                  >
                    {row.name}
                    <span className="ml-1 text-ink-faint">
                      ({row.headcount})
                    </span>
                  </button>
                </th>
                {COLUMNS.map((c) => {
                  const cell = row.cells[c.key];
                  const shown =
                    cell.value === null ? '—' : `${cell.value}${c.unit}`;
                  const rate =
                    cell.rate !== undefined && cell.rate !== null
                      ? ` (${cell.rate}/100)`
                      : '';
                  return (
                    <td
                      key={c.key}
                      title={`${LEVEL_LABEL[cell.level]}${rate}`}
                      className={cn(
                        'rounded-control px-2 py-1.5 text-center font-display text-sm font-semibold',
                        LEVEL_CLASS[cell.level],
                      )}
                    >
                      {shown}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="mt-3 font-body text-xs text-ink-muted">
        <summary className="cursor-pointer font-medium text-ink">
          Critérios de risco
        </summary>
        <ul className="mt-2 space-y-1">
          {COLUMNS.map((c) => (
            <li key={c.key}>
              <span className="font-medium text-ink">
                {data.criteria[c.key].label}:
              </span>{' '}
              {data.criteria[c.key].rule}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
