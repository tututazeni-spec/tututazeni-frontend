// components/automation/downloadCsv.ts
// Descarrega no browser o CSV devolvido pelos endpoints `*/export`
// ({ filename, content }).

import type { CsvExport } from './types';

export function downloadCsv({ filename, content }: CsvExport) {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
