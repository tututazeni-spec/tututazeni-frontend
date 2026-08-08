// components/ui/Skeleton.tsx
//
// Placeholder de carregamento genérico — N blocos (empilhados ou em grid,
// via wrapperClassName) com animação de pulso. Substitui as ~42
// implementações locais quase idênticas que existiam por página (achado
// da auditoria de frontend, secção UX/UI): cada página reimplementava a
// mesma lógica com pequenas variações de altura/cor/espaçamento.

interface SkeletonProps {
  /** Número de blocos placeholder. */
  rows?: number;
  /** Classes do wrapper (layout: space-y-* para lista, ou grid). */
  wrapperClassName?: string;
  /** Classes de cada bloco placeholder (altura + cor + arredondamento). */
  itemClassName?: string;
}

export function Skeleton({
  rows = 3,
  wrapperClassName = 'space-y-3 animate-pulse',
  itemClassName = 'h-12 bg-slate-100 rounded-xl',
}: SkeletonProps) {
  return (
    <div className={wrapperClassName}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={itemClassName} />
      ))}
    </div>
  );
}
