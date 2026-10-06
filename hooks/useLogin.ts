// hooks/useLogin.ts
// Extraído de app/login/page.tsx — a página tinha o seu próprio mini
// cliente fetch (apiRequest) em vez de usar o apiClient canónico.

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // O backend define o cookie httpOnly 'token'; o JS nunca toca no token.
      const res = await apiClient.post<{ mustChangePassword?: boolean }>(
        '/auth/login',
        { email, password },
      );
      // Navegação forçada para garantir que o middleware revê o cookie.
      // Conta convidada com password temporária (política de utilizadores):
      // vai directa ao separador Segurança para a trocar.
      window.location.href = res?.mustChangePassword
        ? '/settings?tab=seguranca&firstLogin=1'
        : '/dashboard';
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
    loading,
    handleSubmit,
  };
}
