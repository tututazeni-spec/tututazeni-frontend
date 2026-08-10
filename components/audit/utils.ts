// components/audit/utils.ts
// Formatação de timestamp de auditoria. Extraído de
// app/(platform)/audit/page.tsx.

export function fmtTs(d: string): string {
  return new Date(d).toLocaleString('pt-AO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
