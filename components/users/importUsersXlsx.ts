// components/users/importUsersXlsx.ts
// Leitura de ficheiros Excel (.xlsx) para o separador "Importação": converte a
// primeira folha para o mesmo formato (ParsedCsv) que o parser de CSV devolve,
// para o mapeamento/pré-visualização não precisar de saber a origem.
// O exceljs é carregado só quando o utilizador escolhe um .xlsx.

import type { ParsedCsv } from './importUsersCsv';

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v.richText)) {
      return v.richText
        .map((r) => String((r as { text?: unknown }).text ?? ''))
        .join('')
        .trim();
    }
    if ('text' in v) return String(v.text ?? '').trim(); // hiperligação (ex.: email)
    if ('result' in v) return cellToText(v.result); // fórmula
    return '';
  }
  return String(value).trim();
}

export async function parseXlsx(buffer: ArrayBuffer): Promise<ParsedCsv> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return {
      headers: [],
      rows: [],
      error:
        'Não foi possível abrir o ficheiro Excel. Confirma que é um .xlsx válido.',
    };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount === 0) {
    return { headers: [], rows: [], error: 'O ficheiro está vazio.' };
  }

  const lines: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as unknown[]).slice(1); // exceljs indexa a partir de 1
    const cells = Array.from({ length: sheet.columnCount }, (_, i) =>
      cellToText(values[i]),
    );
    if (cells.some((c) => c.length > 0)) lines.push(cells);
  });

  if (lines.length === 0) {
    return { headers: [], rows: [], error: 'O ficheiro está vazio.' };
  }
  const [headers, ...rows] = lines;
  if (rows.length === 0) {
    return {
      headers,
      rows: [],
      error: 'Nenhuma linha de dados encontrada além do cabeçalho.',
    };
  }
  return { headers, rows };
}
