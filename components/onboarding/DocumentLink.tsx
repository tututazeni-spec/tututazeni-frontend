// components/onboarding/DocumentLink.tsx
// Link "Abrir documento". `fileUrl` pode ser uma URL HTTPS ou um PDF inline
// (data URL base64, carregado no formulário): os browsers bloqueiam a
// navegação para `data:` num separador novo, por isso converte-se em Blob.

'use client';

import { openDataUrl } from '@/lib/openDataUrl';

export function DocumentLink({
  fileUrl,
  className,
}: {
  fileUrl: string;
  className?: string;
}) {
  if (!fileUrl.startsWith('data:')) {
    return (
      <a href={fileUrl} target="_blank" rel="noreferrer" className={className}>
        Abrir documento
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openDataUrl(fileUrl)}
      className={className}
    >
      Abrir documento
    </button>
  );
}
