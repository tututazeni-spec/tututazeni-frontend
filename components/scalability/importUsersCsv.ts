// components/scalability/importUsersCsv.ts
// Parsing client-side do CSV de importação em massa de utilizadores do módulo
// de Escalabilidade. Mantido puro (sem React, sem FileReader) para ser testável
// isoladamente — o modal trata só da leitura do ficheiro e delega aqui.
//
// NOTA: o módulo ainda corre sobre dados mock (ver
// app/(platform)/scalability/page.tsx). Isto valida e conta as linhas do
// ficheiro para dar feedback real ao utilizador; a importação em si actualiza
// só a contagem local. O endpoint real (POST /scalability/users/bulk-import)
// exige um tenantId que os dados de sessão actuais não fornecem.

export interface ParsedUsersCsv {
  /** Linhas de dados (exclui o cabeçalho). */
  totalRows: number;
  /** Linhas com um email plausível (contém '@'). */
  validRows: number;
  /** totalRows - validRows. */
  invalidRows: number;
  /** Cabeçalhos detectados, em minúsculas e sem espaços. */
  headers: string[];
  /** Preenchido quando o ficheiro não é utilizável de todo. */
  error?: string;
}

const EMPTY: ParsedUsersCsv = {
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  headers: [],
};

function splitLine(line: string): string[] {
  // CSV simples: vírgula como separador, sem suporte a vírgulas escapadas
  // dentro de aspas (o backend real faz o parsing robusto). Chega para
  // contar linhas e localizar a coluna de email.
  return line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
}

export function parseUsersCsv(text: string): ParsedUsersCsv {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { ...EMPTY, error: 'O ficheiro está vazio.' };
  }

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const emailIdx = headers.findIndex((h) => h === 'email' || h === 'e-mail');

  if (emailIdx === -1) {
    return {
      ...EMPTY,
      headers,
      error: "O ficheiro precisa de uma coluna 'email' no cabeçalho.",
    };
  }

  const dataLines = lines.slice(1);
  if (dataLines.length === 0) {
    return {
      ...EMPTY,
      headers,
      error: 'Nenhuma linha de dados encontrada além do cabeçalho.',
    };
  }

  let validRows = 0;
  for (const line of dataLines) {
    const cells = splitLine(line);
    const email = cells[emailIdx] ?? '';
    if (email.includes('@') && email.length >= 3) validRows += 1;
  }

  return {
    totalRows: dataLines.length,
    validRows,
    invalidRows: dataLines.length - validRows,
    headers,
  };
}
