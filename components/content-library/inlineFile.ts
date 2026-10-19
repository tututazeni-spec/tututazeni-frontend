// components/content-library/inlineFile.ts
// Conteúdos da biblioteca podem ser uma ligação (URL) ou um ficheiro enviado
// inline como data URL base64 (até 5 MB — o backend não tem multipart, mesmo
// padrão de avatares/PDFs de lição). Aqui: limites, leitura e abertura.

import { apiClient } from '@/lib/apiClient';
import type { Content } from './types';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

// Espelha ALLOWED_MIME_TYPES do backend (src/common/validators/allowed-mime-types.ts).
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
];

export const ACCEPT_ATTR = ACCEPTED_MIME_TYPES.join(',');

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Devolve a mensagem de erro, ou null se o ficheiro é aceitável. */
export function validateUpload(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES)
    return `O ficheiro tem ${formatBytes(file.size)} — o máximo é 5 MB.`;
  if (file.size === 0) return 'O ficheiro está vazio.';
  if (!ACCEPTED_MIME_TYPES.includes(file.type))
    return 'Tipo de ficheiro não suportado (PDF, Office, imagem, vídeo MP4/WebM ou áudio).';
  return null;
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error('Falha a ler o ficheiro'));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlobUrl(dataUrl: string): string {
  const [head, b64] = dataUrl.split(',');
  const mime = /^data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

/** Abre o conteúdo: ligação normal, ou ficheiro inline (vai buscar ao detalhe). */
export async function openContent(
  content: Pick<Content, 'id' | 'url' | 'hasInlineFile'>,
) {
  let url = content.url;
  if (!url && content.hasInlineFile) {
    const full = await apiClient.get<Pick<Content, 'url'>>(
      `/content-library/${content.id}`,
    );
    url = full.url;
  }
  if (!url) return;
  window.open(url.startsWith('data:') ? dataUrlToBlobUrl(url) : url, '_blank');
}
