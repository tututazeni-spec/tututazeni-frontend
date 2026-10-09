// components/departments/StructureView.tsx
// Separador "Estrutura Organizacional" (docs/modulo_departments.md Ponto 3).
// Distinto do separador "Organograma" (TreeView): aqui mostram-se os campos
// pedidos pela spec (unidade, departamento superior, nível, responsável,
// colaboradores, cargos, localização) com duas visualizações — Árvore e
// Lista hierárquica — e um painel de pré-visualização ao clicar num
// departamento (sem navegar logo para o detalhe completo).

'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, List, Network } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { DepartmentNode } from './types';

interface StructureViewProps {
  onSelect: (id: number) => void;
}

type VizMode = 'tree' | 'list';

interface FlatRow {
  node: DepartmentNode;
  parentName: string | null;
}

function flatten(nodes: DepartmentNode[], parentName: string | null = null): FlatRow[] {
  return nodes.flatMap((n) => [
    { node: n, parentName },
    ...flatten(n.children, n.name),
  ]);
}

function countDescendants(node: DepartmentNode): number {
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

function findNode(nodes: DepartmentNode[], id: number): DepartmentNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function TreeRow({
  node,
  parentName,
  selectedId,
  onPreview,
}: {
  node: DepartmentNode;
  parentName: string | null;
  selectedId: number | null;
  onPreview: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(node.level < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => onPreview(node.id)}
        className={`flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors ${
          selectedId === node.id
            ? 'border-primary bg-primary-subtle'
            : 'border-border bg-surface hover:border-primary/50'
        }`}
        style={{ marginLeft: node.level * 24, marginBottom: 4 }}
      >
        {hasChildren ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-ink-faint hover:text-ink"
          >
            {expanded ? (
              <ChevronDown size={14} strokeWidth={1.75} />
            ) : (
              <ChevronRight size={14} strokeWidth={1.75} />
            )}
          </span>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">{node.name}</span>
            <span className="font-mono text-xs text-ink-faint">{node.code}</span>
            {parentName && (
              <span className="text-xs text-ink-faint">· sob {parentName}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
            {node.unit && <span>{node.unit.name}</span>}
            {node.location && <span>{node.location}</span>}
            {node.head && (
              <span className="flex items-center gap-1">
                <Avatar name={node.head.fullName} size="sm" />
                {node.head.fullName}
              </span>
            )}
            <span>{node._count.users} colaboradores</span>
            <span>{node.positionsCount} cargos</span>
            <span>Nível {node.level + 1}</span>
          </div>
        </div>
      </button>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              parentName={node.name}
              selectedId={selectedId}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewPanel({
  node,
  onViewDetail,
  onClose,
}: {
  node: DepartmentNode;
  onViewDetail: (id: number) => void;
  onClose: () => void;
}) {
  const descendants = countDescendants(node);
  return (
    <Card className="sticky top-4 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-ink">{node.name}</div>
          <div className="font-mono text-xs text-ink-faint">{node.code}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-ink-faint hover:text-ink"
        >
          Fechar
        </button>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">Responsável</dt>
          <dd className="mt-1 text-ink">
            {node.head ? (
              <span className="flex items-center gap-2">
                <Avatar name={node.head.fullName} size="sm" />
                {node.head.fullName}
              </span>
            ) : (
              '—'
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">Colaboradores</dt>
          <dd className="mt-1 text-ink">{node._count.users}</dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">Subdepartamentos</dt>
          <dd className="mt-1 text-ink">
            {node.children.length === 0
              ? 'Nenhum'
              : node.children.map((c) => c.name).join(', ')}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">Cargos</dt>
          <dd className="mt-1 text-ink">{node.positionsCount}</dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">
            Estrutura descendente
          </dt>
          <dd className="mt-1 text-ink">
            {descendants === 0
              ? 'Sem sub-estrutura'
              : `${descendants} departamento(s) abaixo`}
          </dd>
        </div>
      </dl>

      <Button
        className="mt-4 w-full"
        intent="secondary"
        onClick={() => onViewDetail(node.id)}
      >
        Ver detalhe completo
      </Button>
    </Card>
  );
}

export function StructureView({ onSelect }: StructureViewProps) {
  const [viz, setViz] = useState<VizMode>('tree');
  const [previewId, setPreviewId] = useState<number | null>(null);

  const {
    data: tree = [],
    isLoading: loading,
    error: queryError,
  } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const flatRows = useMemo(() => flatten(tree), [tree]);
  const previewNode = previewId != null ? findNode(tree, previewId) : null;

  if (loading)
    return (
      <Skeleton
        rows={8}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );
  if (queryError) return <div className="text-sm text-danger">{queryError.message}</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViz('tree')}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              viz === 'tree'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            <Network size={14} strokeWidth={1.75} />
            Árvore organizacional
          </button>
          <button
            type="button"
            onClick={() => setViz('list')}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              viz === 'list'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            <List size={14} strokeWidth={1.75} />
            Lista hierárquica
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${previewNode ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
        <div>
          {tree.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-faint">
              Sem departamentos na hierarquia
            </div>
          ) : viz === 'tree' ? (
            <div className="rounded-card border border-border bg-surface p-4">
              {tree.map((node) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  parentName={null}
                  selectedId={previewId}
                  onPreview={setPreviewId}
                />
              ))}
            </div>
          ) : (
            <Table>
              <TableHead className="bg-[#0F1F3D]/60 [&_th]:text-white">
                <TableRow>
                  <TableHeaderCell>Nível</TableHeaderCell>
                  <TableHeaderCell>Departamento</TableHeaderCell>
                  <TableHeaderCell>Departamento superior</TableHeaderCell>
                  <TableHeaderCell>Unidade</TableHeaderCell>
                  <TableHeaderCell>Localização</TableHeaderCell>
                  <TableHeaderCell>Responsável</TableHeaderCell>
                  <TableHeaderCell>Colaboradores</TableHeaderCell>
                  <TableHeaderCell>Cargos</TableHeaderCell>
                  <TableHeaderCell>Subdeptos</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flatRows.map(({ node, parentName }) => (
                  <TableRow
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => setPreviewId(node.id)}
                  >
                    <TableCell>
                      <Badge intent="neutral">{node.level + 1}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-ink">{node.name}</span>
                      <span className="ml-1.5 font-mono text-xs text-ink-faint">
                        {node.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {parentName ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.unit?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.location ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.head?.fullName ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node._count.users}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.positionsCount}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.children.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {previewNode && (
          <PreviewPanel
            node={previewNode}
            onViewDetail={onSelect}
            onClose={() => setPreviewId(null)}
          />
        )}
      </div>
    </div>
  );
}
