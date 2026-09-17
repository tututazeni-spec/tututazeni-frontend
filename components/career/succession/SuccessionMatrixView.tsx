// components/career/succession/SuccessionMatrixView.tsx
// Matriz de sucessão (Módulo Career, secção 7.5): Posição | Titular |
// Sucessor | Prontidão | Gap | Risco — GET /succession/matrix.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { READINESS_CFG, RISK_CFG } from './constants';
import type { SuccessionMatrixRow } from './types';

export function SuccessionMatrixView() {
  const { data: rows = [], isLoading: loading } = useApiQuery<SuccessionMatrixRow[]>(
    queryKeys.succession.matrix(),
    '/succession/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={4} />;

  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
        Nenhum cargo crítico definido
      </div>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-surface-sunken">
            <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Posição
            </th>
            <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Titular
            </th>
            <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Sucessor
            </th>
            <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Prontidão
            </th>
            <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Gap
            </th>
            <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Risco
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={`${row.criticalPositionId}-${row.sucessor ?? idx}`}
              className="border-b border-border last:border-0"
            >
              <td className="px-4 py-3 font-body text-sm font-medium text-ink">
                {row.position}
              </td>
              <td className="px-4 py-3 font-body text-sm text-ink-muted">
                {row.titular ?? '—'}
              </td>
              <td className="px-4 py-3 font-body text-sm text-ink-muted">
                {row.sucessor ?? (
                  <span className="font-medium text-danger">Sem sucessor</span>
                )}
              </td>
              <td className="px-4 py-3">
                {row.readinessLevel ? (
                  <StatusBadge value={row.readinessLevel} map={READINESS_CFG} variant="dot" />
                ) : (
                  <span className="font-body text-xs text-ink-faint">—</span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-sm text-ink-muted">
                {row.gap ?? '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge value={row.exitRisk} map={RISK_CFG} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
