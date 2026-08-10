// components/departments/TreeView.tsx
// Separador "Organograma" — árvore hierárquica de departamentos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/departments/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { OrgNode } from './OrgNode';
import type { DepartmentNode } from './types';

interface TreeViewProps {
  onSelect: (id: number) => void;
}

export function TreeView({ onSelect }: TreeViewProps) {
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
        <Skeleton rows={8} />
      </div>
    );
  if (queryError)
    return <div className="text-sm text-red-500">{queryError.message}</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        <span>▼ expandir</span>
        <span>·</span>
        <span>▶ recolher</span>
        <span>·</span>
        <span>clique → ver detalhe</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        {tree.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Sem departamentos na hierarquia
          </div>
        ) : (
          tree.map((node) => (
            <OrgNode key={node.id} node={node} onSelect={onSelect} level={0} />
          ))
        )}
      </div>
    </div>
  );
}
