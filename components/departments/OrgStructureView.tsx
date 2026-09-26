// components/departments/OrgStructureView.tsx
// Separador "Estrutura Organizacional" (docs/modulo_departments.md Ponto 3)
// — árvore hierárquica da organização com 3 visualizações alternativas
// (Árvore organizacional, Organograma, Lista hierárquica) sobre os mesmos
// dados de GET /departments/tree. Clicar num departamento, em qualquer
// visualização, leva ao Detalhe do Departamento (que já cobre Responsável,
// Colaboradores, Subdepartamentos, Cargos e Estrutura descendente — ver
// DetailView.tsx).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { OrgNode } from './OrgNode';
import { OrgChartNode } from './OrgChartNode';
import { flattenTreeFull } from './treeUtils';
import type { DepartmentNode } from './types';

interface OrgStructureViewProps {
  onSelect: (id: number) => void;
}

type Mode = 'arvore' | 'organograma' | 'lista';

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'arvore', label: 'Árvore organizacional' },
  { id: 'organograma', label: 'Organograma' },
  { id: 'lista', label: 'Lista hierárquica' },
];

function HierarchyList({
  tree,
  onSelect,
}: {
  tree: DepartmentNode[];
  onSelect: (id: number) => void;
}) {
  const rows = flattenTreeFull(tree);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Departamento</TableHeaderCell>
          <TableHeaderCell>Nível</TableHeaderCell>
          <TableHeaderCell>Departamento superior</TableHeaderCell>
          <TableHeaderCell>Unidade</TableHeaderCell>
          <TableHeaderCell>Responsável</TableHeaderCell>
          <TableHeaderCell>Colaboradores</TableHeaderCell>
          <TableHeaderCell>Cargos</TableHeaderCell>
          <TableHeaderCell>Subdeptos</TableHeaderCell>
          <TableHeaderCell>Localização</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="py-8 text-center text-ink-faint">
              Sem departamentos na hierarquia
            </TableCell>
          </TableRow>
        ) : (
          rows.map((d) => (
            <TableRow
              key={d.id}
              className="cursor-pointer hover:bg-surface-sunken"
              onClick={() => onSelect(d.id)}
            >
              <TableCell>
                <span style={{ paddingLeft: (d.level - 1) * 20 }} className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: d.color ?? 'var(--color-ink-faint)' }}
                  />
                  <span className="text-sm text-ink">{d.name}</span>
                  <span className="font-mono text-xs text-ink-faint">{d.code}</span>
                </span>
              </TableCell>
              <TableCell className="text-xs text-ink-muted">{d.level}</TableCell>
              <TableCell className="text-xs text-ink-muted">{d.parent?.name ?? '—'}</TableCell>
              <TableCell className="text-xs text-ink-muted">{d.unit?.name ?? '—'}</TableCell>
              <TableCell>
                {d.head ? (
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Avatar name={d.head.fullName} size="sm" />
                    {d.head.fullName}
                  </span>
                ) : (
                  <span className="text-xs text-ink-faint">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-ink">{d._count.users}</TableCell>
              <TableCell className="text-sm text-ink">{d.positionsCount}</TableCell>
              <TableCell className="text-sm text-ink">{d._count.children}</TableCell>
              <TableCell className="text-xs text-ink-muted">{d.location ?? '—'}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function OrgStructureView({ onSelect }: OrgStructureViewProps) {
  const [mode, setMode] = useState<Mode>('arvore');
  const {
    data: tree = [],
    isLoading: loading,
    error: queryError,
  } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <div>
        <Skeleton
          rows={8}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      </div>
    );
  if (queryError)
    return <div className="text-sm text-danger">{queryError.message}</div>;

  return (
    <div>
      <div className="mb-4 flex w-fit gap-1 rounded-control bg-surface-sunken p-1">
        {MODES.map((m) => (
          <Button
            key={m.id}
            size="sm"
            intent={mode === m.id ? 'primary' : 'ghost'}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {mode === 'arvore' && (
        <div>
          <div className="mb-4 flex items-center gap-2 text-xs text-ink-faint">
            <span>▼ expandir</span>
            <span>·</span>
            <span>▶ recolher</span>
            <span>·</span>
            <span>clique → ver detalhe</span>
          </div>
          <div className="rounded-card border border-border bg-surface p-4">
            {tree.length === 0 ? (
              <div className="py-12 text-center text-sm text-ink-faint">
                Sem departamentos na hierarquia
              </div>
            ) : (
              tree.map((node) => (
                <OrgNode key={node.id} node={node} onSelect={onSelect} level={0} />
              ))
            )}
          </div>
        </div>
      )}

      {mode === 'organograma' && (
        <div className="overflow-x-auto rounded-card border border-border bg-surface p-6">
          {tree.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-faint">
              Sem departamentos na hierarquia
            </div>
          ) : (
            <div className="flex w-fit gap-8">
              {tree.map((node) => (
                <OrgChartNode key={node.id} node={node} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'lista' && <HierarchyList tree={tree} onSelect={onSelect} />}
    </div>
  );
}
