// components/leave/downloadCsv.ts
// Descarrega no browser o CSV devolvido pelos endpoints de exportação do
// módulo Leave ({ filename, content }). O BOM faz o Excel abrir os acentos
// correctamente; o separador ';' já vem aplicado pelo backend.

import { saveBlob } from '@/lib/download';

export function downloadCsv(filename: string, content: string): void {
  saveBlob(
    new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' }),
    filename,
  );
}
