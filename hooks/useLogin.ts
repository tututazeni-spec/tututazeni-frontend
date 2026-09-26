// hooks/useLogin.ts
// Extraído de app/login/page.tsx — a página tinha o seu próprio mini
// cliente fetch (apiRequest) em vez de usar o apiClient canónico.

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';

// Lido directamente de window.location.search (em vez de
// next/navigation#useSearchParams) para não obrigar esta página a uma
// fronteira <Suspense> só por causa de um aviso de sessão opcional.
function idleLogoutNotice(): string | null {
  if (typeof window === 'undefined') return null;
  const reason = new URLSearchParams(window.location.search).get('reason');
  return reason === 'idle'
    ? 'A tua sessão expirou por inactividade. Inicia sessão novamente.'
    : null;
}

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNotice(idleLogoutNotice());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // O backend define o cookie httpOnly 'token'; o JS nunca toca no token.
      await apiClient.post('/auth/login', { email, password });
      // Navegação forçada para garantir que o middleware revê o cookie.
      window.location.href = '/dashboard';
    } catch (err) {
      reportError(err, { source: 'useLogin.handleSubmit' });
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPass,
    setShowPass,
    error,
    notice,
    loading,
    handleSubmit,
  };
}
