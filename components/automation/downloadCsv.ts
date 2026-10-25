// components/automation/downloadCsv.ts
// Descarrega no browser o CSV devolvido pelos endpoints `*/export`
// ({ filename, content }).

import { saveBlob } from '@/lib/download';
import type { CsvExport } from './types';

export function downloadCsv({ filename, content }: CsvExport) {
  saveBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), filename);
}
