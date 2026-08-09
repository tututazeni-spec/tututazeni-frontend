// components/documents/utils.ts
// Formatação de tamanho de ficheiro. Extraído de
// app/(platform)/documents/page.tsx.

export function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
