// components/leave/useDocUpload.ts
// Upload de comprovativos do módulo Leave: lê o ficheiro como data URL (PDF,
// PNG, JPG ou WebP, máx. 4 MB) para ir no campo `fileUrl`, que o backend
// aceita inline (LeaveDocumentInputDto). Partilhado por "Nova licença" e
// "Registar ausência".

'use client';

import { useRef, type ChangeEvent } from 'react';
import { useToast } from '@/providers/ToastProvider';

export const MAX_DOC_BYTES = 4 * 1024 * 1024;
export const DOC_ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp';

export interface UploadedDoc {
  fileUrl: string;
  mimeType: string;
  fileName: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler o ficheiro'));
    reader.readAsDataURL(file);
  });
}

/** `onLoaded(index, doc)` é chamado com a linha em que se carregou o ficheiro. */
export function useDocUpload(
  onLoaded: (index: number, doc: UploadedDoc) => void,
) {
  const notify = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const indexRef = useRef(0);

  const pick = (index: number) => {
    indexRef.current = index;
    inputRef.current?.click();
  };

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-seleccionar o mesmo ficheiro
    if (!file) return;
    if (file.size > MAX_DOC_BYTES) {
      notify({
        title: 'Ficheiro demasiado grande (máx. 4 MB)',
        intent: 'danger',
      });
      return;
    }
    if (!DOC_ACCEPT.split(',').includes(file.type)) {
      notify({
        title: 'Formato não suportado (PDF, PNG, JPG ou WebP)',
        intent: 'danger',
      });
      return;
    }
    try {
      const fileUrl = await readFileAsDataUrl(file);
      onLoaded(indexRef.current, {
        fileUrl,
        mimeType: file.type,
        fileName: file.name,
      });
    } catch {
      notify({ title: 'Não foi possível ler o ficheiro', intent: 'danger' });
    }
  };

  return { inputRef, pick, onChange };
}
