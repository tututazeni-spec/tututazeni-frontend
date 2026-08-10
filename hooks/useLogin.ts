// hooks/useLogin.ts
// Extraído de app/login/page.tsx — a página tinha o seu próprio mini
// cliente fetch (apiRequest) em vez de usar o apiClient canónico.

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';

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
      await apiClient.post('/auth/login', { email, password });
      // Navegação forçada para garantir que o middleware revê o cookie.
      window.location.href = '/dashboard';
    } catch (err) {
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
