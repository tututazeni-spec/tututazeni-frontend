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
 * Formata um valor em Kwanza — ex: 150000 → "150.000 AOA". Sem casas decimais
 * (padrão usado em toda a app). `null`/`undefined` devolvem '—'; 0 é um valor
 * válido e mostra "0 AOA" (não é tratado como ausência de valor).
 */
export function formatKz(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('Kz', 'AOA')
    .trim();
}

/**
 * Data numérica curta (ex: "05/03/2024"). Valores nulos/vazios devolvem '—'.
 * Substitui os `new Date(x).toLocaleDateString('pt-PT')` espalhados pelos módulos.
 */
export function formatDateNumeric(
  value: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  return formatDate(value, { month: '2-digit', ...opts });
}

/**
 * Tempo relativo com granularidade de minutos — "agora mesmo", "há 5min", "há 3h",
 * "há 2 dias". Valores nulos/vazios devolvem '—'.
 */
export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min}min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)} dias`;
}

/**
 * Tempo relativo com granularidade de dias — "hoje", "ontem", "há N dias".
 * Com `maxDays`, a partir desse número de dias mostra a data (formatDate).
 */
export function daysAgo(
  value: string | Date | null | undefined,
  opts: { maxDays?: number } = {},
): string {
  if (!value) return '—';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (opts.maxDays !== undefined && days >= opts.maxDays) return formatDate(value);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

/**
 * Tamanho de ficheiro legível — "512 B", "1.5 KB", "2.0 MB", "1.25 GB".
 * `null`/`undefined` devolvem '—'.
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
