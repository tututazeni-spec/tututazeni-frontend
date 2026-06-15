'use client';

import { useEffect } from 'react';

// Error Boundary global das rotas. Sem isto, um erro num componente mostra um
// ecrã branco a todos os utilizadores.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção, enviar para um serviço de observabilidade (Sentry, etc.).
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 16,
        textAlign: 'center',
        padding: 24,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a' }}>
        Algo correu mal.
      </h2>
      <p style={{ fontSize: 14, color: '#64748b', maxWidth: 420 }}>
        Ocorreu um erro inesperado. Pode tentar novamente; se o problema
        persistir, contacte o suporte.
      </p>
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
        Tentar novamente
      </button>
    </div>
  );
}
