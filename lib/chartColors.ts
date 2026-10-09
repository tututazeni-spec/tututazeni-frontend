// Paleta categórica partilhada: uma cor distinta por item (departamento,
// competência, ...). Usar com `colorAt(idx)`; repete-se após 12 itens.
export const CATEGORY_COLORS = [
  '#0F1F3D',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#84CC16',
  '#64748B',
];

export function colorAt(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
