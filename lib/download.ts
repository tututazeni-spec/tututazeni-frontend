// lib/download.ts
// Fonte única para descarregar ficheiros gerados pelo backend (exportações
// CSV/XLSX/PDF/ICS). Antes existiam ~15 cópias do mesmo fetch + blob + <a>,
// e a falta de um setTimeout no revokeObjectURL já causou ficheiros de 0
// bytes no Chrome — corrigir aqui corrige todos.

import { apiClient } from '@/lib/apiClient';

export type DownloadParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export interface DownloadOptions {
  /** Query string; valores vazios/undefined são omitidos. */
  params?: DownloadParams;
  /** Nome forçado — ignora o Content-Disposition do servidor. */
  filename?: string;
  /** Nome usado se o servidor não enviar Content-Disposition. */
  fallbackName?: string;
  /** Mensagem de erro quando a resposta não traz `message`. */
  errorMessage?: string;
}

/** Grava um blob no disco do utilizador via <a download>. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revogar já após o click() deixa o Chrome gravar o ficheiro com 0 bytes
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function buildQuery(params: DownloadParams = {}): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const query = qs.toString();
  return query ? `?${query}` : '';
}

function filenameFromDisposition(disposition: string): string | null {
  const match = /filename="([^"]+)"/.exec(disposition);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * GET `path` (relativo a /api, com cookie de sessão) e descarrega o corpo.
 * Lança Error com a `message` do backend quando existe, senão `errorMessage`.
 */
export async function downloadFromApi(
  path: string,
  {
    params,
    filename,
    fallbackName = 'ficheiro',
    errorMessage = 'Não foi possível descarregar o ficheiro',
  }: DownloadOptions = {},
): Promise<void> {
  const res = await apiClient.getRaw(path, { params, errorMessage });
  const blob = await res.blob();
  const name =
    filename ??
    filenameFromDisposition(res.headers.get('Content-Disposition') ?? '') ??
    fallbackName;
  saveBlob(blob, name);
}
