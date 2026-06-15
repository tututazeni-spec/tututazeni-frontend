'use client';

import { useEffect } from 'react';

// Captura erros que ocorrem no próprio root layout. Substitui o <html>/<body>
// porque corre acima de todos os layouts.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 16,
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          margin: 0,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a' }}>
          Erro inesperado da aplicação.
        </h2>
        <button
          onClick={reset}
          style={{
            padding: '10px 20px',
            background: '#1a4bb5',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
