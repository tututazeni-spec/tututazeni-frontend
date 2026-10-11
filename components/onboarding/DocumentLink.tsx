// components/onboarding/DocumentLink.tsx
// Link "Abrir documento". `fileUrl` pode ser uma URL HTTPS ou um PDF inline
// (data URL base64, carregado no formulário): os browsers bloqueiam a
// navegação para `data:` num separador novo, por isso converte-se em Blob.

'use client';

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

  const open = async () => {
    const blob = await (await fetch(fileUrl)).blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <button type="button" onClick={open} className={className}>
      Abrir documento
    </button>
  );
}
