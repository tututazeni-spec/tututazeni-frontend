// components/leave/downloadCsv.ts
// Descarrega no browser o CSV devolvido pelos endpoints de exportação do
// módulo Leave ({ filename, content }). O BOM faz o Excel abrir os acentos
// correctamente; o separador ';' já vem aplicado pelo backend.

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
