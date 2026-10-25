// components/history/exportDownload.ts
// Descarrega um relatório do History (GET /history/reports/export). O backend
// revalida as permissões em cada exportação.

import { downloadFromApi, type DownloadParams } from '@/lib/download';

export type ReportFormat = 'xlsx' | 'csv' | 'pdf';

export function downloadHistoryReport(
  params: DownloadParams,
  format: ReportFormat,
): Promise<void> {
  return downloadFromApi('/history/reports/export', {
    params: { ...params, format },
    fallbackName: `historico.${format}`,
    errorMessage: 'Não foi possível exportar o relatório',
  });
}
