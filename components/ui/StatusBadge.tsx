// components/ui/StatusBadge.tsx
//
// Badge de estado genérico — substitui as ~30 implementações locais quase
// idênticas (`const { label, cls } = cfg[status]` + <span>) espalhadas por
// ~23 páginas. Duas variantes visuais cobrem os dois padrões reais
// encontrados no código: "dot" (pill arredondada com indicador — usada para
// estados verdadeiros, ex: ACTIVE/PUBLISHED/DRAFT) e "plain" (rectângulo
// arredondado, sem indicador — usada para níveis/categorias/prioridades).
// Ver memory project_innova_component_separation_audit.

import { resolveBadge, type StatusBadgeMap } from '@/lib/statusBadge';

interface StatusBadgeProps<S extends string> {
  value: S;
  map: StatusBadgeMap<S>;
  /**
   * 'plain' — rectângulo arredondado, sem indicador (níveis/categorias).
   * 'pill'  — pílula arredondada, sem indicador.
   * 'dot'   — pílula arredondada com indicador (estados verdadeiros: ACTIVE/PUBLISHED/DRAFT).
   */
  variant?: 'dot' | 'pill' | 'plain';
  /** Configuração para valores fora do mapa — por omissão mostra o valor bruto com estilo neutro. */
  fallback?: { label: string; cls: string };
  /** Classes extra (ex: `flex-shrink-0` num layout flex) — anexadas às classes base da variante. */
  className?: string;
}

export function StatusBadge<S extends string>({
  value,
  map,
  variant = 'plain',
  fallback,
  className = '',
}: StatusBadgeProps<S>) {
  const { label, cls } = resolveBadge(map, value, fallback);

  if (variant === 'dot') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${cls} ${className}`}
    >
      {label}
    </span>
  );
}
