// components/users/importUsersCsv.ts
// Parsing client-side do ficheiro de importação (docs/modulo_users.md Ponto
// 5 — Excel/CSV, mapeamento de campos, pré-visualização). Mantido puro (sem
// React) para ser testável isoladamente: ImportView.tsx só lê o ficheiro
// (FileReader) e a UI de mapeamento/pré-visualização, delega aqui o parsing
// do texto e a construção das linhas mapeadas que vão para
// POST /users/import.
//
// Só suporta CSV real (Excel exporta para CSV antes de importar) — ver
// nota em ImportView.tsx sobre o porquê de não se ter adicionado parsing de
// .xlsx binário aqui.

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  error?: string;
}

function splitLine(line: string): string[] {
  // CSV simples: vírgula como separador, sem suporte a vírgulas escapadas
  // dentro de aspas — mesmo limite documentado em
  // components/scalability/importUsersCsv.ts.
  return line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
}

export function parseCsv(text: string): ParsedCsv {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], error: 'O ficheiro está vazio.' };
  }

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);

  if (rows.length === 0) {
    return { headers, rows: [], error: 'Nenhuma linha de dados encontrada além do cabeçalho.' };
  }

  return { headers, rows };
}

export type ImportField =
  | 'email'
  | 'fullName'
  | 'employeeNumber'
  | 'phone'
  | 'departmentName'
  | 'positionName'
  | 'hireDate'
  | 'ignore';

export const IMPORT_FIELDS: ImportField[] = [
  'email',
  'fullName',
  'employeeNumber',
  'phone',
  'departmentName',
  'positionName',
  'hireDate',
  'ignore',
];

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  email: 'Email',
  fullName: 'Nome completo',
  employeeNumber: 'Nº de colaborador',
  phone: 'Telefone',
  departmentName: 'Departamento',
  positionName: 'Cargo',
  hireDate: 'Data de admissão',
  ignore: 'Ignorar coluna',
};

const HEADER_GUESSES: Record<string, ImportField> = {
  email: 'email',
  'e-mail': 'email',
  nome: 'fullName',
  fullname: 'fullName',
  'nome completo': 'fullName',
  'número de colaborador': 'employeeNumber',
  'numero de colaborador': 'employeeNumber',
  employeenumber: 'employeeNumber',
  'nº colaborador': 'employeeNumber',
  telefone: 'phone',
  phone: 'phone',
  departamento: 'departmentName',
  department: 'departmentName',
  cargo: 'positionName',
  position: 'positionName',
  'data de admissão': 'hireDate',
  'data de admissao': 'hireDate',
  hiredate: 'hireDate',
  admissao: 'hireDate',
};

/** Sugestão inicial de mapeamento pelo nome do cabeçalho — o utilizador confirma/corrige na UI. */
export function guessMapping(headers: string[]): ImportField[] {
  return headers.map((h) => HEADER_GUESSES[h.trim().toLowerCase()] ?? 'ignore');
}

export interface ImportRowDraft {
  line: number;
  email: string;
  fullName: string;
  employeeNumber?: string;
  phone?: string;
  departmentName?: string;
  positionName?: string;
  hireDate?: string;
  /** email ou nome em falta — a linha vai falhar a validação do backend. */
  missingRequired: boolean;
}

/** Aplica o mapeamento escolhido às linhas em bruto, produzindo o payload que vai para POST /users/import. */
export function mapRows(rows: string[][], mapping: ImportField[]): ImportRowDraft[] {
  const indexOf = (field: ImportField) => mapping.indexOf(field);
  const emailIdx = indexOf('email');
  const nameIdx = indexOf('fullName');
  const empIdx = indexOf('employeeNumber');
  const phoneIdx = indexOf('phone');
  const deptIdx = indexOf('departmentName');
  const posIdx = indexOf('positionName');
  const hireIdx = indexOf('hireDate');

  const cell = (cells: string[], idx: number) => (idx >= 0 ? cells[idx] || undefined : undefined);

  return rows.map((cells, i) => {
    const email = (emailIdx >= 0 ? cells[emailIdx] : '') ?? '';
    const fullName = (nameIdx >= 0 ? cells[nameIdx] : '') ?? '';
    return {
      line: i + 1,
      email,
      fullName,
      employeeNumber: cell(cells, empIdx),
      phone: cell(cells, phoneIdx),
      departmentName: cell(cells, deptIdx),
      positionName: cell(cells, posIdx),
      hireDate: cell(cells, hireIdx),
      missingRequired: !email || !fullName,
    };
  });
}
