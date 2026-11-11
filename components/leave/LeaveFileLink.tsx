// components/leave/LeaveFileLink.tsx
// Abre um comprovativo/anexo do módulo Leave. `fileUrl` pode ser uma URL normal
// ou um ficheiro inline (data URL base64, como o formulário o guarda): os
// browsers bloqueiam a navegação para `data:` num separador novo, por isso
// converte-se em Blob.

'use client';

import type { ReactNode } from 'react';
import { openDataUrl } from '@/lib/openDataUrl';

export interface LeaveFileLinkProps {
  fileUrl: string;
  className?: string;
  children: ReactNode;
}

export function LeaveFileLink({
  fileUrl,
  className,
  children,
}: LeaveFileLinkProps) {
  if (!fileUrl.startsWith('data:')) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openDataUrl(fileUrl)}
      className={className}
    >
      {children}
    </button>
  );
}
