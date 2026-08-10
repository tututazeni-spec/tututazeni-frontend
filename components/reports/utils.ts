// components/reports/utils.ts
// Intervalo de datas por omissão (últimos N meses). Extraído de
// app/(platform)/reports/page.tsx.

export function defaultRange(months = 1) {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - months * 30 * 86400000)
    .toISOString()
    .split('T')[0];
  return { from, to };
}
