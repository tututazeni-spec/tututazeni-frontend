// components/departments/treeUtils.ts
// Achata a árvore hierárquica de departamentos numa lista indentada — usado
// pelo Select "Departamento pai" (CreateDepartmentModal) e pelo filtro
// "Departamento superior" (ListView).

import type { DepartmentNode } from './types';

export function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}
