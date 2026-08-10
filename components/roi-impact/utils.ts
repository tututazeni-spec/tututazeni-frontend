// components/roi-impact/utils.ts
// Formatação de valores monetários abreviados ($1.2M, $340K, ...).
// Extraído de app/(platform)/roi-impact/page.tsx.

export function fmt$(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}
