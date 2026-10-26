'use client';

// Página pública de definição de senha: serve o link de convite (primeiro acesso) e o de
// recuperação. A senha é escolhida pelo próprio utilizador — nenhum administrador a conhece.

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/;

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lido de window.location para não obrigar a fronteira <Suspense> (mesmo padrão do /login).
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!STRONG.test(password)) {
      setError(
        'A senha deve ter pelo menos 10 caracteres, com minúscula, maiúscula e dígito.',
      );
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setDone(true);
    } catch (err) {
      reportError(err, { source: 'ResetPasswordPage.handleSubmit' });
      setError(
        err instanceof ApiError && err.status === 400
          ? 'Este link é inválido ou expirou. Peça um novo convite ou recupere a senha.'
          : 'Não foi possível definir a senha. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  }

  const input =
    'w-full rounded-control border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-panel bg-surface p-8 shadow-lg">
        <h1 className="mb-1 text-xl font-bold text-brand">
          Definir a sua senha
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Escolha uma senha pessoal. Só você a conhece — nem os administradores
          a conseguem ver.
        </p>

        {token === '' ? (
          <AlertCard
            variant="danger"
            title="Link inválido"
            message="Abra o link completo que recebeu por email ou peça um novo."
          />
        ) : done ? (
          <>
            <AlertCard
              variant="success"
              title="Senha definida"
              message="Já pode iniciar sessão com a sua nova senha."
            />
            <a
              href="/login"
              className="mt-4 block rounded-control bg-brand py-2 text-center text-sm font-semibold text-white"
            >
              Ir para o login
            </a>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirmar senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={input}
              required
            />
            {error && (
              <AlertCard
                variant="danger"
                title="Não foi possível continuar"
                message={error}
              />
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={token === null}
              className="w-full"
            >
              {loading ? 'A guardar…' : 'Definir senha'}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
