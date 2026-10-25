// lib/safeHref.ts
// Filtra URLs vindas da BD/utilizadores antes de as pôr num href. `javascript:`, `data:` e
// `vbscript:` num <a href> são XSS armazenado; a CSP (sem 'unsafe-inline' em script-src) bloqueia
// `javascript:` mas é só defesa em profundidade. O backend valida os mesmos campos com @IsWebLink.

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** Devolve o URL se for seguro para um href; senão `undefined` (o <a> fica sem destino). */
export function safeHref(url: string | null | undefined): string | undefined {
  if (typeof url !== 'string') return undefined;
  const value = url.trim();
  if (!value) return undefined;
  // Esquema disfarçado com tabs/quebras de linha ("java\tscript:") — o browser remove-os ao analisar.
  if (/[\u0000-\u001f\u007f]/.test(value)) return undefined;
  if (value.startsWith('#')) return value;
  // Caminho interno; "//host" e "/\host" são protocol-relative e mudam de origem.
  if (value.startsWith('/')) {
    return value.startsWith('//') || value.startsWith('/\\')
      ? undefined
      : value;
  }
  try {
    return SAFE_SCHEMES.has(new URL(value).protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}
