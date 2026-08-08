// lib/format.ts
// Fonte única de formatação de datas/moeda/iniciais do frontend INNOVA.
//
// Antes desta extracção, cada página reimplementava a sua própria
// fmtDate/initials/fmtKz — ~30 cópias quase-idênticas, incluindo 3
// formatações de Kwanza (AOA) inconsistentes entre si (payslips vs
// organization vs crm/funders mostravam o mesmo valor de forma diferente).
// Ver memory project_innova_component_separation_audit.

const LOCALE = 'pt-AO';

const DEFAULT_DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

const DEFAULT_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Formata uma data no padrão por omissão da INNOVA (ex: "05 mar. 2024").
 * `opts` sobrepõe-se às omissões para variantes pontuais (ex: mês numérico).
 * Valores nulos/vazios devolvem '—'.
 */
export function formatDate(
  value: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(LOCALE, { ...DEFAULT_DATE_OPTS, ...opts });
}

/** Formata data+hora (ex: "05 mar., 14:30"). Valores nulos/vazios devolvem '—'. */
export function formatDateTime(
  value: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(LOCALE, { ...DEFAULT_DATETIME_OPTS, ...opts });
}

/** Formata só a hora (ex: "14:30"). Valores nulos/vazios devolvem '—'. */
export function formatTime(
  value: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  });
}

/** Iniciais (até 2 letras) a partir do nome completo — ex: "Ana Silva" → "AS". */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/**
 * Formata um valor em Kwanza — ex: 150000 → "150.000 Kz". Sem casas decimais
 * (padrão usado em toda a app). `null`/`undefined` devolvem '—'; 0 é um valor
 * válido e mostra "0 Kz" (não é tratado como ausência de valor).
 */
export function formatKz(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('AOA', 'Kz')
    .trim();
}
