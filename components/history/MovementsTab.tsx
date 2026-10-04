// components/history/MovementsTab.tsx
// Aba "Movimentos" (docs/history.md §4): principais alterações na situação
// profissional. Só aparecem campos com fonte real — não há registo de
// alteração de unidade ou de contrato do colaborador, por isso essas colunas
// não existem.

'use client';

import { useState } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { MOVEMENT_TYPE_LABEL } from './constants';
import { HubTable, fmtDate, useHubList, type Column } from './shared';
import type { Movement } from './types';

const ALL = 'ALL';

const change = (a: string | null, b: string | null) =>
  a || b ? `${a ?? '–'} → ${b ?? '–'}` : '–';

const COLUMNS: Column<Movement>[] = [
  { header: 'Data', cell: (m) => fmtDate(m.timestamp) },
  { header: 'Colaborador', cell: (m) => m.employee?.fullName ?? '–' },
  {
    header: 'Tipo de movimento',
    cell: (m) => <Badge intent="info">{m.typeLabel}</Badge>,
  },
  { header: 'Cargo (anterior → novo)', cell: (m) => change(m.prevPosition, m.newPosition) },
  {
    header: 'Departamento (anterior → novo)',
    cell: (m) => change(m.prevDepartment, m.newDepartment),
  },
  {
    header: 'Responsável (anterior → novo)',
    cell: (m) => change(m.prevManager, m.newManager),
  },
  { header: 'Motivo', cell: (m) => m.reason ?? '–' },
  { header: 'Registado por', cell: (m) => m.registeredBy?.fullName ?? '–' },
  { header: 'Observação', cell: (m) => m.notes ?? '–' },
];

export function MovementsTab() {
  const [type, setType] = useState('');
  const list = useHubList<Movement>(
    queryKeys.history.movements,
    '/history/movements',
    { movementType: type || undefined },
  );
  return (
    <div className="space-y-3">
      <Select
        className="w-64"
        value={type || ALL}
        onValueChange={(v) => setType(v === ALL ? '' : v)}
        items={[
          { value: ALL, label: 'Todos os tipos de movimento' },
          ...Object.entries(MOVEMENT_TYPE_LABEL).map(([value, label]) => ({
            value,
            label,
          })),
        ]}
      />
      <HubTable
        columns={COLUMNS}
        rows={list.rows}
        loading={list.query.isLoading}
        error={list.query.error?.message}
        total={list.total}
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
      />
    </div>
  );
}
