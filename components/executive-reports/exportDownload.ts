// components/executive-reports/exportDownload.ts
// Descarrega um relatório executivo (GET /executive-reports/:id/export). O
// backend revalida as permissões em cada exportação (docs §12.5).

import { downloadFromApi } from '@/lib/download';
import type { ExportFormat } from './reportTypes';

export function downloadReport(id: number, format: ExportFormat): Promise<void> {
  return downloadFromApi(`/executive-reports/${id}/export`, {
    params: { format },
    fallbackName: `relatorio-${id}.${format.toLowerCase()}`,
    errorMessage: 'Não foi possível exportar o relatório',
  });
}
