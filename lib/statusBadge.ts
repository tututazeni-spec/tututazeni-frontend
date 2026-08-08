// lib/statusBadge.ts
// Resolução partilhada de configuração (label+cor) para badges de estado.
//
// Antes desta extracção, ~25 páginas repetiam o mesmo padrão:
//   const { label, cls } = cfg[status];
// sem nenhuma protecção — um valor de enum que o backend introduza e o
// frontend ainda não tenha mapeado rebenta com "Cannot destructure property
// 'label' of undefined" em runtime. resolveBadge() devolve um fallback seguro
// em vez de rebentar. Ver memory project_innova_component_separation_audit.

export interface StatusBadgeConfig {
  label: string;
  cls: string;
}

export type StatusBadgeMap<S extends string> = Record<S, StatusBadgeConfig>;

const DEFAULT_FALLBACK: Omit<StatusBadgeConfig, 'label'> = {
  cls: 'bg-gray-100 text-gray-500',
};

/**
 * Devolve a configuração (label+cor) para `value` dentro de `map`.
 * Se `value` não estiver no mapa (enum novo ainda não mapeado), devolve
 * `fallback` em vez de rebentar — por omissão, mostra o próprio valor bruto
 * com um estilo neutro.
 */
export function resolveBadge<S extends string>(
  map: StatusBadgeMap<S>,
  value: S,
  fallback?: StatusBadgeConfig,
): StatusBadgeConfig {
  return map[value] ?? fallback ?? { label: value, ...DEFAULT_FALLBACK };
}
