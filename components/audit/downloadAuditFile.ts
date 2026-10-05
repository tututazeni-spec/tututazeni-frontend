// components/audit/downloadAuditFile.ts
// Descarrega um ficheiro de auditoria (exportação de relatório ou evidência).
// O backend revalida permissões e integridade (hash) em cada pedido.

import { API_URL } from '@/lib/api';

export async function downloadAuditFile(
  path: string,
  params: Record<string, string | number | undefined> = {},
  fallbackName = 'auditoria',
): Promise<void> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const query = qs.toString();
  const res = await fetch(`${API_URL}${path}${query ? `?${query}` : ''}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    let message = 'Não foi possível descarregar o ficheiro';
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
