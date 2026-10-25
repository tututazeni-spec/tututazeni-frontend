// components/audit/downloadAuditFile.ts
// Descarrega um ficheiro de auditoria (exportação de relatório ou evidência).
// O backend revalida permissões e integridade (hash) em cada pedido.

import { downloadFromApi, type DownloadParams } from '@/lib/download';

export function downloadAuditFile(
  path: string,
  params: DownloadParams = {},
  fallbackName = 'auditoria',
): Promise<void> {
  return downloadFromApi(path, { params, fallbackName });
}
