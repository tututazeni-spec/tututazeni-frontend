// components/career/succession/SuccessionMatrixView.tsx
// Módulo Career, secção 7, acrescento 5: "Matriz de sucessão" — tabela
// Posição | Titular | Sucessor | Prontidão | Gap | Risco.
// GET /succession/matrix (uma linha por par cargo-crítico/sucessor; cargos
// sem sucessor aparecem numa única linha com sucessor "—").

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { READINESS_LABEL, RISK_INTENT, RISK_LABEL } from './constants';
import type { SuccessionMatrixRow } from './types';

export function SuccessionMatrixView() {
  const { data: rows = [], isLoading: loading } = useApiQuery<SuccessionMatrixRow[]>(
    queryKeys.succession.matrix(),
    '/succession/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={5} />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sem cargos críticos classificados"
        description="Classifica cargos como críticos para gerar a matriz de sucessão."
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Posição</TableHeaderCell>
          <TableHeaderCell>Titular</TableHeaderCell>
          <TableHeaderCell>Sucessor</TableHeaderCell>
          <TableHeaderCell>Prontidão</TableHeaderCell>
          <TableHeaderCell>Gap</TableHeaderCell>
          <TableHeaderCell>Risco</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={`${r.criticalPositionId}-${r.sucessor ?? 'none'}-${i}`}>
            <TableCell className="font-medium text-ink">{r.position}</TableCell>
            <TableCell className="text-ink-muted">{r.titular ?? '—'}</TableCell>
            <TableCell className="text-ink-muted">{r.sucessor ?? '—'}</TableCell>
            <TableCell>
              {r.readinessLevel ? (
                <span className="font-body text-xs text-ink-muted">
                  {READINESS_LABEL[r.readinessLevel]}
                </span>
              ) : (
                '—'
              )}
            </TableCell>
            <TableCell className="text-ink-muted">
              {r.gap === null ? '—' : `${r.gap} competência${r.gap !== 1 ? 's' : ''}`}
            </TableCell>
            <TableCell>
              <Badge intent={RISK_INTENT[r.exitRisk]}>{RISK_LABEL[r.exitRisk]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
