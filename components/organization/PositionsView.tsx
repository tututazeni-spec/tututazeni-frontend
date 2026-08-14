// components/organization/PositionsView.tsx
// Vista "Cargos": tabela de posições filtrável por nível. Extraído
// de app/(platform)/organization/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { LEVEL_CFG } from './constants';
import type { Position, PosLevel } from './types';

export function PositionsView() {
  const [filter, setFilter] = useState('');

  const params = { limit: 50, ...(filter ? { level: filter } : {}) };
  const { data, isLoading } = useApiQuery<{ data: Position[]; total: number }>(
    queryKeys.organization.positions(filter),
    '/organization/positions',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  const levels: PosLevel[] = [
    'INTERN',
    'JUNIOR',
    'MID',
    'SENIOR',
    'LEAD',
    'MANAGER',
    'DIRECTOR',
    'EXECUTIVE',
  ];

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Button
          size="sm"
          intent={!filter ? 'primary' : 'secondary'}
          onClick={() => setFilter('')}
        >
          Todos
        </Button>
        {levels.map((l) => (
          <Button
            key={l}
            size="sm"
            intent={filter === l ? 'primary' : 'secondary'}
            onClick={() => setFilter(l)}
          >
            {LEVEL_CFG[l].label}
          </Button>
        ))}
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Cargo</TableHeaderCell>
            <TableHeaderCell>Nível</TableHeaderCell>
            <TableHeaderCell>Activos</TableHeaderCell>
            <TableHeaderCell>Vagas</TableHeaderCell>
            <TableHeaderCell>Salário</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.data.map((pos) => (
            <TableRow key={pos.id}>
              <TableCell>
                <div className="font-body text-sm font-medium text-ink">
                  {pos.name}
                </div>
                {pos.code && (
                  <div className="font-body text-xs text-ink-faint">
                    {pos.code}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge value={pos.level} map={LEVEL_CFG} />
              </TableCell>
              <TableCell className="font-mono text-sm text-ink">
                {pos.headcountOccupied}
              </TableCell>
              <TableCell>
                {pos.headcountOpen > 0 ? (
                  <span className="font-body text-xs font-medium text-warning">
                    {pos.headcountOpen} abertas
                  </span>
                ) : (
                  <span className="font-body text-xs text-ink-faint">—</span>
                )}
              </TableCell>
              <TableCell className="font-body text-xs text-ink-muted">
                {pos.salaryMin && pos.salaryMax
                  ? `${fmtKz(pos.salaryMin)} – ${fmtKz(pos.salaryMax)}`
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
          {data?.data.length === 0 && (
            <TableRow>
              <td
                colSpan={5}
                className="px-4 py-12 text-center font-body text-sm text-ink-faint"
              >
                Sem cargos
              </td>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
