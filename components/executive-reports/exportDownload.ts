// components/executive-reports/exportDownload.ts
// Descarrega um relatório executivo (GET /executive-reports/:id/export). O
// backend revalida as permissões em cada exportação (docs §12.5).

import { API_URL } from '@/lib/api';
import type { ExportFormat } from './reportTypes';

export async function downloadReport(
  id: number,
  format: ExportFormat,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/executive-reports/${id}/export?format=${format}`,
    { credentials: 'include' },
  );
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
  const filename = match
    ? decodeURIComponent(match[1])
    : `relatorio-${id}.${format.toLowerCase()}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
