// lib/csv.ts
// CSV para Excel: BOM UTF-8 (senão os acentos saem estragados), células
// escapadas (vírgulas, aspas e quebras de linha) e SEMPRE a linha de
// cabeçalhos — um CSV sem linhas continua a ter colunas em vez de 0 bytes.

function escapeCell(v: unknown, delimiter: string): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.includes(delimiter) || /["\r\n]/.test(s)
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function buildCsv(
  headers: string[],
  rows: unknown[][],
  delimiter = ',',
): string {
  const lines = [headers, ...rows].map((r) =>
    r.map((c) => escapeCell(c, delimiter)).join(delimiter),
  );
  return `﻿${lines.join('\r\n')}`;
}
