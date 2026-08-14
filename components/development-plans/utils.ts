// components/development-plans/utils.ts
// Verificação de prazo expirado e classe de texto para percentagem de
// progresso. Extraído de app/(platform)/development-plans/page.tsx.
//
// O ProgressBar da fundação é mono-cor (bg-accent) — a cor que antes
// vinha da própria barra (verde/azul/âmbar por limiar) passa para o
// texto da percentagem adjacente, mesmo padrão de
// components/engagement/AnalyticsTab.tsx (scoreTextClass).

export function isOverdue(d: string | null, status: string): boolean {
  return (
    !!d &&
    new Date(d) < new Date() &&
    status !== 'COMPLETED' &&
    status !== 'CANCELLED'
  );
}

export function progressTextClass(pct: number): string {
  if (pct >= 100) return 'text-success';
  if (pct >= 50) return 'text-info';
  return 'text-warning';
}
