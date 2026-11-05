// lib/tableExport.ts
// Exporta uma tabela (cabeçalhos + linhas de texto) para CSV, Excel ou PDF,
// no browser. Fonte única para as listagens que não têm exportação própria
// no backend; Excel e PDF carregam-se só no clique (import dinâmico).

import { saveBlob } from '@/lib/download';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface TableExportInput {
  /** Título do PDF e base do nome do ficheiro. */
  title: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  /** Nome sem extensão; por omissão deriva do título + data. */
  filename?: string;
}

const text = (v: string | number | null | undefined): string =>
  v === null || v === undefined ? '' : String(v);

// Uma célula que começa por = + - @ seria executada como fórmula no Excel.
const safe = (v: string): string => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

const csvCell = (v: string): string =>
  /[",\r\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function buildCsvText(
  headers: string[],
  rows: TableExportInput['rows'],
) {
  const lines = [headers, ...rows].map((r) =>
    r.map((c) => csvCell(safe(text(c)))).join(','),
  );
  // BOM para o Excel abrir os acentos correctamente.
  return `﻿${lines.join('\r\n')}`;
}

export async function exportTable(
  format: ExportFormat,
  { title, headers, rows, filename }: TableExportInput,
): Promise<void> {
  const base = `${filename ?? (slugify(title) || 'exportacao')}-${new Date()
    .toISOString()
    .slice(0, 10)}`;

  if (format === 'csv') {
    saveBlob(
      new Blob([buildCsvText(headers, rows)], {
        type: 'text/csv;charset=utf-8',
      }),
      `${base}.csv`,
    );
    return;
  }

  if (format === 'xlsx') {
    const { default: writeXlsxFile } = await import('write-excel-file');
    const data = [
      headers.map((h) => ({ value: h, fontWeight: 'bold' as const })),
      ...rows.map((r) =>
        headers.map((_, i) => ({ type: String, value: safe(text(r[i])) })),
      ),
    ];
    await writeXlsxFile(data, { fileName: `${base}.xlsx` });
    return;
  }

  const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new JsPdf({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-PT')}`, 40, 56);
  autoTable(doc, {
    startY: 68,
    head: [headers],
    body: rows.map((r) => headers.map((_, i) => text(r[i]))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 31, 61] },
    margin: { left: 40, right: 40 },
  });
  doc.save(`${base}.pdf`);
}

/** Lê CSV (separador `,` ou `;` detectado no cabeçalho, aspas, BOM) para linhas de texto. */
export function parseCsv(input: string): string[][] {
  const textIn = input.replace(/^﻿/, '');
  const firstLine = textIn.split(/\r?\n/, 1)[0] ?? '';
  const delim =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
      ? ';'
      : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < textIn.length; i++) {
    const ch = textIn[i];
    if (quoted) {
      if (ch === '"' && textIn[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && textIn[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ''));
}

/** Converte um CSV (texto) em PDF e descarrega-o. */
export async function csvTextToPdf(
  csv: string,
  title: string,
  filename?: string,
): Promise<void> {
  const [headers = [], ...rows] = parseCsv(csv);
  await exportTable('pdf', { title, headers, rows, filename });
}

/** Grava um CSV já pronto (`filename` + `content`) como CSV ou converte-o em PDF. */
export async function saveCsvContent(
  filename: string,
  content: string,
  format: ExportFormat,
  title: string,
): Promise<void> {
  if (format === 'pdf') {
    await csvTextToPdf(content, title, filename.replace(/\.csv$/i, ''));
    return;
  }
  saveBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), filename);
}
