// components/development-plans/utils.ts
// Verificação de prazo expirado. Extraído de
// app/(platform)/development-plans/page.tsx.

export function isOverdue(d: string | null, status: string): boolean {
  return (
    !!d &&
    new Date(d) < new Date() &&
    status !== 'COMPLETED' &&
    status !== 'CANCELLED'
  );
}
