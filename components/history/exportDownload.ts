// components/history/exportDownload.ts
// Descarrega um relatório do History (GET /history/reports/export). O backend
// revalida as permissões em cada exportação.

import { API_URL } from '@/lib/api';

export type ReportFormat = 'xlsx' | 'csv' | 'pdf';

export async function downloadHistoryReport(
  params: Record<string, string | number | undefined>,
  format: ReportFormat,
): Promise<void> {
  const qs = new URLSearchParams();
  const all: Record<string, string | number | undefined> = { ...params, format };
  for (const [k, v] of Object.entries(all)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const res = await fetch(`${API_URL}/history/reports/export?${qs.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    let message = 'Não foi possível exportar o relatório';
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
  const filename = match ? decodeURIComponent(match[1]) : `historico.${format}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
