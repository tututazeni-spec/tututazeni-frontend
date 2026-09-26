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

// Achata a árvore preservando o nó completo (não só id/label) — usado pela
// "Lista hierárquica" da aba Estrutura Organizacional (docs/modulo_departments.md
// Ponto 3), que precisa de todos os campos por linha, ordenados em pré-ordem
// (pai sempre antes dos filhos, como numa árvore expandida).
export function flattenTreeFull(nodes: DepartmentNode[]): DepartmentNode[] {
  return nodes.flatMap((n) => [n, ...flattenTreeFull(n.children ?? [])]);
}
